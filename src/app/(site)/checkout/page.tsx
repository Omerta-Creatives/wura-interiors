import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/site/CheckoutForm";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getSessionUser } from "@/lib/auth";
import { isPaystackConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Checkout — Wura Store",
  description: "Complete your Wura Interiors furniture and object acquisition with secure Paystack checkout.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getSessionUser();

  return (
    <>
      <div className="border-b border-ink/10 bg-ivory-dark/50">
        <div className="container-page flex items-center justify-between py-4 text-xs text-ink/70">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-ink hover:text-gold-dark"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Continue Shopping
          </Link>
          <span className="uppercase tracking-[0.18em] text-ink/60">
            Secure Paystack Checkout
          </span>
        </div>
      </div>

      <section className="container-page py-12 lg:py-20">
        <div className="mb-12">
          <SectionHeading
            as="h1"
            eyebrow="Acquisition & Delivery"
            title="Complete your order"
            description="Provide your delivery address and complete payment securely via Paystack. Our studio concierge will contact you within 24 hours to coordinate white-glove delivery."
          />
        </div>

        <CheckoutForm
          user={user}
          isPaystackConfigured={isPaystackConfigured}
        />
      </section>
    </>
  );
}
