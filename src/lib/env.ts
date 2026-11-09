// NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline
// them into the browser bundle.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const paystackPublicKey =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

// Server-side environment helpers
export const databaseUrl = process.env.DATABASE_URL ?? "";
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET ?? "";
export const betterAuthUrl = process.env.BETTER_AUTH_URL ?? siteUrl;
export const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY ?? "";

export const isDatabaseConfigured = Boolean(databaseUrl);
export const isAuthConfigured = Boolean(databaseUrl && betterAuthSecret);
export const isPaystackConfigured = Boolean(paystackSecretKey);

// White-glove nationwide delivery fee (in NGN); complimentary above threshold
export const SHIPPING_CONFIG = {
  freeShippingThreshold: 2_500_000,
  standardWhiteGloveFee: 85_000,
} as const;

export const IMAGE_LIMITS = {
  projectMaxBytes: 10 * 1024 * 1024,
  logoMaxBytes: 2 * 1024 * 1024,
  projectTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  logoTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
} as const;
