import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Hammer,
  Package,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getOrderByReference, getSiteSettings } from "@/lib/data";
import { productImageUrl } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = {
  title: "Order Status & Receipt — Wura Store",
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ reference: string }> };

const STEPS: {
  key: OrderStatus;
  label: string;
  description: string;
  icon: typeof Clock;
}[] = [
  {
    key: "confirmed",
    label: "Order Confirmed",
    description: "Payment verified & specifications logged",
    icon: CheckCircle2,
  },
  {
    key: "in_production",
    label: "In the Atelier",
    description: "Crafting, joinery & quality inspection",
    icon: Hammer,
  },
  {
    key: "out_for_delivery",
    label: "White-Glove Transit",
    description: "Scheduled delivery with installation team",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered & Placed",
    description: "Installed in your residence or workspace",
    icon: Package,
  },
];

const STEP_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  in_production: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
};

export default async function OrderTrackingPage({ params }: Props) {
  const { reference } = await params;
  const decoded = decodeURIComponent(reference);

  const [order, settings] = await Promise.all([
    getOrderByReference(decoded),
    getSiteSettings(),
  ]);

  if (!order) notFound();

  const currentRank = STEP_ORDER[order.order_status] ?? 0;

  return (
    <section className="container-page py-12 lg:py-20">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink hover:text-gold-dark"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          My Account &amp; Orders
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.payment_status} />
          <StatusBadge status={order.order_status} />
        </div>
      </div>

      <div className="border border-ink/15 bg-ivory-light p-6 sm:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/15 pb-6">
          <div>
            <p className="eyebrow">Wura Store Order Receipt</p>
            <h1 className="mt-2 text-3xl font-medium sm:text-4xl">
              {order.order_number}
            </h1>
            <p className="mt-1 text-xs text-ink/60">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              · Paystack Reference:{" "}
              <code className="font-mono">{order.paystack_reference}</code>
            </p>
          </div>
          <p className="font-display text-3xl font-semibold text-ink">
            {formatPrice(order.total)}
          </p>
        </div>

        {/* Progress Tracker */}
        {order.order_status !== "cancelled" && (
          <div className="my-10 grid gap-4 sm:grid-cols-4">
            {STEPS.map((step, idx) => {
              const rank = idx + 1;
              const done = currentRank >= rank;
              const Icon = step.icon;
              return (
                <div
                  key={step.key}
                  className={cn(
                    "border p-4 transition-colors",
                    done
                      ? "border-gold bg-ink text-ivory"
                      : "border-ink/15 bg-ivory text-ink/55",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        done ? "text-gold" : "text-ink/40",
                      )}
                      aria-hidden
                    />
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                      0{rank}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg font-medium">
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      done ? "text-ivory/70" : "text-ink/50",
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Line Items */}
        <div className="mt-8">
          <h2 className="text-2xl font-medium">Ordered pieces</h2>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink/10">
                    <Image
                      src={productImageUrl(item.product_image)}
                      alt={item.product_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/store/${item.product_slug}`}
                      className="font-display text-xl font-medium hover:text-gold-dark"
                    >
                      {item.product_name}
                    </Link>
                    <p className="mt-1 text-xs text-ink/60">
                      Quantity: {item.quantity} · {formatPrice(item.unit_price)}{" "}
                      each
                      {item.lead_time ? ` · ${item.lead_time}` : ""}
                    </p>
                  </div>
                </div>
                <span className="font-display text-xl font-semibold">
                  {formatPrice(item.line_total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Delivery & Totals */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-2 text-sm lg:col-span-7">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
              White-Glove Delivery Destination
            </h3>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-ink/75">
              {order.shipping_address}
              <br />
              {order.shipping_city}, {order.shipping_state}
            </p>
            <p className="text-xs text-ink/60">
              {order.customer_email} · {order.customer_phone}
            </p>
            {order.notes && (
              <p className="mt-3 border-l-2 border-gold pl-3 text-xs italic text-ink/75">
                Notes: {order.notes}
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-ink/10 pt-4 text-sm lg:col-span-5 lg:border-t-0 lg:pt-0">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>White-Glove Delivery &amp; Installation</span>
              <span>
                {order.delivery_fee === 0
                  ? "Complimentary"
                  : formatPrice(order.delivery_fee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-ink/15 pt-3 font-display text-2xl font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-6">
          <p className="text-xs text-ink/60">
            Need to adjust delivery timing or finish details? Speak with our
            concierge.
          </p>
          <WhatsAppButton
            number={settings.whatsapp_number}
            message={`Hello ${settings.business_name}, I am enquiring about my order ${order.order_number}.`}
            label="WhatsApp Concierge"
            variant="dark"
          />
        </div>
      </div>
    </section>
  );
}
