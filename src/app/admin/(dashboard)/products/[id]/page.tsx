import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import type {
  ProductGalleryItem,
  StoreCategory,
  StoreProduct,
} from "@/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!uuidSchema.safeParse(id).success) notFound();

  await requireAdmin();

  const { rows } = await dbQuery<Record<string, unknown>>(
    `SELECT * FROM products WHERE id = $1 LIMIT 1`,
    [id],
  );
  const raw = rows[0];
  if (!raw) notFound();

  let gallery: ProductGalleryItem[] = [];
  if (Array.isArray(raw.gallery_paths)) {
    gallery = raw.gallery_paths as ProductGalleryItem[];
  } else if (typeof raw.gallery_paths === "string") {
    try {
      const parsed = JSON.parse(raw.gallery_paths);
      if (Array.isArray(parsed)) gallery = parsed;
    } catch {
      gallery = [];
    }
  }

  const product: StoreProduct = {
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug),
    category: (raw.category as StoreCategory) ?? "Seating",
    price: Number(raw.price ?? 0),
    summary: String(raw.summary ?? ""),
    description: String(raw.description ?? ""),
    dimensions: String(raw.dimensions ?? ""),
    materials: String(raw.materials ?? ""),
    finish: String(raw.finish ?? ""),
    lead_time: String(raw.lead_time ?? ""),
    availability:
      raw.availability === "made_to_order" ? "made_to_order" : "in_stock",
    stock_quantity: Number(raw.stock_quantity ?? 5),
    featured: Boolean(raw.featured),
    status: (raw.status as StoreProduct["status"]) ?? "published",
    image_path: String(raw.image_path ?? ""),
    alt_text: String(raw.alt_text ?? ""),
    gallery_paths: gallery,
  };

  return (
    <>
      <PageHeader
        title={product.name}
        description={`/store/${product.slug}`}
        actions={
          <>
            <StatusBadge status={product.status ?? "published"} />
            <Link href="/admin/products" className="btn-outline btn-sm">
              All products
            </Link>
          </>
        }
      />

      {created && (
        <p
          role="status"
          className="mb-6 border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Product created.
        </p>
      )}

      <ProductForm product={product} />
    </>
  );
}
