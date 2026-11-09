import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";
import type { Service } from "@/types";

export const metadata = { title: "Edit service" };

type Props = { params: Promise<{ id: string }> };

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  await requireAdmin();
  const { rows } = await dbQuery<Service>(
    `SELECT * FROM services WHERE id = $1 LIMIT 1`,
    [id],
  );
  const service = rows[0];
  if (!service) notFound();

  return (
    <>
      <PageHeader
        title={service.title}
        actions={
          <>
            <StatusBadge status={service.status} />
            <Link href="/admin/services" className="btn-outline btn-sm">
              All services
            </Link>
          </>
        }
      />
      <ServiceForm service={service} />
    </>
  );
}
