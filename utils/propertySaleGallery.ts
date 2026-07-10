/**
 * Full property sale gallery — merges main images + classified room photos.
 */

import { normalizeListingImageUrls } from "../services/imagePrefetch";

function safeStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed)
        ? parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        : [];
    } catch {
      return val.trim() ? [val.trim()] : [];
    }
  }
  return [];
}

/** All listing photo URLs for cards, maps, and detail (deduped, order preserved). */
export function flattenPropertySaleGalleryImages(
  source: Record<string, unknown> | null | undefined,
): string[] {
  if (!source) return [];

  const seen = new Set<string>();
  const ordered: string[] = [];
  const pushMany = (urls: string[]) => {
    for (const u of normalizeListingImageUrls(urls)) {
      if (seen.has(u)) continue;
      seen.add(u);
      ordered.push(u);
    }
  };

  pushMany(
    safeStringArray(
      source.images ??
        source.Images ??
        source.image_urls ??
        source.imageUrls ??
        source.photos ??
        source.gallery,
    ),
  );

  const single = source.image ?? source.thumbnail_url ?? source.thumbnailURL;
  if (typeof single === "string" && single.trim()) {
    pushMany([single]);
  }

  const classified =
    source.classified_photos ?? source.ClassifiedPhotos ?? source.classifiedPhotos;
  if (Array.isArray(classified)) {
    for (const cp of classified) {
      if (!cp || typeof cp !== "object") continue;
      const row = cp as { photos?: unknown; Photos?: unknown };
      pushMany(safeStringArray(row.photos ?? row.Photos));
    }
  }

  return ordered;
}
