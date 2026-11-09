"use server";

import {
  UNAUTHORISED,
  dbFailure,
  fail,
  parseInput,
  revalidatePublic,
  succeed,
  type ActionResult,
  type ActionState,
} from "@/lib/action-helpers";
import { getAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { formToObject, settingsSchema } from "@/lib/validation";

export async function updateSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsed = parseInput(settingsSchema, formToObject(formData));
  if (parsed.error) return parsed.error;

  const d = parsed.data;
  try {
    await dbQuery(
      `INSERT INTO site_settings (
         id, business_name, tagline, whatsapp_number, email, phone, address,
         instagram_url, facebook_url, tiktok_url, about_story, design_philosophy,
         founder_name, founder_bio, updated_at
       )
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       ON CONFLICT (id) DO UPDATE SET
         business_name = EXCLUDED.business_name,
         tagline = EXCLUDED.tagline,
         whatsapp_number = EXCLUDED.whatsapp_number,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         instagram_url = EXCLUDED.instagram_url,
         facebook_url = EXCLUDED.facebook_url,
         tiktok_url = EXCLUDED.tiktok_url,
         about_story = EXCLUDED.about_story,
         design_philosophy = EXCLUDED.design_philosophy,
         founder_name = EXCLUDED.founder_name,
         founder_bio = EXCLUDED.founder_bio,
         updated_at = NOW()`,
      [
        d.business_name,
        d.tagline,
        d.whatsapp_number,
        d.email,
        d.phone,
        d.address,
        d.instagram_url,
        d.facebook_url,
        d.tiktok_url,
        d.about_story,
        d.design_philosophy,
        d.founder_name,
        d.founder_bio,
      ],
    );

    revalidatePublic();
    return succeed("Settings saved.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function setLogo(path: string | null): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  if (
    path !== null &&
    (typeof path !== "string" ||
      path.length > 1_500_000 ||
      !(
        path.startsWith("/") ||
        path.startsWith("https://") ||
        path.startsWith("data:image/")
      ))
  ) {
    return fail("Invalid logo path or image.");
  }

  try {
    await dbQuery(
      `INSERT INTO site_settings (id, logo_path, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET logo_path = EXCLUDED.logo_path, updated_at = NOW()`,
      [path],
    );

    revalidatePublic();
    return succeed(
      path
        ? "Logo updated."
        : "Logo removed — the text placeholder is showing again.",
    );
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
