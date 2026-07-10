/**
 * Helpers for rent-listing videos (video feed) linked to properties.
 */

export function getRentVideoPropertyId(video: unknown): number | null {
  if (!video || typeof video !== "object") return null;
  const v = video as Record<string, unknown>;
  const p =
    (v.property as Record<string, unknown> | undefined) ||
    (v.Property as Record<string, unknown> | undefined);
  const raw =
    v.propertyID ??
    v.property_id ??
    v.propertyId ??
    v.PropertyID ??
    p?.ID ??
    p?.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getRentVideoPlaybackUrl(video: unknown): string {
  if (!video || typeof video !== "object") return "";
  const v = video as Record<string, unknown>;
  const u =
    v.videoURL ??
    v.videoUrl ??
    v.VideoURL ??
    v.VideoUrl ??
    v.url ??
    v.URL ??
    v.video_url;
  return typeof u === "string" && u.trim() ? u.trim() : "";
}

export function getRentVideoThumbnail(video: unknown): string {
  if (!video || typeof video !== "object") return "";
  const v = video as Record<string, unknown>;
  const u =
    v.thumbnailURL ??
    v.thumbnail ??
    v.Thumbnail ??
    v.previewImage ??
    v.preview_image;
  return typeof u === "string" && u.trim() ? u.trim() : "";
}

export function getRentVideoPropertyTitle(video: unknown): string {
  if (!video || typeof video !== "object") return "";
  const v = video as Record<string, unknown>;
  const p =
    (v.property as Record<string, unknown> | undefined) ||
    (v.Property as Record<string, unknown> | undefined);
  const title =
    (typeof p?.title === "string" && p.title) ||
    (typeof p?.Title === "string" && p.Title);
  if (title) return title;
  const cap = typeof v.caption === "string" ? v.caption : "";
  if (cap) return cap;
  const t = typeof v.title === "string" ? v.title : "";
  return t || (typeof v.Title === "string" ? v.Title : "") || "";
}

export function getRentVideoPropertyNightlyPrice(video: unknown): number {
  if (!video || typeof video !== "object") return 0;
  const v = video as Record<string, unknown>;
  const p =
    (v.property as Record<string, unknown> | undefined) ||
    (v.Property as Record<string, unknown> | undefined);
  const raw =
    p?.nightlyPrice ??
    p?.NightlyPrice ??
    p?.price ??
    p?.Price ??
    p?.nightly_price;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Videos that are clearly tied to an active rent listing (id + playable or thumbnail). */
export function isLinkedRentListingVideo(video: unknown): boolean {
  const id = getRentVideoPropertyId(video);
  if (!id) return false;
  return Boolean(getRentVideoPlaybackUrl(video) || getRentVideoThumbnail(video));
}

/**
 * Server-attached rent tour on location-discovery properties (`listingVideo` from GET …/criteria/:id/properties).
 */
export function getServerListingVideo(property: unknown): Record<string, unknown> | null {
  if (!property || typeof property !== "object") return null;
  const p = property as Record<string, unknown>;
  const lv = p.listingVideo ?? p.listing_video;
  if (!lv || typeof lv !== "object") return null;
  const url = getRentVideoPlaybackUrl(lv);
  if (!url) return null;
  return lv as Record<string, unknown>;
}

/** True when backend attached an approved property-linked tour (`listingVideo` with playable URL). */
export function propertyHasApprovedListingVideo(property: unknown): boolean {
  return getServerListingVideo(property) != null;
}
