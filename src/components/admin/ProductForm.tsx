"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createProduct,
  deleteProduct,
  setProductStatus,
  updateProduct,
} from "@/actions/products";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";
import { STORE_CATEGORIES } from "@/lib/sample-data";
import { slugify } from "@/lib/utils";
import type { ProductGalleryItem, StoreProduct } from "@/types";
import { useActionForm, useRunAction } from "./hooks";

export function ProductForm({ product }: { product?: StoreProduct }) {
  const router = useRouter();
  const action = product ? updateProduct : createProduct;
  const { state, pending, onSubmit } = useActionForm(action);
  const {
    run: runQuickAction,
    pending: quickPending,
    notice: quickNotice,
  } = useRunAction();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [gallery, setGallery] = useState<ProductGalleryItem[]>(
    product?.gallery_paths ?? [],
  );

  const errors = state?.fieldErrors ?? {};

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function addGalleryRow() {
    setGallery((prev) => [...prev, { path: "", alt: "", caption: "" }]);
  }

  function updateGalleryRow(
    idx: number,
    field: keyof ProductGalleryItem,
    value: string,
  ) {
    setGallery((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  function removeGalleryRow(idx: number) {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="admin-card space-y-6" noValidate>
        {product && <input type="hidden" name="id" value={product.id} />}
        <input
          type="hidden"
          name="gallery_json"
          value={JSON.stringify(gallery)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Product name"
            name="name"
            required
            maxLength={140}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            errors={errors.name}
          />
          <TextField
            label="URL slug"
            name="slug"
            required
            maxLength={80}
            value={slug}
            hint="Appears in the address: /store/your-slug"
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value);
            }}
            errors={errors.slug}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            label="Category"
            name="category"
            defaultValue={product?.category ?? "Seating"}
            errors={errors.category}
          >
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Price (NGN ₦)"
            name="price"
            type="number"
            required
            min={1000}
            step={1000}
            defaultValue={product?.price ?? 1450000}
            errors={errors.price}
          />

          <SelectField
            label="Availability"
            name="availability"
            defaultValue={product?.availability ?? "in_stock"}
            errors={errors.availability}
          >
            <option value="in_stock">In Stock</option>
            <option value="made_to_order">Made to Order</option>
          </SelectField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Stock quantity"
            name="stock_quantity"
            type="number"
            required
            min={0}
            max={10000}
            defaultValue={product?.stock_quantity ?? 5}
            hint="Used for In Stock items; decremented on paid orders"
            errors={errors.stock_quantity}
          />

          <TextField
            label="Lead time"
            name="lead_time"
            required
            maxLength={140}
            defaultValue={
              product?.lead_time ?? "In stock · Delivers in 5–7 business days"
            }
            placeholder="e.g. Made to order · 4–6 weeks"
            errors={errors.lead_time}
          />

          <SelectField
            label="Visibility status"
            name="status"
            defaultValue={product?.status ?? "published"}
            errors={errors.status}
          >
            <option value="published">Published (Live in Store)</option>
            <option value="draft">Draft (Hidden)</option>
            <option value="archived">Archived</option>
          </SelectField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Dimensions"
            name="dimensions"
            required
            maxLength={240}
            defaultValue={product?.dimensions ?? ""}
            placeholder="e.g. 220 cm L × 50 cm D × 78 cm H"
            errors={errors.dimensions}
          />

          <TextField
            label="Materials"
            name="materials"
            required
            maxLength={300}
            defaultValue={product?.materials ?? ""}
            placeholder="e.g. Solid African Walnut, Brushed Brass"
            errors={errors.materials}
          />

          <TextField
            label="Finish"
            name="finish"
            required
            maxLength={240}
            defaultValue={product?.finish ?? ""}
            placeholder="e.g. Hand-rubbed matte natural hardwax oil"
            errors={errors.finish}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Primary image path or URL"
            name="image_path"
            required
            maxLength={500}
            defaultValue={product?.image_path ?? "/images/store/boucle-chair.jpg"}
            hint="Use a local path (/images/store/...) or an https:// image URL"
            errors={errors.image_path}
          />

          <TextField
            label="Primary image alt text"
            name="alt_text"
            required
            maxLength={250}
            defaultValue={product?.alt_text ?? ""}
            placeholder="Describe the piece for screen readers"
            errors={errors.alt_text}
          />
        </div>

        <TextAreaField
          label="Short summary"
          name="summary"
          rows={2}
          required
          maxLength={350}
          defaultValue={product?.summary ?? ""}
          hint="Shown on store product cards (up to 350 characters)"
          errors={errors.summary}
        />

        <TextAreaField
          label="Full narrative description"
          name="description"
          rows={6}
          required
          maxLength={10000}
          defaultValue={product?.description ?? ""}
          hint="Separate paragraphs with a blank line."
          errors={errors.description}
        />

        {/* Additional Gallery Images */}
        <div className="space-y-4 border-t border-ink/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-medium">Additional gallery images</h3>
              <p className="text-xs text-ink/65">
                Optional detail or installation shots shown on the product page.
              </p>
            </div>
            <button
              type="button"
              onClick={addGalleryRow}
              className="btn-outline btn-sm"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add gallery image
            </button>
          </div>

          {gallery.length > 0 && (
            <div className="space-y-3">
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 border border-ink/10 bg-ivory/60 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <label className="field-label text-xs">
                      Image path / URL
                    </label>
                    <input
                      type="text"
                      value={item.path}
                      onChange={(e) =>
                        updateGalleryRow(idx, "path", e.target.value)
                      }
                      placeholder="/images/portfolio/..."
                      className="field-input"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="field-label text-xs">Alt text</label>
                    <input
                      type="text"
                      value={item.alt}
                      onChange={(e) =>
                        updateGalleryRow(idx, "alt", e.target.value)
                      }
                      placeholder="Description of detail shot"
                      className="field-input"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="field-label text-xs">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      value={item.caption ?? ""}
                      onChange={(e) =>
                        updateGalleryRow(idx, "caption", e.target.value)
                      }
                      placeholder="Caption below image"
                      className="field-input"
                    />
                  </div>
                  <div className="flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeGalleryRow(idx)}
                      aria-label="Remove gallery image"
                      className="inline-flex h-10 w-10 items-center justify-center border border-ink/20 text-ink/60 hover:border-red-700 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
            className="h-4 w-4 accent-ink"
          />
          <span>
            <strong>Feature on homepage</strong> — highlight this piece in the
            homepage store section.
          </span>
        </label>

        <Notice state={state} />

        <div className="flex justify-end">
          <button type="submit" className="btn-dark" disabled={pending}>
            {pending
              ? "Saving…"
              : product
                ? "Save product"
                : "Create product"}
          </button>
        </div>
      </form>

      {product && (
        <section className="admin-card space-y-4" aria-labelledby="prod-actions">
          <h2 id="prod-actions" className="text-2xl font-medium">
            Store visibility &amp; actions
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {product.status === "published" && (
              <Link
                href={`/store/${product.slug}`}
                target="_blank"
                className="btn-outline"
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> View in Store
              </Link>
            )}
            {product.status !== "published" && (
              <button
                type="button"
                className="btn-gold"
                disabled={quickPending}
                onClick={() =>
                  runQuickAction(() => setProductStatus(product.id, "published"))
                }
              >
                Publish to Store
              </button>
            )}
            {product.status === "published" && (
              <button
                type="button"
                className="btn-outline"
                disabled={quickPending}
                onClick={() =>
                  runQuickAction(() => setProductStatus(product.id, "draft"))
                }
              >
                Unpublish (move to draft)
              </button>
            )}
            <span className="grow" />
            <ConfirmButton
              label="Delete product"
              title={`Delete “${product.name}”?`}
              description="This product will be permanently removed from the store catalog."
              onConfirm={() =>
                runQuickAction(async () => {
                  const res = await deleteProduct(product.id);
                  if (res.ok) router.push("/admin/products");
                  return res;
                })
              }
              disabled={quickPending}
            />
          </div>
          <Notice state={quickNotice} />
        </section>
      )}
    </div>
  );
}
