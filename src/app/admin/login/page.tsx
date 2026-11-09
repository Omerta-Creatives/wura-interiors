import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  if (await getAdmin()) redirect(next && next.startsWith("/admin") ? next : "/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center leading-none">
          <span className="font-display text-4xl font-semibold uppercase tracking-[0.32em] text-gold">
            Wura
          </span>
          <span className="mt-2 block text-[0.65rem] uppercase tracking-[0.5em] text-ivory/70">
            Interiors
          </span>
        </div>

        <div className="bg-ivory p-8 shadow-2xl sm:p-10">
          <h1 className="text-3xl font-medium">Administrator sign in</h1>
          <p className="mt-2 text-sm text-ink/70">
            This area is for authorised Wura Interiors administrators only.
          </p>

          {!isDatabaseConfigured && (
            <p
              role="alert"
              className="mt-6 border border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              Neon Postgres is not configured. Copy <code>.env.example</code> to{" "}
              <code>.env.local</code> and add your <code>DATABASE_URL</code> and{" "}
              <code>BETTER_AUTH_SECRET</code>.
            </p>
          )}
          {error === "not-authorised" && (
            <p
              role="alert"
              className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              Please sign in with an administrator account to continue.
            </p>
          )}

          <div className="mt-8">
            <LoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ivory/60">
          <Link href="/" className="hover:text-gold">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
