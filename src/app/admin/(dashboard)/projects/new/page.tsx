import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import type { Category } from "@/types";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const { rows: categories } = await dbQuery<Category>(
    `SELECT * FROM categories ORDER BY sort_order ASC, name ASC`,
  );

  return (
    <>
      <PageHeader
        title="New project"
        description="Projects start as drafts and stay hidden until you publish them."
        actions={
          <Link href="/admin/projects" className="btn-outline">
            Cancel
          </Link>
        }
      />
      <ProjectForm categories={categories} />
    </>
  );
}
