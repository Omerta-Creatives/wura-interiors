"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, parseInput, type ActionState } from "@/lib/action-helpers";
import { getSessionUser } from "@/lib/auth";
import { getStoreProductById } from "@/lib/data";
import { getPool } from "@/lib/db";
import {
  SHIPPING_CONFIG,
  isDatabaseConfigured,
  isPaystackConfigured,
  siteUrl,
} from "@/lib/env";
import { initializePaystackTransaction } from "@/lib/paystack";
import {
  checkoutItemSchema,
  checkoutSchema,
  formToObject,
} from "@/lib/validation";

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `WURA-${y}${m}${d}-${suffix}`;
}

export async function createCheckoutOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseInput(checkoutSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(parsed.data.items_json);
  } catch {
    return fail("Invalid shopping bag items.");
  }

  const itemsResult = z
    .array(checkoutItemSchema)
    .min(1, "Your shopping bag is empty.")
    .max(50)
    .safeParse(rawItems);

  if (!itemsResult.success) {
    return fail("Your shopping bag is empty or contains invalid quantities.");
  }

  // Resolve authoritative product prices & availability on the server
  const verifiedItems: {
    productId: string;
    name: string;
    slug: string;
    imagePath: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    leadTime: string;
  }[] = [];

  for (const item of itemsResult.data) {
    const product = await getStoreProductById(item.productId);
    if (!product) {
      return fail(`One of the selected pieces is no longer available.`);
    }
    if (
      product.availability === "in_stock" &&
      typeof product.stock_quantity === "number" &&
      product.stock_quantity < item.quantity
    ) {
      return fail(
        product.stock_quantity === 0
          ? `“${product.name}” is currently out of stock.`
          : `Only ${product.stock_quantity} of “${product.name}” currently in stock.`,
      );
    }

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      imagePath: product.image_path,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
      leadTime: product.lead_time,
    });
  }

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee =
    subtotal >= SHIPPING_CONFIG.freeShippingThreshold
      ? 0
      : SHIPPING_CONFIG.standardWhiteGloveFee;
  const total = subtotal + deliveryFee;

  const orderNumber = generateOrderNumber();
  const paystackReference = `wura_${crypto.randomUUID().replace(/-/g, "")}`;
  const sessionUser = await getSessionUser();

  const d = parsed.data;

  // Initialize Paystack transaction if configured
  let paystackUrl: string | null = null;
  let paystackAccessCode: string | null = null;

  if (isPaystackConfigured) {
    const callbackUrl = `${siteUrl}/checkout/verify?reference=${encodeURIComponent(paystackReference)}`;
    const init = await initializePaystackTransaction({
      email: d.customer_email,
      amountNaira: total,
      reference: paystackReference,
      callbackUrl,
      metadata: {
        order_number: orderNumber,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        shipping_city: d.shipping_city,
        shipping_state: d.shipping_state,
        custom_fields: [
          {
            display_name: "Order Number",
            variable_name: "order_number",
            value: orderNumber,
          },
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: d.customer_name,
          },
        ],
      },
    });

    if (!init.ok) {
      return fail(init.error);
    }

    paystackUrl = init.data.authorization_url;
    paystackAccessCode = init.data.access_code;
  }

  // Persist order + order_items in Neon Postgres when DATABASE_URL is configured
  if (isDatabaseConfigured) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderRes = await client.query<{ id: string }>(
        `INSERT INTO orders (
           order_number, user_id, customer_name, customer_email, customer_phone,
           shipping_address, shipping_city, shipping_state, notes,
           subtotal, delivery_fee, total, currency,
           payment_status, order_status,
           paystack_reference, paystack_access_code, paystack_authorization_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'NGN', 'pending', 'pending', $13, $14, $15)
         RETURNING id`,
        [
          orderNumber,
          sessionUser?.id ?? null,
          d.customer_name,
          d.customer_email,
          d.customer_phone,
          d.shipping_address,
          d.shipping_city,
          d.shipping_state,
          d.notes,
          subtotal,
          deliveryFee,
          total,
          paystackReference,
          paystackAccessCode,
          paystackUrl,
        ],
      );

      const orderId = orderRes.rows[0].id;

      for (const item of verifiedItems) {
        await client.query(
          `INSERT INTO order_items (
             order_id, product_id, product_name, product_slug, product_image,
             unit_price, quantity, line_total, lead_time
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            orderId,
            item.productId,
            item.name,
            item.slug,
            item.imagePath,
            item.unitPrice,
            item.quantity,
            item.lineTotal,
            item.leadTime,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[checkout] database insert failed:", err);
      return fail("Could not create your order right now. Please try again.");
    } finally {
      client.release();
    }
  }

  if (paystackUrl) {
    redirect(paystackUrl);
  }

  // Fallback when PAYSTACK_SECRET_KEY is not yet configured in .env.local
  redirect(
    `/checkout/verify?reference=${encodeURIComponent(paystackReference)}&order=${encodeURIComponent(orderNumber)}`,
  );
}
