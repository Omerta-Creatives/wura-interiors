import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { cn, formatPrice } from "@/lib/utils";

type Props = { searchParams: Promise<{ status?: string }> };

const FILTERS = [
  { value: "", label: "All Orders" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending Payment" },
  { value: "in_production", label: "In Production" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_city: string;
  shipping_state: string;
  total: string;
  payment_status: string;
  order_status: string;
  paystack_reference: string;
  created_at: string;
};

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = FILTERS.some((f) => f.value === status) ? (status ?? "") : "";

  const params: unknown[] = [];
  let where = "";
  if (filter === "paid" || filter === "pending") {
    params.push(filter);
    where = "WHERE payment_status = $1";
  } else if (filter) {
    params.push(filter);
    where = "WHERE order_status = $1";
  }

  const { rows: orders } = await dbQuery<OrderRow>(
    `SELECT id, order_number, customer_name, customer_email, shipping_city, shipping_state,
            total::text, payment_status, order_status, paystack_reference, created_at
     FROM orders
     ${where}
     ORDER BY created_at DESC`,
    params,
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track Paystack payments, atelier production, and white-glove deliveries."
      />

      <nav aria-label="Filter orders" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"
            }
            aria-current={filter === f.value ? "true" : undefined}
            className={cn(
              "border px-4 py-1.5 text-sm",
              filter === f.value
                ? "border-ink bg-ink text-ivory"
                : "border-ink/25 hover:border-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <h2 className="text-2xl font-medium">No orders found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">
            Customer orders placed through the Wura Store and Paystack checkout
            will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-ivory-dark/60 text-xs uppercase tracking-wider text-ink/65">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfilment</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="transition-colors hover:bg-ivory/60"
                >
                  <td className="px-4 py-3.5 font-medium">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="underline decoration-gold/60 underline-offset-4 hover:text-gold-dark"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block font-medium">{o.customer_name}</span>
                    <span className="block text-xs text-ink/60">
                      {o.customer_email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink/75">
                    {o.shipping_city}, {o.shipping_state}
                  </td>
                  <td className="px-4 py-3.5 font-medium">
                    {formatPrice(Number(o.total))}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={o.payment_status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={o.order_status} />
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs text-ink/60">
                    {new Date(o.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
