import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { dbQuery, getPool } from "@/lib/db";
import {
  betterAuthSecret,
  betterAuthUrl,
  isAuthConfigured,
  isDatabaseConfigured,
} from "@/lib/env";
import type { AdminProfile, SessionUser, UserRole } from "@/types";

const FALLBACK_SECRET =
  "wura-interiors-dev-fallback-secret-change-in-production-32chars";

export const auth = betterAuth({
  database: getPool(),
  secret: betterAuthSecret || FALLBACK_SECRET,
  baseURL: betterAuthUrl,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      is_active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [nextCookies()],
});

export type AdminContext = {
  user: { id: string; email: string };
  profile: AdminProfile;
};

/**
 * Returns the currently signed-in Better Auth user (customer or admin), or null.
 * Verifies role and active status from Neon Postgres.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isDatabaseConfigured) return null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return null;

    const { rows } = await dbQuery<{
      id: string;
      email: string;
      name: string;
      role: string | null;
      phone: string | null;
      is_active: boolean | null;
    }>(
      `SELECT id, email, name, role, phone, is_active FROM "user" WHERE id = $1 LIMIT 1`,
      [session.user.id],
    );

    const row = rows[0];
    if (!row || row.is_active === false) return null;

    const role: UserRole = row.role === "admin" ? "admin" : "customer";
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role,
      phone: row.phone,
      is_active: row.is_active ?? true,
    };
  } catch (err) {
    if (isAuthConfigured) {
      console.error("[auth] getSessionUser error:", err);
    }
    return null;
  }
});

/**
 * Requires an authenticated user (customer or admin); redirects to /sign-in otherwise.
 */
export async function requireUser(nextPath = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/**
 * Returns the signed-in administrator, or null.
 * Checks Better Auth session AND verifies the user has role = 'admin' and is_active = true in Neon.
 */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  const user = await getSessionUser();
  if (!user || user.role !== "admin" || !user.is_active) return null;

  return {
    user: { id: user.id, email: user.email },
    profile: {
      id: user.id,
      email: user.email,
      full_name: user.name,
      role: "admin",
      is_active: user.is_active,
    },
  };
});

/** For /admin pages and layouts: redirect to sign-in when not an administrator. */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?error=not-authorised");
  return admin;
}
