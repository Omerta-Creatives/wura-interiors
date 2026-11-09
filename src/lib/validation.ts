import { z } from "zod";
import { isHttpUrl, normalizeWhatsAppNumber } from "@/lib/utils";

/** Empty / missing form values become null so optional fields stay optional. */
const blankToNull = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

export const optionalText = (max: number, label = "This field") =>
  z.preprocess(
    blankToNull,
    z.string().max(max, `${label} must be ${max} characters or fewer`).nullable(),
  );

export const requiredText = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const slugSchema = z
  .string({ required_error: "Slug is required", invalid_type_error: "Slug is required" })
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens only",
  );

export const uuidSchema = z.string().uuid("Invalid identifier");

export const optionalUuid = z.preprocess(blankToNull, z.string().uuid().nullable());

export const optionalDate = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Use a valid date")
    .nullable(),
);

export const optionalUrl = (label: string) =>
  z.preprocess(
    blankToNull,
    z
      .string()
      .max(300)
      .refine(isHttpUrl, `${label} must be a full link starting with https://`)
      .nullable(),
  );

export const optionalEmail = z.preprocess(
  blankToNull,
  z.string().max(200).email("Enter a valid email address").nullable(),
);

export const optionalWhatsApp = z.preprocess(
  blankToNull,
  z
    .string()
    .transform((value, ctx) => {
      const normalised = normalizeWhatsAppNumber(value);
      if (!normalised) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Enter the number in international format starting with +, e.g. +234 803 123 4567",
        });
        return z.NEVER;
      }
      return normalised;
    })
    .nullable(),
);

/* ---------- Entity schemas ---------- */

export const projectSchema = z.object({
  title: requiredText(2, 140, "Title"),
  slug: slugSchema,
  summary: optionalText(300, "Summary"),
  description: optionalText(10000, "Description"),
  category_id: optionalUuid,
  location: optionalText(120, "Location"),
  completed_on: optionalDate,
  featured: z.boolean(),
});

export const categorySchema = z.object({
  name: requiredText(2, 60, "Name"),
  slug: slugSchema,
});

export const serviceSchema = z.object({
  title: requiredText(2, 120, "Title"),
  slug: slugSchema,
  summary: optionalText(300, "Summary"),
  description: optionalText(10000, "Description"),
  status: z.enum(["draft", "published"]),
});

export const storeCategoryEnum = z.enum([
  "Seating",
  "Dining",
  "Tables",
  "Storage",
  "Lighting",
  "Objects & Decor",
]);

export const productSchema = z.object({
  name: requiredText(2, 140, "Product name"),
  slug: slugSchema,
  category: storeCategoryEnum,
  price: z.coerce
    .number({ invalid_type_error: "Enter a valid price in Naira" })
    .int("Price must be a whole number")
    .min(1000, "Price must be at least ₦1,000")
    .max(500_000_000, "Price is too large"),
  summary: requiredText(10, 350, "Summary"),
  description: requiredText(10, 10000, "Description"),
  dimensions: requiredText(2, 240, "Dimensions"),
  materials: requiredText(2, 300, "Materials"),
  finish: requiredText(2, 240, "Finish"),
  lead_time: requiredText(2, 140, "Lead time"),
  availability: z.enum(["in_stock", "made_to_order"]),
  stock_quantity: z.coerce
    .number({ invalid_type_error: "Enter a valid stock count" })
    .int()
    .min(0, "Stock cannot be negative")
    .max(10000),
  featured: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
  image_path: requiredText(2, 500, "Primary image URL or path"),
  alt_text: requiredText(2, 250, "Image alt text"),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const checkoutSchema = z.object({
  customer_name: requiredText(2, 120, "Full name"),
  customer_email: z.string().trim().email("Enter a valid email address").max(200),
  customer_phone: requiredText(7, 40, "Phone number"),
  shipping_address: requiredText(5, 300, "Delivery street address"),
  shipping_city: requiredText(2, 100, "City"),
  shipping_state: requiredText(2, 100, "State"),
  notes: optionalText(1500, "Delivery notes"),
  items_json: z.string().min(2, "Your shopping bag is empty"),
});

export const settingsSchema = z.object({
  business_name: requiredText(2, 100, "Business name"),
  tagline: optionalText(160, "Tagline"),
  whatsapp_number: optionalWhatsApp,
  email: optionalEmail,
  phone: optionalText(40, "Phone"),
  address: optionalText(300, "Address"),
  instagram_url: optionalUrl("Instagram link"),
  facebook_url: optionalUrl("Facebook link"),
  tiktok_url: optionalUrl("TikTok link"),
  about_story: optionalText(6000, "Company story"),
  design_philosophy: optionalText(4000, "Design philosophy"),
  founder_name: optionalText(100, "Founder name"),
  founder_bio: optionalText(3000, "Founder bio"),
});

export const imageDetailsSchema = z.object({
  caption: optionalText(200, "Caption"),
  alt_text: optionalText(250, "Alt text"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z.object({
  name: requiredText(2, 100, "Full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: optionalText(40, "Phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

export const projectStatusSchema = z.enum(["draft", "published", "archived"]);
export const productStatusSchema = z.enum(["draft", "published", "archived"]);
export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "in_production",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);
export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
]);

/** Read checkbox + text inputs off a FormData into a plain object. */
export function formToObject(fd: FormData, checkboxes: string[] = []) {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  for (const key of checkboxes) obj[key] = fd.get(key) === "on";
  return obj;
}
