import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { Pool, type QueryResultRow } from "pg";
import { databaseUrl, isDatabaseConfigured } from "@/lib/env";

/**
 * Lazy Neon Postgres connections.
 * Never throws at module import time so `next build` succeeds even when
 * DATABASE_URL is not yet provisioned in the build environment.
 */

let _sql: NeonQueryFunction<false, false> | null = null;
let _pool: Pool | null = null;

export function getSql(): NeonQueryFunction<false, false> | null {
  if (!isDatabaseConfigured) return null;
  if (!_sql) {
    _sql = neon(databaseUrl);
  }
  return _sql;
}

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString:
        databaseUrl || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return _pool;
}

/**
 * Parameterized Postgres query helper using the shared Pool.
 */
export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: T[]; rowCount: number }> {
  if (!isDatabaseConfigured) {
    return { rows: [], rowCount: 0 };
  }
  const pool = getPool();
  const res = await pool.query<T>(text, params);
  return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
}
