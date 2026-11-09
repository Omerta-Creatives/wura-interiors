import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  published: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  paid: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  confirmed: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  delivered: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
  in_production: "border-blue-700/30 bg-blue-50 text-blue-900",
  out_for_delivery: "border-indigo-700/30 bg-indigo-50 text-indigo-900",
  draft: "border-amber-700/30 bg-amber-50 text-amber-900",
  pending: "border-amber-700/30 bg-amber-50 text-amber-900",
  failed: "border-red-700/30 bg-red-50 text-red-900",
  cancelled: "border-red-700/30 bg-red-50 text-red-900",
  refunded: "border-ink/20 bg-ink/5 text-ink/70",
  archived: "border-ink/20 bg-ink/5 text-ink/70",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status] ?? styles.archived,
      )}
    >
      {label}
    </span>
  );
}
