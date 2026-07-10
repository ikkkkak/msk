import type { FeedVideo } from "../hooks/Videofeedtypes";
import { resolveFeedPlaybackUri } from "../config/videoPlayback";
import { getRentVideoPlaybackUrl, getRentVideoThumbnail } from "./rentalVideo";

export type FeedVideoTab = "rent" | "sale" | "landmarks";

function pickId(raw: Record<string, unknown>): number | string | null {
  for (const key of ["ID", "id", "videoID", "video_id", "VideoID"]) {
    const c = raw[key];
    if (c === undefined || c === null || c === "") continue;
    if (typeof c === "number" && Number.isFinite(c)) return c;
    if (typeof c === "string" && c.trim() && c !== "undefined") return c.trim();
  }
  return null;
}

function listingIdFromRaw(raw: Record<string, unknown>): number {
  const id = pickId(raw);
  if (id == null) return 0;
  const head = String(id).split("_")[0] ?? String(id);
  const n = parseInt(head, 10);
  return Number.isFinite(n) ? n : 0;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function resolvePropertySaleFeedVideoUrl(
  r: Record<string, unknown>,
): string | undefined {
  const direct = pickString(r.videoURL, r.VideoURL, r.video_url);
  if (direct?.startsWith("http")) return direct;

  const idStr = String(r.ID ?? r.id ?? "");
  const match = idStr.match(/^(\d+)_(\d+)$/);
  const ps = r.propertySale as Record<string, unknown> | undefined;
  if (!ps || !match) return direct;

  const idx = parseInt(match[2]!, 10);
  const fromVideos = ps.videos;
  if (Array.isArray(fromVideos) && typeof fromVideos[idx] === "string") {
    const u = fromVideos[idx] as string;
    if (u.startsWith("http")) return u.trim();
  }

  const saleVideos = ps.saleVideos;
  if (Array.isArray(saleVideos)) {
    const row = saleVideos[idx] as Record<string, unknown> | undefined;
    const u = pickString(row?.videoURL, row?.VideoURL, row?.video_url);
    if (u?.startsWith("http")) return u;
  }

  return direct;
}

function resolveLandmarkFeedVideoUrl(
  r: Record<string, unknown>,
): string | undefined {
  const direct = pickString(r.videoURL, r.VideoURL, r.video_url, r.url);
  if (direct?.startsWith("http")) return direct;

  const lm = (r.landmark ?? r.Landmark) as Record<string, unknown> | undefined;
  const nested = pickString(lm?.video_url, lm?.videoURL, lm?.VideoURL);
  if (nested?.startsWith("http")) return nested;
  return direct;
}

/** Normalize API / cache payloads into a consistent FeedVideo shape. Returns null when unusable. */
export function normalizeFeedVideoItem(
  raw: unknown,
  tab: FeedVideoTab,
): FeedVideo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = pickId(r);
  if (id == null) return null;

  const videoURL =
    resolvePropertySaleFeedVideoUrl(r) ||
    (tab === "landmarks" ? resolveLandmarkFeedVideoUrl(r) : undefined) ||
    pickString(r.videoURL, r.VideoURL, r.video_url, r.url) ||
    getRentVideoPlaybackUrl(r) ||
    "";

  const thumbnailURL =
    pickString(
      r.thumbnailURL,
      r.thumbnail_url,
      r.preview_thumbnail_url,
      r.previewBlurURL,
      r.preview_blur_url,
    ) || getRentVideoThumbnail(r);

  const hostRaw =
    (r.User as Record<string, unknown> | undefined) ??
    (r.user as Record<string, unknown> | undefined);
  const psRaw = (r.propertySale ?? r.PropertySale) as
    | Record<string, unknown>
    | undefined;
  const topOrg =
    (r.organization as FeedVideo["organization"]) ??
    (psRaw?.organization as FeedVideo["organization"]);

  const item: FeedVideo = {
    ...(r as FeedVideo),
    ID: id,
    userID:
      Number(
        r.userID ??
          r.userId ??
          r.UserID ??
          hostRaw?.ID ??
          hostRaw?.id ??
          psRaw?.owner_id ??
          0,
      ) || undefined,
    user: hostRaw as FeedVideo["user"],
    organization: topOrg,
    videoURL: videoURL || undefined,
    VideoURL: videoURL || undefined,
    thumbnailURL,
    hlsURL: pickString(r.hlsURL, r.videoHlsURL, r.video_hls_url),
    mobile_video_url: pickString(r.mobile_video_url, r.mobileVideoURL),
    preview_blur_url: pickString(r.preview_blur_url, r.previewBlurURL),
    likesCount: Number(r.likesCount ?? r.LikesCount ?? 0),
    savesCount: Number(r.savesCount ?? r.SavesCount ?? 0),
    commentsCount: Number(r.commentsCount ?? r.CommentsCount ?? 0),
    liked: Boolean(r.liked ?? r.isLiked ?? r.IsLiked),
    saved: Boolean(r.saved ?? r.isSaved ?? r.IsSaved),
    isAutoSlideshow: Boolean(
      r.isAutoSlideshow ?? r.is_auto_slideshow ?? tab === "landmarks",
    ),
  };

  const src = pickString(r.source, r.Source)?.toLowerCase();
  if (
    (src === "property_sale" || src === "property_sale_fallback") &&
    !item.propertySale
  ) {
    const saleId = listingIdFromRaw(r);
    if (saleId > 0) {
      item.propertySale = {
        id: saleId,
        title: pickString(r.title, r.Title),
        images: Array.isArray(r.images) ? (r.images as string[]) : undefined,
      };
    }
  }

  const propRaw = (r.property ?? r.Property) as Record<string, unknown> | undefined;
  if (propRaw && typeof propRaw === "object") {
    const propId = Number(propRaw.ID ?? propRaw.id ?? 0);
    if (propId > 0) {
      item.property = {
        ID: propId,
        title: pickString(propRaw.title, propRaw.Title),
        city: pickString(propRaw.city, propRaw.City),
        bedrooms: Number(propRaw.bedrooms ?? propRaw.Bedrooms ?? 0) || undefined,
        bathrooms: Number(propRaw.bathrooms ?? propRaw.Bathrooms ?? 0) || undefined,
        price:
          Number(propRaw.price ?? propRaw.Price ?? propRaw.nightly_price ?? 0) ||
          undefined,
        currency: pickString(propRaw.currency, propRaw.Currency),
        images: Array.isArray(propRaw.images)
          ? (propRaw.images as string[])
          : undefined,
      };
    }
  }

  if (psRaw && typeof psRaw === "object") {
    const prev = item.propertySale ?? {};
    item.propertySale = {
      ...prev,
      id: Number(psRaw.id ?? psRaw.ID ?? prev.id ?? 0),
      title: pickString(psRaw.title, psRaw.Title) ?? prev.title,
      city: pickString(psRaw.city, psRaw.City) ?? prev.city,
      bedrooms: Number(psRaw.bedrooms ?? psRaw.Bedrooms ?? prev.bedrooms ?? 0) || prev.bedrooms,
      bathrooms: Number(psRaw.bathrooms ?? psRaw.Bathrooms ?? prev.bathrooms ?? 0) || prev.bathrooms,
      listing_price:
        Number(psRaw.listing_price ?? psRaw.listingPrice ?? prev.listing_price ?? 0) ||
        prev.listing_price,
      images: Array.isArray(psRaw.images)
        ? (psRaw.images as string[])
        : prev.images,
      organization:
        (psRaw.organization as typeof prev.organization) ?? prev.organization,
      owner: (psRaw.owner as typeof prev.owner) ?? prev.owner,
      owner_id:
        Number(psRaw.owner_id ?? psRaw.ownerId ?? prev.owner_id ?? 0) || prev.owner_id,
    };
  }

  const lmRaw = (r.landmark ?? r.Landmark) as Record<string, unknown> | undefined;
  if (lmRaw && typeof lmRaw === "object") {
    const prev = item.landmark ?? {};
    const lmId = Number(lmRaw.id ?? lmRaw.ID ?? prev.id ?? r.landmarkID ?? r.landmarkId ?? 0);
    item.landmark = {
      ...prev,
      id: lmId || prev.id,
      title: pickString(lmRaw.title, lmRaw.Title) ?? prev.title,
      name: pickString(lmRaw.name, lmRaw.Name) ?? prev.name,
      district: pickString(lmRaw.district, lmRaw.District) ?? prev.district,
      region: pickString(lmRaw.region, lmRaw.Region) ?? prev.region,
      plot_number:
        pickString(lmRaw.plot_number, lmRaw.PlotNumber) ?? prev.plot_number,
      area: Number(lmRaw.area ?? lmRaw.Area ?? prev.area ?? 0) || prev.area,
      area_unit:
        pickString(lmRaw.area_unit, lmRaw.AreaUnit) ?? prev.area_unit,
      price: Number(lmRaw.price ?? lmRaw.Price ?? prev.price ?? 0) || prev.price,
      currency: pickString(lmRaw.currency, lmRaw.Currency) ?? prev.currency,
      images: Array.isArray(lmRaw.images)
        ? (lmRaw.images as string[])
        : prev.images,
      owner: (lmRaw.owner ?? lmRaw.Owner ?? prev.owner) as typeof prev.owner,
      organization: (lmRaw.organization ??
        lmRaw.Organization ??
        prev.organization) as typeof prev.organization,
    };
    if (lmId > 0) {
      item.landmarkID = lmId;
    }
  } else if (r.landmarkID != null || r.landmarkId != null) {
    item.landmarkID = Number(r.landmarkID ?? r.landmarkId) || undefined;
  }

  const stream = resolveFeedPlaybackUri(
    { ...r, videoURL: videoURL || r.videoURL, VideoURL: videoURL || r.VideoURL },
    "good",
  );
  if (!stream && !videoURL) {
    const lm = (r.landmark ?? r.Landmark) as Record<string, unknown> | undefined;
    const nestedVideo = pickString(lm?.video_url, lm?.videoURL, lm?.VideoURL);
    if (nestedVideo?.startsWith("http")) {
      item.videoURL = nestedVideo;
      item.VideoURL = nestedVideo;
    } else {
    const ps = r.propertySale as Record<string, unknown> | undefined;
    const vids = ps?.videos;
    if (!Array.isArray(vids) || vids.length === 0) return null;
    const first = vids.find((u) => typeof u === "string" && u.startsWith("http"));
    if (!first) return null;
    item.videoURL = String(first);
    item.VideoURL = String(first);
    }
  }

  // Rent feed must never surface property-for-sale fallback clips (sale tab loads those).
  if (tab === "rent") {
    const srcLower = src ?? pickString(r.source, r.Source)?.toLowerCase();
    if (srcLower === "property_sale" || srcLower === "property_sale_fallback") {
      return null;
    }
    if (item.propertySale?.id && !item.property?.ID) {
      return null;
    }
  }

  return item;
}

export function normalizeFeedVideoPage(
  videos: unknown[],
  tab: FeedVideoTab,
): FeedVideo[] {
  const out: FeedVideo[] = [];
  const seen = new Set<string>();
  for (const v of videos) {
    const n = normalizeFeedVideoItem(v, tab);
    if (!n) continue;
    const key = String(n.ID);
    if (!key || key === "undefined" || seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

export function isValidFeedVideoId(id: unknown): boolean {
  if (id === undefined || id === null || id === "") return false;
  const s = String(id);
  return s.length > 0 && s !== "undefined" && s !== "null";
}
