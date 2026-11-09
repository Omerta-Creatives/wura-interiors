import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProjectDetail } from "@/components/site/ProjectDetail";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/data";
import { dbQuery } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import type { ProjectImage, ProjectWithRelations, SiteSettings } from "@/types";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Preview project" };

export default async function PreviewProjectPage({ params }: Props) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  await requireAdmin();

  const [{ rows: projectRows }, { rows: imageRows }, { rows: settingsRows }] =
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
      dbQuery<Partial<SiteSettings>>(
        `SELECT * FROM site_settings WHERE id = 1 LIMIT 1`,
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

  return (
    <div className="-mx-5 -my-8 sm:-mx-8 lg:-mx-12">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-gold px-5 py-3 text-sm text-ink">
        <p className="flex items-center gap-3">
          <strong>Preview</strong> <StatusBadge status={typed.status} />
          <span>This is how the project page will look to visitors.</span>
        </p>
        <Link
          href={`/admin/projects/${typed.id}`}
          className="underline underline-offset-4"
        >
          Back to editor
        </Link>
      </div>
      <div className="bg-ivory">
        <ProjectDetail
          project={typed}
          settings={{ ...DEFAULT_SETTINGS, ...(settingsRows[0] ?? {}) }}
        />
      </div>
    </div>
  );
}
