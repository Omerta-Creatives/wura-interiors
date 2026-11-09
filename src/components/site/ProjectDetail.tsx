import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Paragraphs } from "@/components/ui/Paragraphs";
import { coverImage } from "@/lib/data";
import { projectImageUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { ProjectWithRelations, SiteSettings } from "@/types";
import { WhatsAppButton } from "./WhatsAppButton";

/** Shared by the public project page and the dashboard preview. */
export function ProjectDetail({
  project,
  settings,
}: {
  project: ProjectWithRelations;
  settings: SiteSettings;
}) {
  const cover = coverImage(project);
  const gallery = project.images.filter((i) => i.id !== cover?.id);
  const completed = formatDate(project.completed_on);

  return (
    <article>
      <header className="relative overflow-hidden bg-ink pb-20 pt-12 text-ivory">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(209,173,97,0.14),transparent_55%)]"
        />
        <div className="container-page relative">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ivory/70 hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All projects
          </Link>
          {project.category && <p className="eyebrow-on-dark mt-10">{project.category.name}</p>}
          <h1 className="mt-3 max-w-4xl text-5xl font-medium leading-[1.05] sm:text-6xl">
            {project.title}
          </h1>
          {project.summary && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory/75">{project.summary}</p>
          )}
          {(project.location || completed) && (
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-gold/30 pt-6 text-sm">
              {project.location && (
                <div>
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold">
                    Location
                  </dt>
                  <dd className="mt-1 text-ivory/90">{project.location}</dd>
                </div>
              )}
              {completed && (
                <div>
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold">
                    Completed
                  </dt>
                  <dd className="mt-1 text-ivory/90">{completed}</dd>
                </div>
              )}
              <div>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold">
                  Scope
                </dt>
                <dd className="mt-1 text-ivory/90">Interior Architecture &amp; Bespoke Millwork</dd>
              </div>
            </dl>
          )}
        </div>
      </header>

      <div className="container-page -mt-8">
        <figure className="editorial-frame relative aspect-[16/10] w-full border border-gold/30">
          <Image
            src={projectImageUrl(cover?.storage_path)}
            alt={cover?.alt_text ?? cover?.caption ?? project.title}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover"
          />
        </figure>
        {cover?.caption && (
          <p className="mt-3 text-xs tracking-wide text-ink/60">{cover.caption}</p>
        )}
      </div>

      {project.description && (
        <section className="container-page py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">Project Narrative</p>
              <h2 className="mt-3 text-3xl font-medium">Spatial &amp; Material Brief</h2>
            </div>
            <div className="max-w-3xl text-lg leading-relaxed text-ink/80 lg:col-span-8">
              <Paragraphs text={project.description} />
            </div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section aria-label="Project gallery" className="container-page pb-24">
          <div className="mb-10 border-t border-ink/10 pt-12">
            <p className="eyebrow">Visual Documentation</p>
            <h2 className="mt-2 text-3xl font-medium">Project Gallery</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {gallery.map((image) => (
              <figure key={image.id} className="surface-card overflow-hidden p-3">
                <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
                  <Image
                    src={projectImageUrl(image.storage_path)}
                    alt={image.alt_text ?? image.caption ?? project.title}
                    fill
                    loading="lazy"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {image.caption && (
                  <figcaption className="px-2 pb-1 pt-3 text-xs leading-relaxed text-ink/65">
                    {image.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-gold/30 bg-ink py-20 text-center text-ivory">
        <div className="container-page">
          <p className="eyebrow-on-dark mx-auto">Commission a Space</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-medium sm:text-5xl">
            Inspired by {project.title}?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ivory/75">
            Speak with our design team about your residence or commercial project, or explore collectible furniture from this project in our Store.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <WhatsAppButton
              number={settings.whatsapp_number}
              message={`Hello ${settings.business_name}, I saw the “${project.title}” project on your website and would like to enquire about something similar.`}
            />
            <Link href="/store" className="btn-outline-light">
              Shop the Collection <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
