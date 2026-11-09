"use server";

import { redirect } from "next/navigation";
import {
  UNAUTHORISED,
  dbFailure,
  fail,
  parseInput,
  revalidatePublic,
  succeed,
  type ActionResult,
  type ActionState,
} from "@/lib/action-helpers";
import { getAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import {
  formToObject,
  projectSchema,
  projectStatusSchema,
  uuidSchema,
} from "@/lib/validation";

const SLUG_TAKEN = "Another project already uses this slug.";

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsed = parseInput(projectSchema, formToObject(formData, ["featured"]));
  if (parsed.error) return parsed.error;

  let createdId: string;
  try {
    const { rows } = await dbQuery<{ id: string }>(
      `INSERT INTO projects (
         title, slug, summary, description, category_id, location, completed_on, featured, status, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
       RETURNING id`,
      [
        parsed.data.title,
        parsed.data.slug,
        parsed.data.summary,
        parsed.data.description,
        parsed.data.category_id,
        parsed.data.location,
        parsed.data.completed_on,
        parsed.data.featured,
        admin.user.id,
      ],
    );
    createdId = rows[0].id;
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }

  redirect(`/admin/projects/${createdId}?created=1`);
}

export async function updateProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid project.");

  const parsed = parseInput(projectSchema, formToObject(formData, ["featured"]));
  if (parsed.error) return parsed.error;

  try {
    const { rowCount } = await dbQuery(
      `UPDATE projects
       SET title = $1,
           slug = $2,
           summary = $3,
           description = $4,
           category_id = $5,
           location = $6,
           completed_on = $7,
           featured = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [
        parsed.data.title,
        parsed.data.slug,
        parsed.data.summary,
        parsed.data.description,
        parsed.data.category_id,
        parsed.data.location,
        parsed.data.completed_on,
        parsed.data.featured,
        id.data,
      ],
    );
    if (!rowCount) return fail("Project not found.");

    revalidatePublic();
    return succeed("Project details saved.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }
}

export async function setProjectStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  const parsedStatus = projectStatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return fail("Invalid request.");

  try {
    if (parsedStatus.data === "published") {
      const { rows: images } = await dbQuery<{ id: string; is_cover: boolean }>(
        `SELECT id, is_cover FROM project_images WHERE project_id = $1 ORDER BY sort_order ASC`,
        [parsedId.data],
      );
      if (images.length === 0) {
        return fail("Upload or add at least one image before publishing this project.");
      }

      const hasCover = images.some((i) => i.is_cover);
      if (!hasCover) {
        await dbQuery(`UPDATE project_images SET is_cover = true WHERE id = $1`, [
          images[0].id,
        ]);
      }
    }

    const { rowCount } = await dbQuery(
      `UPDATE projects
       SET status = $1,
           published_at = CASE WHEN $1 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
           updated_at = NOW()
       WHERE id = $2`,
      [parsedStatus.data, parsedId.data],
    );

    if (!rowCount) return fail("Project not found.");

    revalidatePublic();
    const messages = {
      published: "Project published — it is now live on the website.",
      draft: "Project unpublished and returned to draft.",
      archived: "Project archived and removed from the website.",
    } as const;
    return succeed(messages[parsedStatus.data]);
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return fail("Invalid project.");

  try {
    await dbQuery(`DELETE FROM projects WHERE id = $1`, [parsedId.data]);
    revalidatePublic();
    return succeed("Project deleted.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
