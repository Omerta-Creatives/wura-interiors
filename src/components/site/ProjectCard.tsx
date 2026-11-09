import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { coverImage } from "@/lib/data";
import { projectImageUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { ProjectWithRelations } from "@/types";

export function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectWithRelations;
  priority?: boolean;
}) {
  const cover = coverImage(project);
  const completed = formatDate(project.completed_on);

  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className="group flex flex-col border border-ink/10 bg-ivory-light/90 transition-all duration-500 hover:border-gold/60 hover:shadow-[0_22px_50px_-22px_rgba(17,17,17,0.22)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/10">
        <Image
          src={projectImageUrl(cover?.storage_path)}
          alt={cover?.alt_text ?? project.title}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          loading={priority ? undefined : "lazy"}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-gold/0 transition-all duration-500 group-hover:border-gold/80 group-hover:[inset:14px]"
        />
        {project.category && (
          <span className="pointer-events-none absolute left-4 top-4 bg-ink/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold backdrop-blur-sm">
            {project.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-medium leading-snug text-ink transition-colors group-hover:text-gold-dark">
              {project.title}
            </h3>
            <ArrowUpRight
              className="mt-1 h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-dark"
              aria-hidden
            />
          </div>
          {project.summary && (
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink/70">
              {project.summary}
            </p>
          )}
        </div>

        {(project.location || completed) && (
          <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3.5 text-xs text-ink/55">
            <span>{project.location}</span>
            {completed && <span>{completed}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
