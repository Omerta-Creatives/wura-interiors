import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="New store product"
        description="Add a collectible furniture, lighting, or decor piece to the Wura Store."
        actions={
          <Link href="/admin/products" className="btn-outline">
            Cancel
          </Link>
        }
      />
      <ProductForm />
    </>
  );
}
