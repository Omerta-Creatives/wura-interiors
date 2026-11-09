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
import {
  formToObject,
  productSchema,
  productStatusSchema,
  uuidSchema,
} from "@/lib/validation";
import type { ProductGalleryItem } from "@/types";

const SLUG_TAKEN = "Another store product already uses this slug.";

function parseGalleryPaths(raw: FormDataEntryValue | null): ProductGalleryItem[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ProductGalleryItem =>
          typeof item === "object" &&
          item !== null &&
          typeof item.path === "string" &&
          item.path.trim().length > 0,
      )
      .map((item) => ({
        path: item.path.trim(),
        alt: typeof item.alt === "string" ? item.alt.trim() : "",
        caption:
          typeof item.caption === "string" && item.caption.trim()
            ? item.caption.trim()
            : undefined,
      }));
  } catch {
    return [];
  }
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsed = parseInput(productSchema, formToObject(formData, ["featured"]));
  if (parsed.error) return parsed.error;

  const gallery = parseGalleryPaths(formData.get("gallery_json"));
  const d = parsed.data;

  let createdId: string;
  try {
    const { rows: lastRows } = await dbQuery<{ sort_order: number }>(
      `SELECT sort_order FROM products ORDER BY sort_order DESC LIMIT 1`,
    );
    const nextOrder = (lastRows[0]?.sort_order ?? -1) + 1;

    const { rows } = await dbQuery<{ id: string }>(
      `INSERT INTO products (
         name, slug, category, price, summary, description,
         dimensions, materials, finish, lead_time, availability,
         stock_quantity, featured, status, image_path, alt_text,
         gallery_paths, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18)
       RETURNING id`,
      [
        d.name,
        d.slug,
        d.category,
        d.price,
        d.summary,
        d.description,
        d.dimensions,
        d.materials,
        d.finish,
        d.lead_time,
        d.availability,
        d.stock_quantity,
        d.featured,
        d.status,
        d.image_path,
        d.alt_text,
        JSON.stringify(gallery),
        nextOrder,
      ],
    );
    createdId = rows[0].id;
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }

  revalidatePublic();
  redirect(`/admin/products/${createdId}?created=1`);
}

export async function updateProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid product.");

  const parsed = parseInput(productSchema, formToObject(formData, ["featured"]));
  if (parsed.error) return parsed.error;

  const gallery = parseGalleryPaths(formData.get("gallery_json"));
  const d = parsed.data;

  try {
    const { rowCount } = await dbQuery(
      `UPDATE products
       SET name = $1,
           slug = $2,
           category = $3,
           price = $4,
           summary = $5,
           description = $6,
           dimensions = $7,
           materials = $8,
           finish = $9,
           lead_time = $10,
           availability = $11,
           stock_quantity = $12,
           featured = $13,
           status = $14,
           image_path = $15,
           alt_text = $16,
           gallery_paths = $17::jsonb,
           updated_at = NOW()
       WHERE id = $18`,
      [
        d.name,
        d.slug,
        d.category,
        d.price,
        d.summary,
        d.description,
        d.dimensions,
        d.materials,
        d.finish,
        d.lead_time,
        d.availability,
        d.stock_quantity,
        d.featured,
        d.status,
        d.image_path,
        d.alt_text,
        JSON.stringify(gallery),
        id.data,
      ],
    );

    if (!rowCount) return fail("Product not found.");

    revalidatePublic();
    return succeed("Product saved.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string }, {
      uniqueField: "slug",
      uniqueMessage: SLUG_TAKEN,
    });
  }
}

export async function setProductStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  const parsedStatus = productStatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return fail("Invalid request.");

  try {
    const { rowCount } = await dbQuery(
      `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2`,
      [parsedStatus.data, parsedId.data],
    );
    if (!rowCount) return fail("Product not found.");

    revalidatePublic();
    return succeed(
      parsedStatus.data === "published"
        ? "Product published to the store."
        : parsedStatus.data === "draft"
          ? "Product moved to draft."
          : "Product archived.",
    );
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function moveProduct(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success || (direction !== "up" && direction !== "down")) {
    return fail("Invalid request.");
  }

  const result = await moveRow("products", parsedId.data, direction);
  if (!result.ok) return fail(result.error ?? "Could not reorder products.");

  revalidatePublic();
  return succeed();
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return fail("Invalid product.");

  try {
    await dbQuery(`DELETE FROM products WHERE id = $1`, [parsedId.data]);
    revalidatePublic();
    return succeed("Product deleted.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
