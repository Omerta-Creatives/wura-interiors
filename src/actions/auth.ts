"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fail, parseInput, type ActionState } from "@/lib/action-helpers";
import { auth, getAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";
import { formToObject, signInSchema, signUpSchema } from "@/lib/validation";

function safeAdminNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(\/[A-Za-z0-9\-_/]*)?$/.test(next) && !next.includes("//")
    ? next
    : "/admin";
}

function safeSiteNext(value: FormDataEntryValue | null, fallback = "/account"): string {
  const next = typeof value === "string" ? value : "";
  return /^\/[A-Za-z0-9\-_/?=&]*$/.test(next) && !next.includes("//")
    ? next
    : fallback;
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDatabaseConfigured) {
    return fail(
      "Neon Postgres (DATABASE_URL) is not configured yet. Add DATABASE_URL and BETTER_AUTH_SECRET to .env.local.",
    );
  }

  const parsed = parseInput(signInSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch {
    return fail("Invalid email or password.");
  }

  const admin = await getAdmin();
  if (!admin) {
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // ignore
    }
    return fail("This account is not authorised to use the admin dashboard.");
  }

  redirect(safeAdminNext(formData.get("next")));
}

export async function customerSignIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDatabaseConfigured) {
    return fail(
      "Account authentication requires DATABASE_URL and BETTER_AUTH_SECRET in .env.local.",
    );
  }

  const parsed = parseInput(signInSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch {
    return fail("Invalid email or password.");
  }

  redirect(safeSiteNext(formData.get("next"), "/account"));
}

export async function customerSignUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDatabaseConfigured) {
    return fail(
      "Account registration requires DATABASE_URL and BETTER_AUTH_SECRET in .env.local.",
    );
  }

  const parsed = parseInput(signUpSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phone: parsed.data.phone ?? undefined,
      },
      headers: await headers(),
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message.toLowerCase().includes("exist")
        ? "An account with this email address already exists."
        : "Could not create account. Please check your details and try again.";
    return fail(message);
  }

  redirect(safeSiteNext(formData.get("next"), "/account"));
}

export async function signOut() {
  if (isDatabaseConfigured) {
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // ignore
    }
  }
  redirect("/admin/login");
}

export async function customerSignOut() {
  if (isDatabaseConfigured) {
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // ignore
    }
  }
  redirect("/");
}
