import { CategoryManager } from "@/components/admin/CategoryManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import type { Category } from "@/types";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();

  const [{ rows: categories }, { rows: projects }] = await Promise.all([
    dbQuery<Category>(`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`),
    dbQuery<{ category_id: string | null }>(`SELECT category_id FROM projects`),
  ]);

  const usage: Record<string, number> = {};
  for (const p of projects) {
    if (p.category_id) usage[p.category_id] = (usage[p.category_id] ?? 0) + 1;
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the portfolio. Categories are managed here — none are hard-coded."
      />
      <CategoryManager categories={categories} usage={usage} />
    </>
  );
}
