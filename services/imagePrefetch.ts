/**
 * Enterprise listing image pipeline — expo-image disk + memory cache.
 * Returns full image URL lists from the API; warms cache progressively (hero first, neighbors on swipe).
 */

import { Image as ExpoImage } from "expo-image";
import { resolveUploadedMediaUrl } from "../utils/mediaUri";

const prefetchedUrls = new Set<string>();
const MAX_TRACKED = 500;

/** Tunables for feed vs detail without capping API payloads. */
export const LISTING_IMAGE_PREFETCH = {
  feedVisibleCards: 12,
  /** First slide per card in feed — rest load when user swipes carousel */
  feedLeadingPerProperty: 1,
  carouselAhead: 2,
  carouselBehind: 1,
  detailMax: 48,
  detailLeading: 6,
} as const;

function trackUrl(url: string): boolean {
  if (prefetchedUrls.has(url)) return false;
  if (prefetchedUrls.size >= MAX_TRACKED) {
    const first = prefetchedUrls.values().next().value;
    if (first) prefetchedUrls.delete(first);
  }
  prefetchedUrls.add(url);
  return true;
}

function validHttpUrl(u: unknown): u is string {
  return (
    typeof u === "string" &&
    (u.startsWith("http://") || u.startsWith("https://"))
  );
}

/** Normalize and dedupe listing image URLs for display + prefetch. */
export function normalizeListingImageUrls(raw: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (u: unknown) => {
    if (typeof u !== "string" || !u.trim()) return;
    const resolved = resolveUploadedMediaUrl(u);
    if (!validHttpUrl(resolved) || seen.has(resolved)) return;
    seen.add(resolved);
    out.push(resolved);
  };

  if (Array.isArray(raw)) {
    raw.forEach(push);
  } else if (typeof raw === "string") {
    push(raw);
  }
  return out;
}

export type PrefetchImagesOptions = {
  max?: number;
  leadingHighPriority?: number;
};

function prefetchOne(url: string): void {
  if (!trackUrl(url)) return;
  void ExpoImage.prefetch(url, { cachePolicy: "memory-disk" }).catch(() => {
    prefetchedUrls.delete(url);
  });
}

/**
 * Prefetch image URLs into expo-image cache.
 */
export function prefetchImages(
  urls: string[],
  options?: PrefetchImagesOptions,
): void {
  const max = options?.max ?? 24;
  const leading = options?.leadingHighPriority ?? 4;
  const list = urls.filter(validHttpUrl).slice(0, max);
  list.forEach((url, index) => {
    prefetchOne(url);
    if (index < leading - 1) {
      // Leading URLs are queued first in forEach order.
      void index;
    }
  });
}

/** Warm hero image for each visible feed card (full gallery still available on swipe). */
export function prefetchFeedListingImages(
  properties: Array<{ images?: string[]; image?: string }>,
  options?: {
    visibleCount?: number;
    leadingPerProperty?: number;
  },
): void {
  const visible = options?.visibleCount ?? LISTING_IMAGE_PREFETCH.feedVisibleCards;
  const perProp =
    options?.leadingPerProperty ?? LISTING_IMAGE_PREFETCH.feedLeadingPerProperty;

  for (const p of properties.slice(0, visible)) {
    const urls = normalizeListingImageUrls(p.images ?? p.image);
    prefetchImages(urls, {
      max: perProp,
      leadingHighPriority: perProp,
    });
  }
}

/** Prefetch slides around the current carousel index. */
export function prefetchCarouselNeighbors(
  images: string[],
  currentIndex: number,
  options?: { ahead?: number; behind?: number },
): void {
  const ahead = options?.ahead ?? LISTING_IMAGE_PREFETCH.carouselAhead;
  const behind = options?.behind ?? LISTING_IMAGE_PREFETCH.carouselBehind;
  const start = Math.max(0, currentIndex - behind);
  const end = Math.min(images.length, currentIndex + ahead + 1);
  prefetchImages(images.slice(start, end), {
    max: end - start,
    leadingHighPriority: 1,
  });
}

export const prefetchPropertySaleImages = (property: {
  images?: string[];
  image?: string;
  classified_photos?: { photos?: string[] }[];
}): void => {
  const urls: string[] = [];
  urls.push(...normalizeListingImageUrls(property.images));
  if (!urls.length) {
    urls.push(...normalizeListingImageUrls(property.image));
  }
  if (Array.isArray(property.classified_photos)) {
    for (const cp of property.classified_photos) {
      if (Array.isArray(cp?.photos)) {
        urls.push(...normalizeListingImageUrls(cp.photos));
      }
    }
  }
  prefetchImages(urls, {
    max: LISTING_IMAGE_PREFETCH.detailMax,
    leadingHighPriority: LISTING_IMAGE_PREFETCH.detailLeading,
  });
};
