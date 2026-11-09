import { dbQuery } from "@/lib/db";

const ALLOWED_TABLES = {
  categories: "categories",
  services: "services",
  project_images: "project_images",
  products: "products",
} as const;

const ALLOWED_SCOPE_COLUMNS: Record<string, string> = {
  project_id: "project_id",
};

/**
 * Moves a row one position up or down within an ordered table in Neon Postgres
 * and rewrites sort_order as a clean 0..n sequence.
 */
export async function moveRow(
  table: keyof typeof ALLOWED_TABLES,
  id: string,
  direction: "up" | "down",
  scope?: { column: string; value: string },
): Promise<{ ok: boolean; error?: string }> {
  const tableName = ALLOWED_TABLES[table];
  if (!tableName) return { ok: false, error: "Invalid table." };

  try {
    let sql = `SELECT id, sort_order FROM ${tableName}`;
    const params: unknown[] = [];

    if (scope) {
      const col = ALLOWED_SCOPE_COLUMNS[scope.column];
      if (!col) return { ok: false, error: "Invalid scope column." };
      sql += ` WHERE ${col} = $1`;
      params.push(scope.value);
    }

    sql += ` ORDER BY sort_order ASC, created_at ASC`;

    const { rows } = await dbQuery<{ id: string; sort_order: number }>(sql, params);
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) return { ok: false, error: "Item not found." };

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= rows.length) return { ok: true };

    [rows[index], rows[target]] = [rows[target], rows[index]];

    await Promise.all(
      rows.map((row, position) =>
        row.sort_order === position
          ? Promise.resolve()
          : dbQuery(`UPDATE ${tableName} SET sort_order = $1 WHERE id = $2`, [
              position,
              row.id,
            ]),
      ),
    );

    return { ok: true };
  } catch (err) {
    console.error("[reorder] moveRow failed:", err);
    return { ok: false, error: "Could not reorder items." };
  }
}
