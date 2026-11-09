import { ArrowUpRight, LogOut, Package, Shield, ShoppingBag, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { customerSignOut } from "@/actions/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireUser } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const orders = await getCustomerOrders(user.id, user.email);

  return (
    <section className="container-page py-12 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-8">
        <div>
          <p className="eyebrow">Client Portal</p>
          <h1 className="mt-2 text-3xl font-medium sm:text-4xl">
            Welcome, {user.name || "Client"}
          </h1>
          <p className="mt-1 text-sm text-ink/65">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="btn-outline">
              <Shield className="h-4 w-4 text-gold-dark" aria-hidden />
              Studio Admin
            </Link>
          )}
          <Link href="/store" className="btn-gold">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Browse Store
          </Link>
          <form action={customerSignOut}>
            <button type="submit" className="btn-outline">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        {/* Profile Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="border border-ink/15 bg-ivory-light p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-gold/40 bg-gold/15 text-gold-dark">
                <User className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-medium text-ink">Profile Details</h2>
                <p className="text-xs uppercase tracking-[0.18em] text-ink/50">
                  {user.role === "admin" ? "Administrator" : "Registered Client"}
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-t border-ink/10 pt-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">
                  Full Name
                </dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {user.name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">
                  Email Address
                </dt>
                <dd className="mt-0.5 text-ink/80">{user.email}</dd>
              </div>
              {user.phone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">
                    Phone / WhatsApp
                  </dt>
                  <dd className="mt-0.5 text-ink/80">{user.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>

        {/* Order History */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-medium">Order History</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 border border-dashed border-ink/20 bg-ivory-light p-12 text-center">
              <Package
                className="mx-auto h-10 w-10 text-gold-dark/70"
                strokeWidth={1.4}
                aria-hidden
              />
              <h3 className="mt-4 text-xl font-medium">No orders yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink/65">
                When you place an order through our Store, your order status, delivery details, and Paystack receipts will appear here.
              </p>
              <Link href="/store" className="btn-gold mt-6">
                Explore the Collection
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-ink/15 bg-ivory-light p-6 transition-colors hover:border-gold/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
                    <div>
                      <p className="font-mono text-xs font-semibold text-gold-dark">
                        {order.order_number}
                      </p>
                      <p className="mt-1 text-xs text-ink/60">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={order.payment_status} />
                      <StatusBadge status={order.order_status} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 text-sm text-ink/75">
                      <p>
                        <strong className="font-medium text-ink">
                          {order.items.reduce((s, i) => s + i.quantity, 0)}
                        </strong>{" "}
                        {order.items.reduce((s, i) => s + i.quantity, 0) === 1
                          ? "piece"
                          : "pieces"}{" "}
                        · Deliver to {order.shipping_city}, {order.shipping_state}
                      </p>
                      <p className="line-clamp-1 text-xs text-ink/60">
                        {order.items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-display text-2xl font-semibold text-ink">
                        {formatPrice(order.total)}
                      </p>
                      <Link
                        href={`/orders/${encodeURIComponent(order.order_number)}`}
                        className="inline-flex items-center gap-1 border border-ink/20 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
                      >
                        View Order
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
