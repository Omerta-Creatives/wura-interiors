"use client";
/* eslint-disable @next/next/no-img-element */

import { ArrowDown, ArrowUp, ImagePlus, Link2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  addProjectImages,
  deleteImage,
  moveImage,
  setCoverImage,
  updateImageDetails,
} from "@/actions/images";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Notice } from "@/components/ui/Notice";
import { IMAGE_LIMITS } from "@/lib/env";
import type { ProjectImage } from "@/types";
import { useRunAction } from "./hooks";

type ImageWithUrl = ProjectImage & { url: string };

const ALLOWED_TYPES = new Set<string>(IMAGE_LIMITS.projectTypes);

function fileToDataUrlAndDimensions(
  file: File,
): Promise<{ dataUrl: string; width: number | null; height: number | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.naturalWidth || null,
          height: img.naturalHeight || null,
        });
      };
      img.onerror = () => {
        resolve({ dataUrl, width: null, height: null });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageManager({
  projectId,
  images,
}: {
  projectId: string;
  images: ImageWithUrl[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const issues: string[] = [];
    const uploaded: {
      path: string;
      width: number | null;
      height: number | null;
    }[] = [];

    setResult(null);
    setProblems([]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length, name: file.name });

      if (!ALLOWED_TYPES.has(file.type)) {
        issues.push(
          `${file.name}: unsupported format. Use JPEG, PNG, WebP or AVIF.`,
        );
        continue;
      }
      if (file.size > IMAGE_LIMITS.projectMaxBytes) {
        issues.push(`${file.name}: larger than 10 MB.`);
        continue;
      }

      try {
        const { dataUrl, width, height } =
          await fileToDataUrlAndDimensions(file);
        uploaded.push({ path: dataUrl, width, height });
      } catch {
        issues.push(`${file.name}: could not process image.`);
      }
    }

    setProgress(null);

    if (uploaded.length > 0) {
      const saved = await addProjectImages(projectId, uploaded);
      if (saved.ok) {
        setResult({ ok: true, message: saved.message ?? "Images added." });
        router.refresh();
      } else {
        issues.push(saved.message ?? "Could not save the uploaded images.");
      }
    }

    setProblems(issues);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleAddByUrl() {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setResult(null);
    setProblems([]);

    const saved = await addProjectImages(projectId, [
      { path: trimmed, width: 1600, height: 1200 },
    ]);
    if (saved.ok) {
      setResult({ ok: true, message: "Image added." });
      setImageUrlInput("");
      router.refresh();
    } else {
      setProblems([saved.message ?? "Could not add image URL."]);
    }
  }

  const uploading = progress !== null;

  return (
    <section className="admin-card space-y-6" aria-labelledby="images">
      <div>
        <h2 id="images" className="text-2xl font-medium">
          Images
        </h2>
        <p className="mt-1 text-sm text-ink/70">
          Upload JPEG, PNG, WebP or AVIF photographs, or add an image path/URL.
          The first image becomes the cover; change it any time.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="image-upload"
            className={`btn-dark cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <ImagePlus className="h-4 w-4" aria-hidden /> Upload images
          </label>
          <input
            ref={inputRef}
            id="image-upload"
            type="file"
            multiple
            accept={IMAGE_LIMITS.projectTypes.join(",")}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Or paste image path/URL (e.g. /images/portfolio/ikoyi-penthouse-cover.jpg or https://...)"
            className="field-input flex-1"
          />
          <button
            type="button"
            onClick={handleAddByUrl}
            disabled={!imageUrlInput.trim() || uploading}
            className="btn-outline btn-sm"
          >
            <Link2 className="h-4 w-4" aria-hidden /> Add by URL
          </button>
        </div>

        {progress && (
          <p className="text-sm text-ink/80" aria-live="polite">
            Processing {progress.current} of {progress.total}:{" "}
            <span className="font-medium">{progress.name}</span>
          </p>
        )}

        <div className="space-y-2">
          <Notice state={result} />
          {problems.length > 0 && (
            <div
              role="alert"
              className="border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              <p className="font-medium">Some files could not be added:</p>
              <ul className="mt-1 list-disc pl-5">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <div className="border border-dashed border-ink/25 px-6 py-12 text-center text-sm text-ink/60">
          No images yet. Upload photographs to build this project&rsquo;s
          gallery. A project needs at least one image before it can be
          published.
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {images.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              projectId={projectId}
              isFirst={index === 0}
              isLast={index === images.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ImageCard({
  image,
  projectId,
  isFirst,
  isLast,
}: {
  image: ImageWithUrl;
  projectId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { run, pending, notice } = useRunAction();
  const [caption, setCaption] = useState(image.caption ?? "");
  const [alt, setAlt] = useState(image.alt_text ?? "");
  const dirty =
    caption !== (image.caption ?? "") || alt !== (image.alt_text ?? "");

  return (
    <li className="border border-ink/10 bg-ivory/50">
      <div className="relative aspect-[4/3] bg-ink/10">
        <img
          src={image.url}
          alt={image.alt_text ?? ""}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {image.is_cover && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-gold px-2 py-1 text-xs font-medium text-ink">
            <Star className="h-3 w-3" aria-hidden /> Cover
          </span>
        )}
        {!image.alt_text && (
          <span className="absolute right-2 top-2 bg-amber-100 px-2 py-1 text-xs text-amber-900">
            Alt text missing
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <label htmlFor={`alt-${image.id}`} className="field-label text-xs">
            Alt text (describes the image for screen readers)
          </label>
          <input
            id={`alt-${image.id}`}
            className="field-input"
            value={alt}
            maxLength={250}
            onChange={(e) => setAlt(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor={`caption-${image.id}`}
            className="field-label text-xs"
          >
            Caption (optional)
          </label>
          <input
            id={`caption-${image.id}`}
            className="field-input"
            value={caption}
            maxLength={200}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-dark btn-sm"
            disabled={pending || !dirty}
            onClick={() =>
              run(() =>
                updateImageDetails(image.id, { caption, alt_text: alt }),
              )
            }
          >
            Save details
          </button>
          {!image.is_cover && (
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={pending}
              onClick={() => run(() => setCoverImage(projectId, image.id))}
            >
              Set as cover
            </button>
          )}
          <span className="grow" />
          <button
            type="button"
            className="btn-outline btn-sm"
            aria-label="Move image earlier"
            disabled={pending || isFirst}
            onClick={() => run(() => moveImage(projectId, image.id, "up"))}
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="btn-outline btn-sm"
            aria-label="Move image later"
            disabled={pending || isLast}
            onClick={() => run(() => moveImage(projectId, image.id, "down"))}
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
          <ConfirmButton
            label="Delete"
            title="Delete this image?"
            description="The image will be permanently removed from this project."
            onConfirm={() => run(() => deleteImage(image.id))}
            disabled={pending}
          />
        </div>

        <Notice state={notice} />
      </div>
    </li>
  );
}
