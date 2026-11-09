import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerSignUpForm } from "@/components/site/CustomerAuthForms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Wura Interiors client account for faster checkout and order tracking.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
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
          <h1 className="mt-2 text-3xl font-medium sm:text-4xl">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-ink/65">
            Track bespoke furniture commissions, ready-to-ship orders, and Paystack receipts in one place.
          </p>
        </div>

        <CustomerSignUpForm next={next} />
      </div>
    </section>
  );
}
