import { CheckCircle2, Circle, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { isPaystackConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/utils";
import type { SiteSettings } from "@/types";

export default async function OverviewPage() {
  const { profile } = await requireAdmin();

  const [projectsRes, categoriesRes, servicesRes, productsRes, ordersRes, settingsRes] =
    await Promise.all([
      dbQuery<{ status: string }>(`SELECT status FROM projects`),
      dbQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM categories`),
      dbQuery<{ status: string }>(`SELECT status FROM services`),
      dbQuery<{ status: string }>(`SELECT status FROM products`),
      dbQuery<{ payment_status: string; order_status: string; total: string }>(
        `SELECT payment_status, order_status, total::text FROM orders`,
      ),
      dbQuery<Partial<SiteSettings>>(`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`),
    ]);

  const settings = settingsRes.rows[0] ?? {};
  const projectRows = projectsRes.rows;
  const serviceRows = servicesRes.rows;
  const productRows = productsRes.rows;
  const orderRows = ordersRes.rows;
  const categoryCount = Number(categoriesRes.rows[0]?.count ?? 0);

  const count = (rows: { status: string }[], status: string) =>
    rows.filter((r) => r.status === status).length;

  const paidOrders = orderRows.filter((o) => o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const pendingOrdersCount = orderRows.filter(
    (o) => o.order_status !== "delivered" && o.order_status !== "cancelled",
  ).length;

  const stats = [
    { label: "Store revenue (paid)", value: formatPrice(totalRevenue) },
    { label: "Paid orders", value: String(paidOrders.length) },
    { label: "Active orders", value: String(pendingOrdersCount) },
    { label: "Published products", value: String(count(productRows, "published")) },
    { label: "Published projects", value: String(count(projectRows, "published")) },
    { label: "Draft projects", value: String(count(projectRows, "draft")) },
    { label: "Published services", value: String(count(serviceRows, "published")) },
    { label: "Portfolio categories", value: String(categoryCount) },
  ];

  const checklist = [
    {
      done: Boolean(settings.logo_path),
      label: "Official logo uploaded",
      href: "/admin/settings",
    },
    {
      done: Boolean(settings.whatsapp_number),
      label: "Verified WhatsApp number added",
      href: "/admin/settings",
    },
    {
      done: Boolean(settings.email || settings.phone),
      label: "Approved email or phone number added",
      href: "/admin/settings",
    },
    {
      done: Boolean(settings.about_story || settings.design_philosophy),
      label: "Approved company description added",
      href: "/admin/settings",
    },
    {
      done: isPaystackConfigured,
      label: "Paystack payment keys configured",
      href: "/admin/orders",
    },
    {
      done: count(productRows, "published") > 0,
      label: "At least one store product published",
      href: "/admin/products",
    },
    {
      done: categoryCount > 0,
      label: "Portfolio categories created",
      href: "/admin/categories",
    },
    {
      done: count(serviceRows, "published") > 0,
      label: "At least one service published",
      href: "/admin/services",
    },
    {
      done: count(projectRows, "published") > 0,
      label: "At least one project published",
      href: "/admin/projects",
    },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Signed in as ${profile.email ?? "administrator"}.`}
        actions={
          <>
            <Link href="/admin/products/new" className="btn-gold">
              <Plus className="h-4 w-4" aria-hidden /> New product
            </Link>
            <Link href="/admin/projects/new" className="btn-dark">
              <Plus className="h-4 w-4" aria-hidden /> New project
            </Link>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="admin-card">
            <dt className="text-xs uppercase tracking-wider text-ink/60">{s.label}</dt>
            <dd className="mt-2 font-display text-3xl sm:text-4xl">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="admin-card mt-8" aria-labelledby="readiness">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="readiness" className="text-2xl font-medium">
            Launch readiness
          </h2>
          <p className="text-sm text-ink/60">
            {doneCount} of {checklist.length} complete
          </p>
        </div>
        <p className="mt-1 text-sm text-ink/70">
          Ensure store products, Paystack keys, portfolio projects, and contact details are ready for launch.
        </p>
        <ul className="mt-5 divide-y divide-ink/10">
          {checklist.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="flex items-center gap-3 text-sm">
                {item.done ? (
                  <CheckCircle2
                    className="h-5 w-5 text-emerald-700"
                    aria-label="Done"
                  />
                ) : (
                  <Circle
                    className="h-5 w-5 text-ink/30"
                    aria-label="Not done"
                  />
                )}
                <span className={item.done ? "text-ink/60" : ""}>
                  {item.label}
                </span>
              </span>
              {!item.done && (
                <Link
                  href={item.href}
                  className="text-sm underline underline-offset-4 hover:text-gold-dark"
                >
                  Configure
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
