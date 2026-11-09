"use server";

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
import { slugify } from "@/lib/utils";
import { categorySchema, formToObject, uuidSchema } from "@/lib/validation";

const SLUG_TAKEN = "Another category already uses this slug.";

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const raw = formToObject(formData);
  if (!raw.slug && typeof raw.name === "string") raw.slug = slugify(raw.name);

  const parsed = parseInput(categorySchema, raw);
  if (parsed.error) return parsed.error;

  try {
    const { rows: lastRows } = await dbQuery<{ sort_order: number }>(
      `SELECT sort_order FROM categories ORDER BY sort_order DESC LIMIT 1`,
    );
    const nextOrder = (lastRows[0]?.sort_order ?? -1) + 1;

    await dbQuery(
      `INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3)`,
      [parsed.data.name, parsed.data.slug, nextOrder],
    );

    revalidatePublic();
    return succeed(`Category “${parsed.data.name}” added.`);
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid category.");

  const parsed = parseInput(categorySchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  try {
    const { rowCount } = await dbQuery(
      `UPDATE categories SET name = $1, slug = $2 WHERE id = $3`,
      [parsed.data.name, parsed.data.slug, id.data],
    );
    if (!rowCount) return fail("Category not found.");

    revalidatePublic();
    return succeed("Category saved.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }
}

export async function moveCategory(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success || (direction !== "up" && direction !== "down")) {
    return fail("Invalid request.");
  }

  const result = await moveRow("categories", parsedId.data, direction);
  if (!result.ok) return fail(result.error ?? "Could not reorder categories.");

  revalidatePublic();
  return succeed();
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return fail("Invalid category.");

  try {
    await dbQuery(`DELETE FROM categories WHERE id = $1`, [parsedId.data]);
    revalidatePublic();
    return succeed("Category deleted. Its projects are now uncategorised.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
