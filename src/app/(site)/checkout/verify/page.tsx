import { CheckCircle2, Clock, PackageCheck, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnMount } from "@/components/site/ClearCartOnMount";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { revalidatePublic } from "@/lib/action-helpers";
import { getOrderByReference, getSiteSettings } from "@/lib/data";
import { isPaystackConfigured } from "@/lib/env";
import {
  markOrderPaidInDb,
  verifyPaystackTransaction,
} from "@/lib/paystack";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmation — Wura Store",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
    order?: string;
  }>;
};

export default async function VerifyCheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref ?? "";
  const fallbackOrderNumber = params.order ?? "";

  const settings = await getSiteSettings();

  if (!reference) {
    return (
      <section className="container-page py-20 text-center">
        <h1 className="text-4xl font-medium">No payment reference provided</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink/70">
          If you just placed an order, check your email or account page for your
          order status.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/store" className="btn-dark">
            Return to Store
          </Link>
          <Link href="/account" className="btn-outline">
            View My Orders
          </Link>
        </div>
      </section>
    );
  }

  let paymentSucceeded = false;
  let verificationMessage = "";

  if (isPaystackConfigured) {
    const verify = await verifyPaystackTransaction(reference);
    if (verify.ok && verify.data.status === "success") {
      await markOrderPaidInDb(reference, verify.data.paid_at);
      revalidatePublic();
      paymentSucceeded = true;
    } else {
      verificationMessage = verify.ok
        ? `Paystack reported transaction status: ${verify.data.status}.`
        : verify.error;
    }
  } else {
    // Preview mode when PAYSTACK_SECRET_KEY is not yet configured
    await markOrderPaidInDb(reference, new Date().toISOString());
    paymentSucceeded = true;
    verificationMessage =
      "Order recorded in preview mode (configure PAYSTACK_SECRET_KEY in .env.local for live Paystack verification).";
  }

  const order = await getOrderByReference(reference);
  const displayOrderNumber =
    order?.order_number || fallbackOrderNumber || reference;

  return (
    <section className="container-page py-16 lg:py-24">
      {paymentSucceeded && <ClearCartOnMount />}

      <div className="mx-auto max-w-3xl border border-gold/40 bg-ivory-light p-8 shadow-xl sm:p-12">
        {paymentSucceeded ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-emerald-700/30 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </div>
            <p className="eyebrow mt-6">Acquisition Confirmed</p>
            <h1 className="mt-2 text-4xl font-medium sm:text-5xl">
              Thank you for your order
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/75">
              Your order <strong>{displayOrderNumber}</strong> has been received.
              Our studio concierge will contact you within 24 hours to confirm
              timber finishes and schedule white-glove delivery.
            </p>
            {verificationMessage && (
              <p className="mt-3 text-xs text-ink/55">{verificationMessage}</p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border border-red-700/30 bg-red-50 text-red-800">
              <XCircle className="h-8 w-8" aria-hidden />
            </div>
            <p className="eyebrow mt-6">Payment Verification</p>
            <h1 className="mt-2 text-3xl font-medium sm:text-4xl">
              We could not confirm your payment yet
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-ink/75">
              {verificationMessage ||
                "Your payment may still be processing or was cancelled."}
            </p>
          </div>
        )}

        {order && (
          <div className="mt-10 space-y-8 border-t border-ink/15 pt-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
                  Order Number
                </p>
                <p className="mt-1 font-display text-xl font-semibold">
                  {order.order_number}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
                  Payment Status
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-emerald-800">
                  {order.payment_status}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
                  Delivery Destination
                </p>
                <p className="mt-1 text-sm text-ink/80">
                  {order.shipping_city}, {order.shipping_state}
                </p>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-6">
              <h2 className="text-xl font-medium">Acquired pieces</h2>
              <ul className="mt-4 divide-y divide-ink/10">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-ink/60">
                        Qty {item.quantity} · {formatPrice(item.unit_price)} each
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
                <div className="flex justify-between text-ink/70">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink/70">
                  <span>White-Glove Delivery</span>
                  <span>
                    {order.delivery_fee === 0
                      ? "Complimentary"
                      : formatPrice(order.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-2xl font-semibold">
                  <span>Total Paid</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t border-ink/15 pt-8">
          {order && (
            <Link
              href={`/orders/${encodeURIComponent(order.order_number)}`}
              className="btn-dark"
            >
              <PackageCheck className="h-4 w-4" aria-hidden />
              Track Order Status
            </Link>
          )}
          <Link href="/store" className="btn-outline">
            Continue Shopping
          </Link>
          <WhatsAppButton
            number={settings.whatsapp_number}
            message={`Hello ${settings.business_name}, I have a question regarding my order ${displayOrderNumber}.`}
            label="Concierge Support"
            variant="outline"
          />
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-ink/55">
          <Clock className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
          Paystack Reference: <code className="font-mono">{reference}</code>
        </p>
      </div>
    </section>
  );
}
