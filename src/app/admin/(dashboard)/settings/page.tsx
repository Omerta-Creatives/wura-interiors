import { LogoUploader } from "@/components/admin/LogoUploader";
import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/data";
import { dbQuery } from "@/lib/db";
import type { SiteSettings } from "@/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const { rows } = await dbQuery<Partial<SiteSettings>>(
    `SELECT * FROM site_settings WHERE id = 1 LIMIT 1`,
  );
  const settings: SiteSettings = { ...DEFAULT_SETTINGS, ...(rows[0] ?? {}) };

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Business details, WhatsApp number, logo and About page content."
      />
      <div className="space-y-8">
        <LogoUploader logoPath={settings.logo_path} />
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
