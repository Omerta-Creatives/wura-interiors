"use client";

import { Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SHIPPING_CONFIG } from "@/lib/env";
import { productImageUrl } from "@/lib/storage";
import { formatPrice, whatsappLink } from "@/lib/utils";
import type { StoreProduct } from "@/types";

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string;
  setNotes: (notes: string) => void;
  addItem: (product: StoreProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "wura-interiors-cart-v1";
const NOTES_STORAGE_KEY = "wura-interiors-cart-notes-v1";

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

export function CartProvider({
  children,
  businessName,
  whatsappNumber,
}: {
  children: React.ReactNode;
  businessName: string;
  whatsappNumber: string | null;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notes, setNotes] = useState("");
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
      const savedNotes = window.localStorage.getItem(NOTES_STORAGE_KEY);
      if (savedNotes) setNotes(savedNotes);
    } catch {
      // Ignore storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist cart changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, notes);
    } catch {
      // Ignore storage errors
    }
  }, [notes, hydrated]);

  // Fallback for browsers without <dialog closedby="any"> support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof HTMLDialogElement === "undefined") return;

    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (isDialogContent) return;
        dialog.close();
      };

      dialog.addEventListener("click", handleBackdropClick);
      return () => dialog.removeEventListener("click", handleBackdropClick);
    }
  }, []);

  const openCart = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const closeCart = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      dialog.close();
    }
  }, []);

  const addItem = useCallback(
    (product: StoreProduct, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        return [...prev, { product, quantity }];
      });
      openCart();
    },
    [openCart],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setNotes("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(NOTES_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  );

  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= SHIPPING_CONFIG.freeShippingThreshold
      ? 0
      : SHIPPING_CONFIG.standardWhiteGloveFee;
  }, [items.length, subtotal]);

  const total = subtotal + deliveryFee;

  const orderMessage = useMemo(() => {
    const lines = [
      `Hello ${businessName}, I would like to place an order from the Wura Store:`,
      "",
      ...items.map(
        (i, idx) =>
          `${idx + 1}. ${i.product.name} × ${i.quantity} — ${formatPrice(i.product.price * i.quantity)} (${i.product.lead_time})`,
      ),
      "",
      `Estimated Subtotal: ${formatPrice(subtotal)}`,
    ];
    if (notes.trim()) {
      lines.push("", `Delivery / Customization Notes: ${notes.trim()}`);
    }
    return lines.join("\n");
  }, [businessName, items, subtotal, notes]);

  const waHref = whatsappLink(whatsappNumber, orderMessage);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      deliveryFee,
      total,
      notes,
      setNotes,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      items,
      totalItems,
      subtotal,
      deliveryFee,
      total,
      notes,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        {...({ closedby: "any" } as Record<string, string>)}
        aria-labelledby="cart-dialog-title"
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md border-l border-gold/30 bg-ivory p-0 text-ink shadow-2xl open:flex open:flex-col"
      >
        <div className="flex items-center justify-between border-b border-ink/10 bg-ink px-6 py-5 text-ivory">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-gold" aria-hidden />
            <div>
              <h2 id="cart-dialog-title" className="text-2xl font-medium">
                Your Selection
              </h2>
              <p className="text-xs text-ivory/65">
                {totalItems} {totalItems === 1 ? "piece" : "pieces"} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close selection bag"
            className="inline-flex h-9 w-9 items-center justify-center border border-ivory/20 text-ivory transition-colors hover:border-gold hover:text-gold"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center border border-gold/40 bg-ivory-dark/50">
                <ShoppingBag className="h-6 w-6 text-gold-dark" aria-hidden />
              </div>
              <h3 className="mt-5 text-2xl font-medium">Your bag is empty</h3>
              <p className="mt-2 max-w-xs text-sm text-ink/65">
                Explore our collectible furniture, lighting, and architectural
                objects crafted in our atelier.
              </p>
              <Link
                href="/store"
                onClick={closeCart}
                className="btn-dark mt-6"
              >
                Explore the Store
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="divide-y divide-ink/10">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex gap-4 py-4 first:pt-0">
                    <Link
                      href={`/store/${product.slug}`}
                      onClick={closeCart}
                      className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink/10"
                    >
                      <Image
                        src={productImageUrl(product.image_path)}
                        alt={product.alt_text}
                        fill
                        loading="lazy"
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/store/${product.slug}`}
                            onClick={closeCart}
                            className="font-display text-lg font-medium leading-tight hover:text-gold-dark"
                          >
                            {product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            aria-label={`Remove ${product.name}`}
                            className="text-ink/40 transition-colors hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-ink/60">
                          {formatPrice(product.price)} ·{" "}
                          {product.lead_time.split("·")[0].trim()}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-ink/20 bg-ivory-light">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="px-2.5 py-1 text-ink/70 hover:text-ink"
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </button>
                          <span className="min-w-[2rem] text-center text-xs font-semibold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="px-2.5 py-1 text-ink/70 hover:text-ink"
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div>
                <label htmlFor="cart-notes" className="field-label">
                  Bespoke Finish or Delivery Notes (Optional)
                </label>
                <textarea
                  id="cart-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. custom table length, timber finish preference, or delivery instructions..."
                  className="field-input"
                />
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ink/15 bg-ivory-dark/70 px-6 py-5">
            <div className="space-y-1.5 text-xs text-ink/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>White-Glove Delivery</span>
                <span>
                  {deliveryFee === 0
                    ? "Complimentary"
                    : formatPrice(deliveryFee)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t border-ink/10 pt-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/80">
                Total
              </span>
              <span className="font-display text-2xl font-semibold text-ink">
                {formatPrice(total)}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-gold w-full"
              >
                <Lock className="h-4 w-4" aria-hidden />
                Proceed to Checkout
              </Link>

              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full"
                >
                  Enquire on WhatsApp
                </a>
              )}

              <button
                type="button"
                onClick={clearCart}
                className="text-center text-xs text-ink/55 underline underline-offset-4 hover:text-ink"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
      </dialog>
    </CartContext.Provider>
  );
}

export function CartTrigger() {
  const { totalItems, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open shopping bag (${totalItems} items)`}
      className="relative inline-flex items-center gap-2 py-1 text-xs font-medium uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:text-gold"
    >
      <ShoppingBag className="h-4 w-4 text-gold" aria-hidden />
      <span className="hidden sm:inline">Bag</span>
      {totalItems > 0 && (
        <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gold px-1 text-[0.62rem] font-bold leading-none text-ink">
          {totalItems}
        </span>
      )}
    </button>
  );
}
