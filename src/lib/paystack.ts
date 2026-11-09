import crypto from "node:crypto";
import { getPool } from "@/lib/db";
import { isDatabaseConfigured, isPaystackConfigured, paystackSecretKey } from "@/lib/env";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface PaystackInitializeInput {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  status: string; // "success" | "failed" | "abandoned"
  reference: string;
  amount: number; // in kobo
  currency: string;
  paid_at: string | null;
  channel: string | null;
  gateway_response: string | null;
  customer?: {
    email?: string;
  };
}

/**
 * Initializes a Paystack transaction.
 * Paystack expects the amount in kobo (1 NGN = 100 kobo).
 */
export async function initializePaystackTransaction(
  input: PaystackInitializeInput,
): Promise<{ ok: true; data: PaystackInitializeData } | { ok: false; error: string }> {
  if (!isPaystackConfigured) {
    return {
      ok: false,
      error: "Paystack secret key is not configured.",
    };
  }

  const amountKobo = Math.round(input.amountNaira * 100);
  if (amountKobo <= 0) {
    return { ok: false, error: "Invalid transaction amount." };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: ["card", "bank", "ussd", "bank_transfer"],
        metadata: input.metadata ?? {},
      }),
      cache: "no-store",
    });

    const json = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: PaystackInitializeData;
    };

    if (!response.ok || !json.status || !json.data) {
      return {
        ok: false,
        error: json.message ?? "Could not initialize Paystack payment.",
      };
    }

    return { ok: true, data: json.data };
  } catch (err) {
    console.error("[paystack] initialize error:", err);
    return {
      ok: false,
      error: "Unable to connect to Paystack right now. Please try again.",
    };
  }
}

/**
 * Verifies a Paystack transaction by its reference.
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<{ ok: true; data: PaystackVerifyData } | { ok: false; error: string }> {
  if (!isPaystackConfigured) {
    return {
      ok: false,
      error: "Paystack secret key is not configured.",
    };
  }

  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        cache: "no-store",
      },
    );

    const json = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: PaystackVerifyData;
    };

    if (!response.ok || !json.status || !json.data) {
      return {
        ok: false,
        error: json.message ?? "Could not verify payment with Paystack.",
      };
    }

    return { ok: true, data: json.data };
  } catch (err) {
    console.error("[paystack] verify error:", err);
    return {
      ok: false,
      error: "Unable to verify payment with Paystack right now.",
    };
  }
}

/**
 * Verifies the `x-paystack-signature` header on incoming Paystack webhooks
 * using HMAC SHA-512.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!paystackSecretKey || !signatureHeader) return false;

  const expected = crypto
    .createHmac("sha512", paystackSecretKey)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Idempotently marks an order as paid and confirmed in Neon Postgres and
 * decrements stock quantities for in-stock products.
 */
export async function markOrderPaidInDb(
  reference: string,
  paidAtIso?: string | null,
): Promise<{ ok: boolean; alreadyPaid?: boolean; error?: string }> {
  if (!isDatabaseConfigured) {
    return { ok: true };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderRes = await client.query<{
      id: string;
      payment_status: string;
      order_status: string;
    }>(
      `SELECT id, payment_status, order_status
       FROM orders
       WHERE paystack_reference = $1
       FOR UPDATE`,
      [reference],
    );

    const order = orderRes.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Order not found." };
    }

    if (order.payment_status === "paid") {
      await client.query("COMMIT");
      return { ok: true, alreadyPaid: true };
    }

    const nextOrderStatus =
      order.order_status === "pending" ? "confirmed" : order.order_status;

    await client.query(
      `UPDATE orders
       SET payment_status = 'paid',
           order_status = $2,
           paid_at = COALESCE($3::timestamptz, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [order.id, nextOrderStatus, paidAtIso ?? null],
    );

    // Decrement stock for in-stock products in this order
    const itemsRes = await client.query<{
      product_id: string;
      quantity: number;
    }>(`SELECT product_id, quantity FROM order_items WHERE order_id = $1`, [
      order.id,
    ]);

    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE products
         SET stock_quantity = GREATEST(0, stock_quantity - $2),
             updated_at = NOW()
         WHERE id::text = $1 AND availability = 'in_stock'`,
        [item.product_id, item.quantity],
      );
    }

    await client.query("COMMIT");
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[paystack] markOrderPaidInDb error:", err);
    return { ok: false, error: "Database update failed." };
  } finally {
    client.release();
  }
}
