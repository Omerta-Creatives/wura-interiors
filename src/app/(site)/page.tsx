import { ArrowRight, Compass, Hammer, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/site/EmptyState";
import { ProductCard } from "@/components/site/ProductCard";
import { ProjectCard } from "@/components/site/ProjectCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import {
  coverImage,
  getPublishedProjects,
  getPublishedServices,
  getSiteSettings,
  getStoreProducts,
} from "@/lib/data";
import { SERVICE_IMAGES, SITE_IMAGES } from "@/lib/sample-data";
import { projectImageUrl } from "@/lib/storage";
import { truncate } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STUDIO_HIGHLIGHTS = [
  {
    icon: Compass,
    label: "Turnkey Architecture",
    detail: "Spatial planning, lighting & material curation",
  },
  {
    icon: Hammer,
    label: "In-House Atelier",
    detail: "Bespoke African walnut, stone & brass joinery",
  },
  {
    icon: Sparkles,
    label: "Collectible Store",
    detail: "Ready-to-ship & made-to-order signature pieces",
  },
];

export default async function HomePage() {
  const [settings, projects, services, products] = await Promise.all([
    getSiteSettings(),
    getPublishedProjects(),
    getPublishedServices(),
    getStoreProducts(),
  ]);

  const featured = [...projects]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);
  const featuredProducts = products.filter((p) => p.featured).slice(0, 3);
  const heroCover = featured[0] ? coverImage(featured[0]) : null;
  const resolvedHeroCover = heroCover ? projectImageUrl(heroCover.storage_path) : null;
  const heroSrc =
    resolvedHeroCover && !resolvedHeroCover.startsWith("/images/portfolio/")
      ? resolvedHeroCover
      : SITE_IMAGES.hero;
  const heroAlt =
    resolvedHeroCover && !resolvedHeroCover.startsWith("/images/portfolio/")
      ? (heroCover?.alt_text ?? `${settings.business_name} featured interior`)
      : "Sunlit contemporary living space with bespoke walnut furniture, brass details, and travertine stone";
  const enquiry = `Hello ${settings.business_name}, I would like to make an enquiry.`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/25 bg-ink text-ivory">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(209,173,97,0.16),transparent_60%)]"
        />
        <div className="container-page relative grid items-center gap-14 py-20 lg:grid-cols-12 lg:py-28">
          <div className="animate-fade-up lg:col-span-7">
            <p className="eyebrow-on-dark">Interior Architecture &amp; Collectible Furniture</p>
            <h1 className="mt-5 text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">
              Interiors and furniture, designed with <em className="text-gold">intent.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/75">
              {settings.tagline ??
                `${settings.business_name} designs and furnishes residential, commercial, and hospitality spaces.`}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <WhatsAppButton number={settings.whatsapp_number} message={enquiry} />
              <Link href="/store" className="btn-outline-light">
                Shop the Collection
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:text-gold"
              >
                View Portfolio <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-14 grid gap-6 border-t border-ivory/15 pt-8 sm:grid-cols-3">
              {STUDIO_HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ivory">
                      {label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ivory/60">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up animate-delay-2 lg:col-span-5">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
              <span
                aria-hidden
                className="absolute -right-4 -top-4 h-full w-full border border-gold/50"
              />
              <span
                aria-hidden
                className="absolute -bottom-4 -left-4 h-24 w-24 border-b border-l border-gold/50"
              />
              <div className="editorial-frame relative h-full w-full bg-ivory/5">
                <Image
                  src={heroSrc}
                  alt={heroAlt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 28rem, 90vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-6">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-gold">
                    Signature Materiality
                  </p>
                  <p className="mt-1 font-display text-xl text-ivory">
                    African Walnut · Honed Travertine · Unlacquered Brass
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolio Work */}
      <section className="container-page py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Selected Portfolio"
            title="Spaces shaped by light and craft"
            description="A curated selection of completed residential, commercial, and hospitality commissions."
          />
          {featured.length > 0 && (
            <Link href="/portfolio" className="btn-outline">
              Full Portfolio <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>

        {featured.length > 0 ? (
          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <ProjectCard key={project.id} project={project} priority={false} />
            ))}
          </div>
        ) : (
          <EmptyState title="Our portfolio is being prepared" className="mt-14">
            Completed projects will appear here soon. In the meantime, you are welcome to start a
            conversation with us.
          </EmptyState>
        )}
      </section>

      {/* The Wura Store Showcase */}
      {featuredProducts.length > 0 && (
        <section className="border-y border-ink/10 bg-ivory-dark/60 py-20 lg:py-28">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="The Wura Store"
                title="Collectible furniture & objects"
                description="Acquire individual pieces crafted in our workshop—available ready to ship or made to measure for your space."
              />
              <Link href="/store" className="btn-dark">
                Explore All {products.length} Pieces <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} priority={false} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="bg-ink py-20 text-ivory lg:py-28">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Capabilities"
              title="Comprehensive design & build services"
              description="From architectural shell revisions to the final hand-turned ceramic vessel on your dining table."
              tone="dark"
            />
            <Link href="/services" className="btn-outline-light">
              All Services <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {services.length > 0 ? (
            <ul className="mt-14 grid gap-8 lg:grid-cols-3">
              {services.map((service, i) => {
                const img = SERVICE_IMAGES[service.slug] ?? {
                  src: SITE_IMAGES.craftsmanship,
                  alt: service.title,
                };
                return (
                  <li key={service.id} className="surface-dark group flex flex-col overflow-hidden">
                    <Link href={`/services/${service.slug}`} className="flex flex-1 flex-col">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ivory/5">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          loading="lazy"
                          sizes="(min-width: 1024px) 33vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <span className="absolute left-4 top-4 bg-ink/90 px-3 py-1 font-display text-xl text-gold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-8">
                        <div>
                          <h3 className="text-2xl font-medium group-hover:text-gold">
                            {service.title}
                          </h3>
                          {service.summary && (
                            <p className="mt-3 text-sm leading-relaxed text-ivory/70">
                              {service.summary}
                            </p>
                          )}
                        </div>
                        <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                          Explore Scope
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                            aria-hidden
                          />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-10 max-w-xl text-ivory/70">
              Our services will be listed here soon. To discuss your space, message us on WhatsApp.
            </p>
          )}
        </div>
      </section>

      {/* Brand introduction */}
      {settings.about_story && (
        <section className="container-page grid items-center gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-6">
            <SectionHeading eyebrow="The Atelier" title={`About ${settings.business_name}`} />
            <p className="mt-8 text-lg leading-relaxed text-ink/80">
              {truncate(settings.about_story.split(/\n{2,}/)[0], 420)}
            </p>
            {settings.design_philosophy && (
              <blockquote className="mt-6 border-l-2 border-gold pl-5 font-display text-2xl italic leading-relaxed text-ink/85">
                &ldquo;{truncate(settings.design_philosophy.split(/\n{2,}/)[0], 220)}&rdquo;
              </blockquote>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/about" className="btn-outline">
                Read Our Story <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-6">
            <div className="editorial-frame relative aspect-[4/5] border border-ink/10">
              <Image
                src={SITE_IMAGES.studio}
                alt="Wura Interiors material library with travertine stone, brushed brass, linen swatches, and walnut timber"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
            <div className="editorial-frame relative aspect-[4/5] border border-ink/10 sm:mt-10">
              <Image
                src={SITE_IMAGES.craftsmanship}
                alt="Bespoke African walnut armchair frame with brushed brass joinery in our studio"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Closing call to action */}
      <section className="border-t border-gold/30 bg-ivory-dark py-24 text-center">
        <div className="container-page">
          <p className="eyebrow mx-auto">Begin a Dialogue</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-medium sm:text-5xl">
            Planning a residence, commercial space, or custom piece?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink/70">
            Speak directly with our studio on WhatsApp to schedule a consultation or acquire pieces from the Wura Collection.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <WhatsAppButton number={settings.whatsapp_number} message={enquiry} variant="dark" />
            <Link href="/store" className="btn-outline">
              Visit the Store
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
