"use client";

import Link from "next/link";
import { customerSignIn, customerSignUp } from "@/actions/auth";
import { useActionForm } from "@/components/admin/hooks";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";

export function CustomerSignInForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useActionForm(customerSignIn, {
    refreshOnSuccess: false,
  });
  const errors = state?.fieldErrors ?? {};

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 border border-ink/15 bg-ivory-light p-8 shadow-sm"
    >
      <input type="hidden" name="next" value={next ?? "/account"} />

      {state && !state.ok && !state.fieldErrors && <Notice state={state} />}

      <TextField
        label="Email Address"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        errors={errors.email}
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        errors={errors.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="btn-gold w-full disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>

      <p className="border-t border-ink/10 pt-4 text-center text-xs text-ink/65">
        New to Wura Interiors?{" "}
        <Link
          href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
          className="font-semibold text-gold-dark underline hover:text-ink"
        >
          Create a Client Account
        </Link>
      </p>
    </form>
  );
}

export function CustomerSignUpForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useActionForm(customerSignUp, {
    refreshOnSuccess: false,
  });
  const errors = state?.fieldErrors ?? {};

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 border border-ink/15 bg-ivory-light p-8 shadow-sm"
    >
      <input type="hidden" name="next" value={next ?? "/account"} />

      {state && !state.ok && !state.fieldErrors && <Notice state={state} />}

      <TextField
        label="Full Name"
        name="name"
        type="text"
        required
        autoComplete="name"
        placeholder="Adaeze Okafor"
        errors={errors.name}
      />

      <TextField
        label="Email Address"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        errors={errors.email}
      />

      <TextField
        label="Phone / WhatsApp Number (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+234 800 000 0000"
        errors={errors.phone}
      />

      <TextField
        label="Password (min. 8 characters)"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="••••••••"
        errors={errors.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="btn-gold w-full disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create Account"}
      </button>

      <p className="border-t border-ink/10 pt-4 text-center text-xs text-ink/65">
        Already have an account?{" "}
        <Link
          href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          className="font-semibold text-gold-dark underline hover:text-ink"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
