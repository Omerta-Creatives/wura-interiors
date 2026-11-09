"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { setLogo } from "@/actions/settings";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Notice } from "@/components/ui/Notice";
import { IMAGE_LIMITS } from "@/lib/env";
import { brandAssetUrl } from "@/lib/storage";
import { useRunAction } from "./hooks";

const ALLOWED_TYPES = new Set<string>(IMAGE_LIMITS.logoTypes);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

export function LogoUploader({ logoPath }: { logoPath: string | null }) {
  const { run, pending, notice } = useRunAction();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Unsupported format. Use PNG, JPEG, WebP or SVG.");
      return;
    }
    if (file.size > IMAGE_LIMITS.logoMaxBytes) {
      setError("The logo must be 2 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setUploading(false);
      run(() => setLogo(dataUrl));
    } catch {
      setUploading(false);
      setError("Could not process logo file.");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="admin-card space-y-5" aria-labelledby="logo-heading">
      <div>
        <h2 id="logo-heading" className="text-2xl font-medium">
          Logo
        </h2>
        <p className="mt-1 text-sm text-ink/70">
          Until the official logo is uploaded, the website shows a text
          placeholder. A transparent PNG or an SVG works best on the black
          header. Maximum 2 MB.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex h-24 w-56 items-center justify-center bg-ink p-4">
          {logoPath ? (
            <img
              src={brandAssetUrl(logoPath)}
              alt="Current logo"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-center font-display text-xl uppercase tracking-[0.3em] text-gold">
              Wura
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="logo-upload"
            className={`btn-dark cursor-pointer ${uploading || pending ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading
              ? "Uploading…"
              : logoPath
                ? "Replace logo"
                : "Upload logo"}
          </label>
          <input
            ref={inputRef}
            id="logo-upload"
            type="file"
            accept={IMAGE_LIMITS.logoTypes.join(",")}
            className="sr-only"
            disabled={uploading || pending}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {logoPath && (
            <ConfirmButton
              label="Remove"
              title="Remove the logo?"
              description="The website will go back to the text placeholder."
              confirmLabel="Remove"
              onConfirm={() => run(() => setLogo(null))}
              disabled={pending}
            />
          )}
        </div>
      </div>

      {error && <Notice state={{ ok: false, message: error }} />}
      <Notice state={notice} />
    </section>
  );
}
