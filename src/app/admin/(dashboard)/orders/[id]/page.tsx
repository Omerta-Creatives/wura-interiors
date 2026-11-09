import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControls } from "@/components/admin/OrderStatusControls";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { productImageUrl } from "@/lib/storage";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";
import type { OrderItem, OrderStatus, PaymentStatus } from "@/types";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Order details" };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  await requireAdmin();

  const [{ rows: orderRows }, { rows: itemRows }] = await Promise.all([
    dbQuery<Record<string, unknown>>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1`,
      [id],
    ),
    dbQuery<OrderItem>(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
      [id],
    ),
  ]);

  const raw = orderRows[0];
  if (!raw) notFound();

  const orderNumber = String(raw.order_number);
  const customerName = String(raw.customer_name);
  const customerEmail = String(raw.customer_email);
  const customerPhone = String(raw.customer_phone);
  const shippingAddress = String(raw.shipping_address);
  const shippingCity = String(raw.shipping_city);
  const shippingState = String(raw.shipping_state);
  const notes = (raw.notes as string | null) ?? null;
  const subtotal = Number(raw.subtotal ?? 0);
  const deliveryFee = Number(raw.delivery_fee ?? 0);
  const total = Number(raw.total ?? 0);
  const paymentStatus = (raw.payment_status as PaymentStatus) ?? "pending";
  const orderStatus = (raw.order_status as OrderStatus) ?? "pending";
  const paystackReference = String(raw.paystack_reference);
  const paidAt = raw.paid_at ? new Date(String(raw.paid_at)) : null;
  const createdAt = new Date(String(raw.created_at ?? Date.now()));

  const waCustomerHref = whatsappLink(
    customerPhone.startsWith("+") ? customerPhone : `+234${customerPhone.replace(/^0/, "")}`,
    `Hello ${customerName}, this is Wura Interiors regarding your order ${orderNumber}.`,
  );

  return (
    <>
      <PageHeader
        title={`Order ${orderNumber}`}
        description={`Placed on ${createdAt.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })} · Reference: ${paystackReference}`}
        actions={
          <>
            <StatusBadge status={paymentStatus} />
            <StatusBadge status={orderStatus} />
            <Link href="/admin/orders" className="btn-outline btn-sm">
              All orders
            </Link>
          </>
        }
      />

      <div className="space-y-8">
        <OrderStatusControls
          orderId={String(raw.id)}
          currentOrderStatus={orderStatus}
          currentPaymentStatus={paymentStatus}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="admin-card space-y-3">
            <h2 className="text-xl font-medium">Customer &amp; contact</h2>
            <dl className="divide-y divide-ink/10 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-ink/60">Name</dt>
                <dd className="font-medium">{customerName}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-ink/60">Email</dt>
                <dd>
                  <a
                    href={`mailto:${customerEmail}`}
                    className="underline underline-offset-4 hover:text-gold-dark"
                  >
                    {customerEmail}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-ink/60">Phone</dt>
                <dd className="flex items-center gap-3">
                  <span>{customerPhone}</span>
                  {waCustomerHref && (
                    <a
                      href={waCustomerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-gold-dark underline"
                    >
                      WhatsApp
                    </a>
                  )}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-ink/60">Paystack Ref</dt>
                <dd className="font-mono text-xs">{paystackReference}</dd>
              </div>
              {paidAt && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-ink/60">Paid at</dt>
                  <dd>{paidAt.toLocaleString("en-GB")}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="admin-card space-y-3">
            <h2 className="text-xl font-medium">White-glove delivery address</h2>
            <p className="text-sm leading-relaxed text-ink/80">
              {shippingAddress}
              <br />
              {shippingCity}, {shippingState}
              <br />
              Nigeria
            </p>
            {notes && (
              <div className="border-t border-ink/10 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                  Bespoke Finish / Delivery Notes
                </p>
                <p className="mt-1 text-sm text-ink/80">{notes}</p>
              </div>
            )}
          </section>
        </div>

        <section className="admin-card space-y-5">
          <h2 className="text-2xl font-medium">Ordered pieces</h2>
          <ul className="divide-y divide-ink/10">
            {itemRows.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
              >
                <div className="flex items-center gap-4">
                  <span className="h-16 w-16 shrink-0 overflow-hidden bg-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImageUrl(item.product_image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <div>
                    <Link
                      href={`/store/${item.product_slug}`}
                      target="_blank"
                      className="font-medium hover:text-gold-dark"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-ink/60">
                      {formatPrice(Number(item.unit_price))} × {item.quantity}
                      {item.lead_time ? ` · ${item.lead_time}` : ""}
                    </p>
                  </div>
                </div>
                <span className="font-display text-xl font-semibold">
                  {formatPrice(Number(item.line_total))}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-ink/15 pt-4 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>White-Glove Delivery &amp; Installation</span>
              <span>
                {deliveryFee === 0 ? "Complimentary" : formatPrice(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-2xl font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
