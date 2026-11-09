import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProjectActions } from "@/components/admin/ProjectActions";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { projectImageUrl } from "@/lib/storage";
import { uuidSchema } from "@/lib/validation";
import type { Category, ProjectImage, ProjectWithRelations } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!uuidSchema.safeParse(id).success) notFound();

  await requireAdmin();

  const [{ rows: projectRows }, { rows: imageRows }, { rows: categories }] =
    await Promise.all([
      dbQuery<Record<string, unknown>>(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM projects p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.id = $1
         LIMIT 1`,
        [id],
      ),
      dbQuery<ProjectImage>(
        `SELECT * FROM project_images WHERE project_id = $1 ORDER BY sort_order ASC`,
        [id],
      ),
      dbQuery<Category>(
        `SELECT * FROM categories ORDER BY sort_order ASC, name ASC`,
      ),
    ]);

  const raw = projectRows[0];
  if (!raw) notFound();

  const typed: ProjectWithRelations = {
    id: String(raw.id),
    title: String(raw.title),
    slug: String(raw.slug),
    summary: (raw.summary as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    category_id: (raw.category_id as string | null) ?? null,
    location: (raw.location as string | null) ?? null,
    completed_on: raw.completed_on ? String(raw.completed_on).slice(0, 10) : null,
    featured: Boolean(raw.featured),
    status: (raw.status as ProjectWithRelations["status"]) ?? "draft",
    published_at: raw.published_at
      ? new Date(String(raw.published_at)).toISOString()
      : null,
    created_at: new Date(String(raw.created_at ?? Date.now())).toISOString(),
    updated_at: new Date(String(raw.updated_at ?? Date.now())).toISOString(),
    category:
      raw.category_name && raw.category_slug
        ? { name: String(raw.category_name), slug: String(raw.category_slug) }
        : null,
    images: imageRows,
  };

  const images = imageRows.map((i) => ({
    ...i,
    url: projectImageUrl(i.storage_path),
  }));

  return (
    <>
      <PageHeader
        title={typed.title}
        description={`/portfolio/${typed.slug}`}
        actions={
          <>
            <StatusBadge status={typed.status} />
            <Link href="/admin/projects" className="btn-outline btn-sm">
              All projects
            </Link>
          </>
        }
      />

      {created && (
        <p
          role="status"
          className="mb-6 border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Draft created. Upload photographs below, then publish when you are
          ready.
        </p>
      )}

      <div className="space-y-8">
        <ProjectForm project={typed} categories={categories} />
        <ImageManager projectId={typed.id} images={images} />
        <ProjectActions
          projectId={typed.id}
          slug={typed.slug}
          status={typed.status}
        />
      </div>
    </>
  );
}
