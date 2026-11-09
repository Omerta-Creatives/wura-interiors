import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { ServiceList } from "@/components/admin/ServiceList";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import type { Service } from "@/types";

export const metadata = { title: "Services" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function ServicesAdminPage({ searchParams }: Props) {
  await requireAdmin();
  const { saved } = await searchParams;

  const { rows: services } = await dbQuery<Service>(
    `SELECT * FROM services ORDER BY sort_order ASC, created_at ASC`,
  );

  return (
    <>
      <PageHeader
        title="Services"
        description="Only list services the client has confirmed. Drafts stay off the website."
        actions={
          <Link href="/admin/services/new" className="btn-dark">
            <Plus className="h-4 w-4" aria-hidden /> New service
          </Link>
        }
      />

      {saved === "created" && (
        <p
          role="status"
          className="mb-6 border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Service created.
        </p>
      )}

      {services.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <h2 className="text-2xl font-medium">No services yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">
            Add the services the client has confirmed. Nothing is shown on the
            website until you publish it.
          </p>
          <Link href="/admin/services/new" className="btn-dark mt-6">
            <Plus className="h-4 w-4" aria-hidden /> Add the first service
          </Link>
        </div>
      ) : (
        <ServiceList services={services} />
      )}
    </>
  );
}
