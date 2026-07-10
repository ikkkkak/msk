/**
 * Landmark image/video payloads vary by route and serialization (Go JSON blobs,
 * stringified arrays, `{ url }` objects). Centralize normalization for feed cards.
 */

import { endpoints } from "../constants";

/** Origin for resolving `/uploads/...` paths (strip trailing `/api` from axios baseURL). */
function mediaOrigin(): string {
  const base = (endpoints.baseURL || "").replace(/\/+$/, "");
  if (/\/api$/i.test(base)) return base.replace(/\/api$/i, "") || base;
  return base;
}

export function resolveLandmarkAssetUrl(raw: string): string {
  const u = String(raw || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const origin = mediaOrigin();
  if (!origin) return u;
  if (u.startsWith("/")) return `${origin}${u}`;
  // Bare relative path without leading slash
  return `${origin}/${u.replace(/^\/+/, "")}`;
}

function coerceUrl(entry: unknown): string | null {
  if (entry == null) return null;
  if (Array.isArray(entry)) {
    for (const item of entry) {
      const u = coerceUrl(item);
      if (u) return u;
    }
    return null;
  }
  if (typeof entry === "string") {
    const t = entry.trim();
    if (!t) return null;
    // Double-encoded JSON array/object
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t) as unknown;
        return coerceUrl(parsed);
      } catch {
        /* continue */
      }
    }
    return t;
  }
  if (typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    const from =
      o.url ??
      o.uri ??
      o.URL ??
      o.src ??
      o.path ??
      o.photo_url ??
      o.image_url;
    return coerceUrl(from);
  }
  return null;
}

function flattenFromValue(val: unknown, out: string[], seen: Set<string>) {
  if (val == null) return;

  // JSON string blob
  if (typeof val === "string") {
    const t = val.trim();
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        flattenFromValue(JSON.parse(t), out, seen);
        return;
      } catch {
        const abs = resolveLandmarkAssetUrl(t);
        if (abs && !seen.has(abs)) {
          seen.add(abs);
          out.push(abs);
        }
        return;
      }
    }
    const abs = resolveLandmarkAssetUrl(t);
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      out.push(abs);
    }
    return;
  }

  if (Array.isArray(val)) {
    for (const item of val) flattenFromValue(item, out, seen);
    return;
  }

  if (typeof val === "object") {
    const u = coerceUrl(val);
    if (u) {
      const abs = resolveLandmarkAssetUrl(u);
      if (abs && !seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    }
  }
}

/**
 * Pull every usable image URL from a landmark-ish API object.
 */
export function extractLandmarkImageUrls(lm: Record<string, unknown> | null | undefined): string[] {
  if (!lm || typeof lm !== "object") return [];
  const seen = new Set<string>();
  const out: string[] = [];

  const buckets: unknown[] = [
    lm.images,
    lm.Images,
    lm.photos,
    lm.Photos,
    lm.photo_urls,
    lm.image_urls,
    lm.imageUrls,
    lm.gallery,
    lm.Gallery,
    lm.picture,
    lm.pictures,
    lm.media,
  ];

  for (const b of buckets) flattenFromValue(b, out, seen);

  // Single thumbnail-ish fields
  flattenFromValue(
    lm.thumbnailURL ?? lm.thumbnail_url ?? lm.ThumbnailURL ?? lm.thumbnail,
    out,
    seen,
  );

  return out;
}

/** First image for cards / posters. */
export function getLandmarkPrimaryImageUrl(
  lm: Record<string, unknown> | null | undefined,
): string | null {
  const urls = extractLandmarkImageUrls(lm);
  return urls[0] ?? null;
}

/** Video URL aligned with LandmarkDetailsScreen + LandmarkCard conventions. */
export function extractLandmarkVideoUrl(
  lm: Record<string, unknown> | null | undefined,
): string | null {
  if (!lm || typeof lm !== "object") return null;

  const direct = [
    lm.video_url,
    lm.videoUrl,
    lm.VideoURL,
    lm.video,
    lm.Video,
  ];
  for (const c of direct) {
    const u = coerceUrl(c);
    if (u) return resolveLandmarkAssetUrl(u);
  }

  const arrays = [
    lm.videos,
    lm.Videos,
    lm.video_urls,
    lm.videoUrls,
  ];
  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      const u = coerceUrl(arr[0]);
      if (u) return resolveLandmarkAssetUrl(u);
    }
  }

  return null;
}

export function getLandmarkPosterUrl(
  lm: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!lm || typeof lm !== "object") return undefined;
  const thumb = coerceUrl(
    lm.thumbnailURL ?? lm.thumbnail_url ?? lm.ThumbnailURL,
  );
  if (thumb) return resolveLandmarkAssetUrl(thumb);
  const first = getLandmarkPrimaryImageUrl(lm);
  return first ?? undefined;
}

/** Returns a shallow copy with `images` normalized to string[] when possible (non-destructive). */
export function withNormalizedLandmarkMedia<T extends Record<string, unknown>>(lm: T): T & {
  images: string[];
} {
  const urls = extractLandmarkImageUrls(lm);
  const video = extractLandmarkVideoUrl(lm);
  const next = { ...(lm as object) } as T & { images: string[] };
  if (urls.length > 0) (next as any).images = urls;
  if (video && !((next as any).video_url ?? (next as any).videoUrl)) {
    (next as any).video_url = video;
  }
  return next;
}
