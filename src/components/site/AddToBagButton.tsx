"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { StoreProduct } from "@/types";
import { useCart } from "./CartProvider";

export function AddToBagButton({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock =
    product.availability === "in_stock" &&
    typeof product.stock_quantity === "number" &&
    product.stock_quantity <= 0;

  const maxQuantity =
    product.availability === "in_stock" &&
    typeof product.stock_quantity === "number" &&
    product.stock_quantity > 0
      ? product.stock_quantity
      : 99;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (isOutOfStock) {
    return (
      <div className="border border-ink/15 bg-ivory-dark/70 px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">
        Currently Sold Out · Enquire via WhatsApp for Next Batch
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div className="inline-flex items-center border border-ink/25 bg-ivory-light">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="px-4 py-3.5 text-ink/70 transition-colors hover:text-ink"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="min-w-[2.75rem] text-center text-sm font-semibold">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          aria-label="Increase quantity"
          className="px-4 py-3.5 text-ink/70 transition-colors hover:text-ink"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="btn-gold flex-1 sm:flex-initial"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" aria-hidden />
            Added to Bag
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Add to Selection Bag
          </>
        )}
      </button>
    </div>
  );
}
