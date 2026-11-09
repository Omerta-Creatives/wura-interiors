"use server";

import { z } from "zod";
import {
  UNAUTHORISED,
  dbFailure,
  fail,
  parseInput,
  revalidatePublic,
  succeed,
  type ActionResult,
} from "@/lib/action-helpers";
import { getAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { moveRow } from "@/lib/reorder";
import { imageDetailsSchema, uuidSchema } from "@/lib/validation";

const uploadedImageSchema = z.object({
  path: z.string().min(2).max(2_000_000),
  width: z.number().int().positive().max(20000).nullable(),
  height: z.number().int().positive().max(20000).nullable(),
});

export async function addProjectImages(
  projectId: string,
  uploads: { path: string; width: number | null; height: number | null }[],
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const id = uuidSchema.safeParse(projectId);
  const items = z.array(uploadedImageSchema).min(1).max(40).safeParse(uploads);
  if (!id.success || !items.success) return fail("Invalid upload.");

  const validPath = (p: string) =>
    p.startsWith("/images/") ||
    p.startsWith("https://") ||
    p.startsWith("data:image/");
  if (!items.data.every((i) => validPath(i.path))) {
    return fail("Invalid image path or format.");
  }

  try {
    const { rows: projectRows } = await dbQuery<{ id: string }>(
      `SELECT id FROM projects WHERE id = $1 LIMIT 1`,
      [id.data],
    );
    if (!projectRows[0]) return fail("Project not found.");

    const { rows: existing } = await dbQuery<{
      sort_order: number;
      is_cover: boolean;
    }>(`SELECT sort_order, is_cover FROM project_images WHERE project_id = $1`, [
      id.data,
    ]);

    const maxOrder = existing.reduce((m, r) => Math.max(m, r.sort_order), -1);
    const hasCover = existing.some((r) => r.is_cover);

    for (let index = 0; index < items.data.length; index++) {
      const item = items.data[index];
      await dbQuery(
        `INSERT INTO project_images (project_id, storage_path, width, height, sort_order, is_cover)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id.data,
          item.path,
          item.width,
          item.height,
          maxOrder + 1 + index,
          !hasCover && index === 0,
        ],
      );
    }

    revalidatePublic();
    return succeed(
      `${items.data.length} image${items.data.length === 1 ? "" : "s"} added.`,
    );
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function updateImageDetails(
  imageId: string,
  details: { caption: string; alt_text: string },
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const id = uuidSchema.safeParse(imageId);
  if (!id.success) return fail("Invalid image.");

  const parsed = parseInput(imageDetailsSchema, details);
  if (parsed.error) return parsed.error;

  try {
    const { rowCount } = await dbQuery(
      `UPDATE project_images SET caption = $1, alt_text = $2 WHERE id = $3`,
      [parsed.data.caption, parsed.data.alt_text, id.data],
    );
    if (!rowCount) return fail("Image not found.");

    revalidatePublic();
    return succeed("Image details saved.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function moveImage(
  projectId: string,
  imageId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const pid = uuidSchema.safeParse(projectId);
  const iid = uuidSchema.safeParse(imageId);
  if (!pid.success || !iid.success || (direction !== "up" && direction !== "down")) {
    return fail("Invalid request.");
  }

  const result = await moveRow("project_images", iid.data, direction, {
    column: "project_id",
    value: pid.data,
  });
  if (!result.ok) return fail(result.error ?? "Could not reorder images.");

  revalidatePublic();
  return succeed();
}

export async function setCoverImage(
  projectId: string,
  imageId: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const pid = uuidSchema.safeParse(projectId);
  const iid = uuidSchema.safeParse(imageId);
  if (!pid.success || !iid.success) return fail("Invalid request.");

  try {
    const { rows } = await dbQuery<{ id: string }>(
      `SELECT id FROM project_images WHERE id = $1 AND project_id = $2 LIMIT 1`,
      [iid.data, pid.data],
    );
    if (!rows[0]) return fail("Image not found.");

    await dbQuery(
      `UPDATE project_images SET is_cover = false WHERE project_id = $1 AND is_cover = true`,
      [pid.data],
    );
    await dbQuery(`UPDATE project_images SET is_cover = true WHERE id = $1`, [
      iid.data,
    ]);

    revalidatePublic();
    return succeed("Cover image updated.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const iid = uuidSchema.safeParse(imageId);
  if (!iid.success) return fail("Invalid image.");

  try {
    const { rows: imageRows } = await dbQuery<{
      id: string;
      project_id: string;
      is_cover: boolean;
    }>(
      `SELECT id, project_id, is_cover FROM project_images WHERE id = $1 LIMIT 1`,
      [iid.data],
    );
    const image = imageRows[0];
    if (!image) return fail("Image not found.");

    const { rows: siblings } = await dbQuery<{ id: string }>(
      `SELECT id FROM project_images WHERE project_id = $1 ORDER BY sort_order ASC`,
      [image.project_id],
    );
    const remaining = siblings.filter((s) => s.id !== image.id);

    if (remaining.length === 0) {
      const { rows: projRows } = await dbQuery<{ status: string }>(
        `SELECT status FROM projects WHERE id = $1 LIMIT 1`,
        [image.project_id],
      );
      if (projRows[0]?.status === "published") {
        return fail(
          "A published project needs at least one image. Unpublish it before removing the last image.",
        );
      }
    }

    await dbQuery(`DELETE FROM project_images WHERE id = $1`, [image.id]);

    if (image.is_cover && remaining.length > 0) {
      await dbQuery(`UPDATE project_images SET is_cover = true WHERE id = $1`, [
        remaining[0].id,
      ]);
    }

    revalidatePublic();
    return succeed("Image deleted.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
