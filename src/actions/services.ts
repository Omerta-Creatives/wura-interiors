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
import { moveRow } from "@/lib/reorder";
import { formToObject, serviceSchema, uuidSchema } from "@/lib/validation";

const SLUG_TAKEN = "Another service already uses this slug.";

export async function createService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsed = parseInput(serviceSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  try {
    const { rows: lastRows } = await dbQuery<{ sort_order: number }>(
      `SELECT sort_order FROM services ORDER BY sort_order DESC LIMIT 1`,
    );
    const nextOrder = (lastRows[0]?.sort_order ?? -1) + 1;

    await dbQuery(
      `INSERT INTO services (title, slug, summary, description, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        parsed.data.title,
        parsed.data.slug,
        parsed.data.summary,
        parsed.data.description,
        parsed.data.status,
        nextOrder,
      ],
    );
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }

  revalidatePublic();
  redirect("/admin/services?saved=created");
}

export async function updateService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid service.");

  const parsed = parseInput(serviceSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  try {
    const { rowCount } = await dbQuery(
      `UPDATE services
       SET title = $1,
           slug = $2,
           summary = $3,
           description = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [
        parsed.data.title,
        parsed.data.slug,
        parsed.data.summary,
        parsed.data.description,
        parsed.data.status,
        id.data,
      ],
    );
    if (!rowCount) return fail("Service not found.");

    revalidatePublic();
    return succeed("Service saved.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }
}

export async function setServiceStatus(
  id: string,
  status: "draft" | "published",
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success || (status !== "draft" && status !== "published")) {
    return fail("Invalid request.");
  }

  try {
    const { rowCount } = await dbQuery(
      `UPDATE services SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, parsedId.data],
    );
    if (!rowCount) return fail("Service not found.");

    revalidatePublic();
    return succeed(status === "published" ? "Service published." : "Service unpublished.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function moveService(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success || (direction !== "up" && direction !== "down")) {
    return fail("Invalid request.");
  }

  const result = await moveRow("services", parsedId.data, direction);
  if (!result.ok) return fail(result.error ?? "Could not reorder services.");

  revalidatePublic();
  return succeed();
}

export async function deleteService(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return fail("Invalid service.");

  try {
    await dbQuery(`DELETE FROM services WHERE id = $1`, [parsedId.data]);
    revalidatePublic();
    return succeed("Service deleted.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
