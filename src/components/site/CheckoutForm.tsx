"use client";

import { Lock, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createCheckoutOrder } from "@/actions/checkout";
import { useActionForm } from "@/components/admin/hooks";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";
import { SHIPPING_CONFIG } from "@/lib/env";
import { productImageUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { useCart } from "./CartProvider";

const NIGERIAN_STATES = [
  "Lagos",
  "FCT - Abuja",
  "Rivers",
  "Oyo",
  "Ogun",
  "Delta",
  "Edo",
  "Enugu",
  "Anambra",
  "Kaduna",
  "Kano",
  "Akwa Ibom",
  "Cross River",
  "Kwara",
  "Osun",
  "Ondo",
  "Ekiti",
  "Abia",
  "Imo",
  "Plateau",
  "Other State",
];

export function CheckoutForm({
  user,
  isPaystackConfigured,
}: {
  user: SessionUser | null;
  isPaystackConfigured: boolean;
}) {
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    notes,
    setNotes,
    updateQuantity,
    removeItem,
  } = useCart();

  const { state, pending, onSubmit } = useActionForm(createCheckoutOrder, {
    refreshOnSuccess: false,
  });
  const errors = state?.fieldErrors ?? {};

  const itemsPayload = JSON.stringify(
    items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    })),
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg border border-ink/15 bg-ivory-light p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-gold/40 bg-ivory-dark/60">
          <ShoppingBag className="h-6 w-6 text-gold-dark" aria-hidden />
        </div>
        <h2 className="mt-6 text-3xl font-medium">Your selection bag is empty</h2>
        <p className="mt-3 text-sm text-ink/70">
          Add furniture, lighting, or architectural objects from the Wura Store
          before proceeding to checkout.
        </p>
        <Link href="/store" className="btn-dark mt-8">
          Explore the Store
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid items-start gap-12 lg:grid-cols-12"
      noValidate
    >
      <input type="hidden" name="items_json" value={itemsPayload} />

      {/* Left Column: Customer & Delivery Details */}
      <div className="space-y-8 lg:col-span-7">
        {!user && (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-gold/40 bg-ivory-dark/60 px-6 py-4 text-sm">
            <p className="text-ink/80">
              Have a Wura Interiors account? Sign in to track your order history.
            </p>
            <Link
              href="/sign-in?next=/checkout"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-ink underline decoration-gold underline-offset-4 hover:text-gold-dark"
            >
              Sign in →
            </Link>
          </div>
        )}

        <section className="border border-ink/15 bg-ivory-light p-6 sm:p-8">
          <p className="eyebrow">01 · Contact Information</p>
          <h2 className="mt-2 text-2xl font-medium">Client details</h2>
          <p className="mt-1 text-sm text-ink/65">
            Your order confirmation, Paystack receipt, and white-glove delivery
            schedule will be sent here.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label="Full name"
                name="customer_name"
                required
                autoComplete="name"
                defaultValue={user?.name ?? ""}
                placeholder="e.g. Adesuwa Adeyemi"
                errors={errors.customer_name}
              />
            </div>

            <TextField
              label="Email address"
              name="customer_email"
              type="email"
              required
              autoComplete="email"
              defaultValue={user?.email ?? ""}
              placeholder="you@example.com"
              errors={errors.customer_email}
            />

            <TextField
              label="Phone / WhatsApp number"
              name="customer_phone"
              type="tel"
              required
              autoComplete="tel"
              defaultValue={user?.phone ?? ""}
              placeholder="+234 803 123 4567"
              errors={errors.customer_phone}
            />
          </div>
        </section>

        <section className="border border-ink/15 bg-ivory-light p-6 sm:p-8">
          <p className="eyebrow">02 · White-Glove Delivery</p>
          <h2 className="mt-2 text-2xl font-medium">
            Delivery &amp; installation address
          </h2>
          <p className="mt-1 text-sm text-ink/65">
            Our installation team delivers, places, and assembles each piece in
            your room of choice.
          </p>

          <div className="mt-6 space-y-5">
            <TextField
              label="Street address &amp; building / estate"
              name="shipping_address"
              required
              autoComplete="street-address"
              placeholder="e.g. 14 Bourdillon Road, Ikoyi"
              errors={errors.shipping_address}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="City / area"
                name="shipping_city"
                required
                placeholder="e.g. Ikoyi, Lagos"
                errors={errors.shipping_city}
              />

              <SelectField
                label="State"
                name="shipping_state"
                defaultValue="Lagos"
                errors={errors.shipping_state}
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </SelectField>
            </div>

            <TextAreaField
              label="Bespoke finish, dimension, or access notes (optional)"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any custom dimension requests, timber finish preferences, or estate gate access instructions..."
              errors={errors.notes}
            />
          </div>
        </section>
      </div>

      {/* Right Column: Order Summary & Paystack Payment */}
      <div className="lg:sticky lg:top-28 lg:col-span-5">
        <div className="border border-gold/40 bg-ink p-6 text-ivory sm:p-8">
          <p className="eyebrow-on-dark">Order Summary</p>
          <h2 className="mt-2 text-2xl font-medium">
            {items.reduce((sum, i) => sum + i.quantity, 0)}{" "}
            {items.reduce((sum, i) => sum + i.quantity, 0) === 1
              ? "Piece"
              : "Pieces"}{" "}
            Selected
          </h2>

          <ul className="mt-6 divide-y divide-ivory/10 border-y border-ivory/15 py-4">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-ivory/10">
                  <Image
                    src={productImageUrl(product.image_path)}
                    alt={product.alt_text}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/store/${product.slug}`}
                        className="font-display text-lg font-medium leading-snug text-ivory hover:text-gold"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-ivory/60">
                        {product.lead_time}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="text-ivory/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center border border-ivory/20">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        aria-label="Decrease quantity"
                        className="px-2 py-1 text-ivory/70 hover:text-gold"
                      >
                        <Minus className="h-3 w-3" aria-hidden />
                      </button>
                      <span className="min-w-[1.75rem] text-center text-xs font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        aria-label="Increase quantity"
                        className="px-2 py-1 text-ivory/70 hover:text-gold"
                      >
                        <Plus className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gold">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-ivory/75">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ivory/75">
              <dt>White-Glove Delivery &amp; Installation</dt>
              <dd>
                {deliveryFee === 0 ? (
                  <span className="text-gold">Complimentary</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </dd>
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-ivory/50">
                Complimentary white-glove delivery on orders of{" "}
                {formatPrice(SHIPPING_CONFIG.freeShippingThreshold)} or more.
              </p>
            )}
            <div className="flex items-baseline justify-between border-t border-ivory/15 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Total Due (NGN)
              </dt>
              <dd className="font-display text-3xl font-semibold text-ivory">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          {state && !state.ok && (
            <div className="mt-5">
              <Notice state={state} />
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-gold mt-6 w-full py-4"
          >
            <Lock className="h-4 w-4" aria-hidden />
            {pending
              ? "Connecting to Paystack…"
              : `Pay ${formatPrice(total)} with Paystack`}
          </button>

          {!isPaystackConfigured && (
            <p className="mt-3 text-center text-xs text-ivory/60">
              Preview mode: Add <code>PAYSTACK_SECRET_KEY</code> in{" "}
              <code>.env.local</code> to enable live Paystack gateway redirect.
            </p>
          )}

          <div className="mt-6 space-y-2.5 border-t border-ivory/15 pt-5 text-xs text-ivory/65">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              Secured by Paystack (Card, Bank Transfer, USSD)
            </p>
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              Scheduled white-glove delivery &amp; room placement included
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
