import { ArrowLeft, CheckCircle2, Clock, Ruler, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToBagButton } from "@/components/site/AddToBagButton";
import { ProductCard } from "@/components/site/ProductCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Paragraphs } from "@/components/ui/Paragraphs";
import {
  getSiteSettings,
  getStoreProductBySlug,
  getStoreProducts,
} from "@/lib/data";
import { productImageUrl } from "@/lib/storage";
import { formatPrice, truncate } from "@/lib/utils";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  if (!product) return { title: "Piece not found" };

  const description = truncate(product.summary, 155);

  return {
    title: `${product.name} — Store`,
    description,
    alternates: { canonical: `/store/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/store/${product.slug}`,
      images: [{ url: productImageUrl(product.image_path), alt: product.alt_text }],
    },
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, allProducts, settings] = await Promise.all([
    getStoreProductBySlug(slug),
    getStoreProducts(),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  const related = allProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 3);

  const enquiryMessage = `Hello ${settings.business_name}, I would like to order or enquire about the "${product.name}" (${formatPrice(product.price)}) from your Store.`;

  return (
    <article>
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-ink/10 bg-ivory-dark/50">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4 text-xs text-ink/70">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-ink hover:text-gold-dark"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to Store
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/store?category=${encodeURIComponent(product.category)}`}
              className="uppercase tracking-[0.18em] text-gold-dark hover:underline"
            >
              {product.category}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink/60">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Product Showcase */}
      <section className="container-page py-12 lg:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Primary Image + Gallery */}
          <div className="space-y-6 lg:col-span-7">
            <div className="editorial-frame relative aspect-[4/5] w-full">
              <Image
                src={productImageUrl(product.image_path)}
                alt={product.alt_text}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
              <span
                className={`absolute left-5 top-5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${
                  product.availability === "in_stock"
                    ? "bg-ink/90 text-gold"
                    : "bg-ivory/95 text-ink"
                }`}
              >
                {product.availability === "in_stock" ? "In Stock" : "Made to Order"}
              </span>
            </div>

            {product.gallery_paths.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {product.gallery_paths.map((item) => (
                  <figure key={item.path} className="space-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden border border-ink/10 bg-ink/10">
                      <Image
                        src={productImageUrl(item.path)}
                        alt={item.alt}
                        fill
                        loading="lazy"
                        sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    {item.caption && (
                      <figcaption className="text-xs text-ink/60">
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase Box */}
          <div className="lg:sticky lg:top-28 lg:col-span-5">
            <p className="eyebrow">{product.category}</p>
            <h1 className="mt-3 text-4xl font-medium leading-[1.08] sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/15 pb-6">
              <p className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                {formatPrice(product.price)}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/70">
                <Clock className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
                {product.lead_time}
              </span>
            </div>

            <p className="mt-6 text-base leading-relaxed text-ink/80">
              {product.summary}
            </p>

            {/* Add to Bag & Direct WhatsApp */}
            <div className="mt-8 space-y-3 border-y border-ink/15 py-6">
              <AddToBagButton product={product} />
              <div className="pt-1">
                <WhatsAppButton
                  number={settings.whatsapp_number}
                  message={enquiryMessage}
                  label="Order or Enquire on WhatsApp"
                  variant="outline"
                  className="w-full"
                />
              </div>
            </div>

            {/* Narrative Description */}
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/75">
              <Paragraphs text={product.description} />
            </div>

            {/* Specifications List */}
            <dl className="mt-8 divide-y divide-ink/10 border-t border-ink/15 text-sm">
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="flex items-center gap-2 font-medium text-ink">
                  <Ruler className="h-4 w-4 text-gold-dark" aria-hidden />
                  Dimensions
                </dt>
                <dd className="col-span-2 text-ink/75">{product.dimensions}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="flex items-center gap-2 font-medium text-ink">
                  <Sparkles className="h-4 w-4 text-gold-dark" aria-hidden />
                  Materials
                </dt>
                <dd className="col-span-2 text-ink/75">{product.materials}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="flex items-center gap-2 font-medium text-ink">
                  <CheckCircle2 className="h-4 w-4 text-gold-dark" aria-hidden />
                  Finish
                </dt>
                <dd className="col-span-2 text-ink/75">{product.finish}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Complementary Pieces */}
      {related.length > 0 && (
        <section className="border-t border-ink/10 bg-ivory-dark/50 py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Pair With</p>
                <h2 className="mt-2 text-3xl font-medium sm:text-4xl">
                  Complementary pieces
                </h2>
              </div>
              <Link
                href="/store"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-ink hover:text-gold-dark"
              >
                View all pieces →
              </Link>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} priority={false} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
