import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { productImageUrl } from "@/lib/storage";
import { cn, formatPrice } from "@/lib/utils";

type Props = { searchParams: Promise<{ status?: string }> };

const FILTERS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
];

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  availability: string;
  stock_quantity: number;
  featured: boolean;
  status: string;
  image_path: string;
};

export const metadata = { title: "Store products" };

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = FILTERS.some((f) => f.value === status) ? (status ?? "") : "";

  const params: unknown[] = [];
  let where = "";
  if (filter) {
    params.push(filter);
    where = "WHERE status = $1";
  }

  const { rows: products } = await dbQuery<ProductRow>(
    `SELECT id, name, slug, category, price, availability, stock_quantity, featured, status, image_path
     FROM products
     ${where}
     ORDER BY sort_order ASC, created_at DESC`,
    params,
  );

  return (
    <>
      <PageHeader
        title="Store products"
        description="Manage furniture, lighting, and collectible pieces available for Paystack checkout."
        actions={
          <Link href="/admin/products/new" className="btn-dark">
            <Plus className="h-4 w-4" aria-hidden /> New product
          </Link>
        }
      />

      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value ? `/admin/products?status=${f.value}` : "/admin/products"
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

      {products.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <h2 className="text-2xl font-medium">
            {filter ? `No ${filter} products` : "No store products in database yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">
            {filter
              ? "Products with this status will appear here."
              : "Run db/seed.sql in your Neon SQL Editor to load the initial 8 Wura Collection pieces, or add your first piece now."}
          </p>
          {!filter && (
            <Link href="/admin/products/new" className="btn-dark mt-6">
              <Plus className="h-4 w-4" aria-hidden /> Add the first product
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-ink/10 border border-ink/10 bg-white">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-ivory/60"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden bg-ink/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImageUrl(p.image_path)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-sm text-ink/60">
                    {p.category} · {formatPrice(Number(p.price))} ·{" "}
                    {p.availability === "in_stock"
                      ? `In stock (${p.stock_quantity})`
                      : "Made to order"}
                    {p.featured && " · Featured"}
                  </span>
                </span>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
