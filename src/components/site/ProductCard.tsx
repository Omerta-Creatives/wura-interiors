"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { productImageUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import type { StoreProduct } from "@/types";
import { useCart } from "./CartProvider";

export function ProductCard({
  product,
  priority = false,
}: {
  product: StoreProduct;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const isOutOfStock =
    product.availability === "in_stock" &&
    typeof product.stock_quantity === "number" &&
    product.stock_quantity <= 0;

  return (
    <article className="group flex flex-col border border-ink/10 bg-ivory-light/90 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_20px_50px_-20px_rgba(17,17,17,0.18)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/10">
        <Link href={`/store/${product.slug}`} className="block h-full w-full">
          <Image
            src={productImageUrl(product.image_path)}
            alt={product.alt_text}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            loading={priority ? undefined : "lazy"}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Availability pill */}
        <span
          className={`pointer-events-none absolute left-4 top-4 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${
            isOutOfStock
              ? "bg-red-900/90 text-ivory backdrop-blur-sm"
              : product.availability === "in_stock"
                ? "bg-ink/90 text-gold backdrop-blur-sm"
                : "bg-ivory/95 text-ink backdrop-blur-sm"
          }`}
        >
          {isOutOfStock
            ? "Sold Out"
            : product.availability === "in_stock"
              ? "In Stock"
              : "Made to Order"}
        </span>

        {/* Quick add button */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={() => addItem(product, 1)}
            aria-label={`Add ${product.name} to bag`}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 border border-gold/60 bg-ink/90 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ivory backdrop-blur-sm transition-colors hover:bg-gold hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add to Bag
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold-dark">
              {product.category}
            </p>
            <span className="text-xs text-ink/55">{product.lead_time.split("·")[1]?.trim() ?? product.lead_time}</span>
          </div>
          <h3 className="mt-2.5 text-2xl font-medium leading-snug text-ink group-hover:text-gold-dark">
            <Link href={`/store/${product.slug}`} className="inline-flex items-baseline gap-1.5">
              {product.name}
              <ArrowUpRight
                className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/70">
            {product.summary}
          </p>
        </div>

        <div className="mt-6 flex items-baseline justify-between border-t border-ink/10 pt-4">
          <span className="font-display text-2xl font-semibold text-ink">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-ink/55">{product.materials.split(",")[0]}</span>
        </div>
      </div>
    </article>
  );
}
