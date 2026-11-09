import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerSignInForm } from "@/components/site/CustomerAuthForms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Wura Interiors account to manage orders and saved details.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) {
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
    redirect(safeNext);
  }

  return (
    <section className="container-page py-16 lg:py-24">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow">Client Portal</p>
          <h1 className="mt-2 text-3xl font-medium sm:text-4xl">Sign In</h1>
          <p className="mt-2 text-sm text-ink/65">
            Access your order history, delivery tracking, and saved checkout details.
          </p>
        </div>

        <CustomerSignInForm next={next} />
      </div>
    </section>
  );
}
