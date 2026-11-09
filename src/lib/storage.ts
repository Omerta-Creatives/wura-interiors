const KNOWN_LOCAL_IMAGES: Record<string, string> = {
  "abuja-study-cover.jpg": "/images/portfolio/abuja-study-cover.jpg",
  "abuja-study-nook.jpg": "/images/portfolio/abuja-study-nook.jpg",
  "ikoyi-penthouse-cover.jpg": "/images/portfolio/ikoyi-penthouse-cover.jpg",
  "ikoyi-penthouse-dining.jpg": "/images/portfolio/ikoyi-penthouse-dining.jpg",
  "ikoyi-penthouse-suite.jpg": "/images/portfolio/ikoyi-penthouse-suite.jpg",
  "lekki-villa-cover.jpg": "/images/portfolio/lekki-villa-cover.jpg",
  "lekki-villa-kitchen.jpg": "/images/portfolio/lekki-villa-kitchen.jpg",
  "maitama-hotel-bath.jpg": "/images/portfolio/maitama-hotel-bath.jpg",
  "maitama-hotel-cover.jpg": "/images/portfolio/maitama-hotel-cover.jpg",
  "oyo-collection-cover.jpg": "/images/portfolio/oyo-collection-cover.jpg",
  "oyo-collection-credenza.jpg": "/images/portfolio/oyo-collection-credenza.jpg",
  "vi-lounge-boardroom.jpg": "/images/portfolio/vi-lounge-boardroom.jpg",
  "vi-lounge-cover.jpg": "/images/portfolio/vi-lounge-cover.jpg",
  "about-studio.jpg": "/images/site/about-studio.jpg",
  "craftsmanship.jpg": "/images/site/craftsmanship.jpg",
  "hero-interior.jpg": "/images/site/hero-interior.jpg",
  "boucle-chair.jpg": "/images/store/boucle-chair.jpg",
  "brass-chandelier.jpg": "/images/store/brass-chandelier.jpg",
  "cane-daybed.jpg": "/images/store/cane-daybed.jpg",
  "ceramic-vessels.jpg": "/images/store/ceramic-vessels.jpg",
  "linen-sofa.jpg": "/images/store/linen-sofa.jpg",
  "travertine-table.jpg": "/images/store/travertine-table.jpg",
};

const DEFAULT_FALLBACK_IMAGE = "/images/site/craftsmanship.jpg";

/**
 * Resolves a stored image path or URL to a renderable src attribute.
 * Supports local public assets (/images/...), external URLs (https://...), and data URLs,
 * and falls back cleanly if a legacy relative storage key is encountered.
 */
export function resolveImageUrl(
  path: string | null | undefined,
  fallback = DEFAULT_FALLBACK_IMAGE,
): string {
  const trimmed = path?.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Check if the filename matches one of our bundled studio/portfolio/store images
  const baseName = trimmed.split("/").pop()?.split("?")[0]?.toLowerCase();
  if (baseName && KNOWN_LOCAL_IMAGES[baseName]) {
    return KNOWN_LOCAL_IMAGES[baseName];
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // Guard against unconfigured placeholder supabase URLs
    if (
      trimmed.includes("your-project-id.supabase.co") ||
      trimmed.startsWith("/storage/v1/")
    ) {
      return fallback;
    }
    return trimmed;
  }

  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }

  if (trimmed.startsWith("images/")) {
    return `/${trimmed}`;
  }

  // Legacy relative UUID object paths (e.g. "<project_id>/<uuid>.jpg") that do not exist in /public
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(trimmed)) {
    return fallback;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

export const projectImageUrl = (path: string | null | undefined) =>
  resolveImageUrl(path, "/images/portfolio/ikoyi-penthouse-cover.jpg");

export const brandAssetUrl = (path: string | null | undefined) =>
  resolveImageUrl(path, "/images/site/hero-interior.jpg");

export const productImageUrl = (path: string | null | undefined) =>
  resolveImageUrl(path, "/images/store/boucle-chair.jpg");
