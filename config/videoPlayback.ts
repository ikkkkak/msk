/**
 * Feed video playback policy — streaming-first, minimal device storage.
 *
 * CDN / backend should serve:
 *   • HLS (.m3u8) for adaptive bitrate when `hlsURL` (or aliases) is set
 *   • Optional `mobile_video_url` / `preview_video_url` for a low-bitrate MP4 fallback
 *   • `preview_blur_url` — tiny blurred first frame (required for TikTok-like UX)
 *   • Else progressive MP4 over HTTPS (short GOP, ~720p mobile tier recommended)
 */

import type { ConnectionQuality } from "../hooks/useConnectivity";
import type { FeedVideo } from "../hooks/Videofeedtypes";
import {
  getStreamingProfile,
  pickPlaybackUrl,
} from "../utils/deviceStreamingProfile";
import { normalizePlaybackUrl } from "../utils/playbackUrl";

export { isPlayableLocalVideoPath, normalizePlaybackUrl } from "../utils/playbackUrl";

function pickHttpUrl(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  if (!t || (!t.startsWith("http://") && !t.startsWith("https://")))
    return undefined;
  return normalizePlaybackUrl(t);
}

/**
 * When true, feed videos stream from CDN only (HTTP range prefetch does not reach expo-av).
 * When false, mobile/preview MP4s are downloaded to disk for instant first frame.
 */
export const FEED_STREAMING_ONLY = false;

/** On good Wi‑Fi/LTE: stream CDN immediately; disk cache runs in background. */
export function feedPreferLocalFirst(
  _connectionQuality: ConnectionQuality = "good",
): boolean {
  // Waiting for disk before CDN caused 900ms+ black frames on 3G — stream immediately.
  return false;
}

/** Best URL to cache locally — prefer small mobile/preview tiers for fast TTFF. */
export function resolveFeedCacheTargetUri(
  item: Record<string, unknown>,
): string {
  const preview =
    pickHttpUrl(item.preview_video_url) ?? pickHttpUrl(item.previewVideoURL);
  const mobile =
    pickHttpUrl(item.mobile_video_url) ?? pickHttpUrl(item.mobileVideoURL);
  if (preview && !preview.includes(".m3u8")) return preview;
  if (mobile) return mobile;
  const mp4 = pickMp4Uri(item);
  if (mp4 && !mp4.includes(".m3u8")) return mp4;
  return "";
}

function isStreamProcessingReady(item: Record<string, unknown>): boolean {
  const s = String(
    item.processingStatus ?? item.processing_status ?? "ready",
  ).toLowerCase();
  return !s || s === "ready";
}

function pickMp4Uri(item: Record<string, unknown>): string {
  const idStr = String(item.ID ?? item.id ?? "");
  const ps = item.propertySale as Record<string, unknown> | undefined;
  const match = idStr.match(/^(\d+)_(\d+)$/);
  if (ps && match) {
    const idx = parseInt(match[2]!, 10);
    const vids = ps.videos;
    if (Array.isArray(vids) && typeof vids[idx] === "string") {
      const u = pickHttpUrl(vids[idx]);
      if (u) return u;
    }
  }

  const mp4 =
    pickHttpUrl(item.videoURL) ??
    pickHttpUrl(item.VideoURL) ??
    pickHttpUrl(item.video_url) ??
    pickHttpUrl(item.mobile_video_url) ??
    pickHttpUrl(item.mobileVideoURL) ??
    pickHttpUrl(item.preview_video_url) ??
    pickHttpUrl(item.previewVideoURL) ??
    "";
  return mp4;
}

/** Progressive MP4 only — used when HLS fails or is still processing. */
export function resolveProgressiveMp4Uri(
  item: Record<string, unknown>,
  connectionQuality: ConnectionQuality = "good",
): string {
  const useMobileTier =
    connectionQuality === "moderate" || connectionQuality === "poor";
  const mobile =
    pickHttpUrl(item.mobile_video_url) ?? pickHttpUrl(item.mobileVideoURL);
  if (useMobileTier && mobile) return mobile;
  return pickMp4Uri(item);
}

/**
 * Pick the URL passed to expo-av. Prefers explicit HLS when present so the player
 * can adapt on iOS (AVPlayer) and Android (ExoPlayer via expo-av).
 * On moderate/poor networks, uses a mobile/preview MP4 when the API provides one.
 */
export function resolveStreamUri(
  item: {
    videoURL?: string;
    VideoURL?: string;
    hlsURL?: string;
    videoHlsURL?: string;
    video_hls_url?: string;
    mobile_video_url?: string;
    mobileVideoURL?: string;
    preview_video_url?: string;
    previewVideoURL?: string;
    /** When false, use progressive MP4 even if HLS exists (debug / workaround). */
    preferHls?: boolean;
    [key: string]: unknown;
  },
  connectionQuality: ConnectionQuality = "good",
): string {
  const profile = getStreamingProfile(connectionQuality);
  const normalized = {
    hlsURL:
      (typeof item.hlsURL === "string" && item.hlsURL) ||
      (typeof item.videoHlsURL === "string" && item.videoHlsURL) ||
      (typeof item.video_hls_url === "string" && item.video_hls_url) ||
      (typeof item.HlsURL === "string" && item.HlsURL) ||
      "",
    videoURL:
      (typeof item.videoURL === "string" && item.videoURL) ||
      (typeof item.VideoURL === "string" && item.VideoURL) ||
      (typeof item.video_url === "string" && item.video_url) ||
      "",
    mobile_video_url:
      (typeof item.mobile_video_url === "string" && item.mobile_video_url) ||
      (typeof item.mobileVideoURL === "string" && item.mobileVideoURL) ||
      (typeof item.preview_video_url === "string" && item.preview_video_url) ||
      (typeof item.previewVideoURL === "string" && item.previewVideoURL) ||
      "",
  };
  const picked = pickPlaybackUrl(
    { ...normalized, ...item },
    profile,
  );
  if (picked.uri) {
    return picked.uri;
  }

  const mp4 =
    (typeof item.videoURL === "string" && item.videoURL) ||
    (typeof item.VideoURL === "string" && item.VideoURL) ||
    (typeof item.video_url === "string" && item.video_url) ||
    "";

  const hls =
    (typeof item.hlsURL === "string" && item.hlsURL) ||
    (typeof item.videoHlsURL === "string" && item.videoHlsURL) ||
    (typeof item.video_hls_url === "string" && item.video_hls_url) ||
    (typeof item.HlsURL === "string" && item.HlsURL) ||
    "";

  const mobileMp4 =
    (typeof item.mobile_video_url === "string" && item.mobile_video_url) ||
    (typeof item.mobileVideoURL === "string" && item.mobileVideoURL) ||
    (typeof item.preview_video_url === "string" && item.preview_video_url) ||
    (typeof item.previewVideoURL === "string" && item.previewVideoURL) ||
    "";

  const preferHls = item.preferHls !== false;
  const hlsTrim = hls.trim();
  const mp4Trim = mp4.trim();
  const mobileTrim = mobileMp4.trim();

  const useMobileTier =
    connectionQuality === "moderate" || connectionQuality === "poor";

  if (useMobileTier && mobileTrim) {
    return mobileTrim;
  }

  if (
    preferHls &&
    hlsTrim &&
    isStreamProcessingReady(item as Record<string, unknown>)
  ) {
    return hlsTrim;
  }
  if (
    mp4Trim &&
    (mp4Trim.includes(".m3u8") ||
      mp4Trim.includes("/manifest") ||
      mp4Trim.endsWith("m3u8"))
  ) {
    return mp4Trim;
  }
  return mp4Trim;
}

/**
 * Feed playback — adaptive streaming pipeline (TikTok / Shorts pattern).
 * Poor/moderate: small MP4 tiers for fast start.
 * Good/excellent: HLS when available (segmented, adaptive bitrate).
 */
export function resolveFeedPlaybackUri(
  item: Record<string, unknown>,
  connectionQuality: ConnectionQuality = "good",
): string {
  const mobile =
    pickHttpUrl(item.mobile_video_url) ?? pickHttpUrl(item.mobileVideoURL);
  const preview =
    pickHttpUrl(item.preview_video_url) ?? pickHttpUrl(item.previewVideoURL);
  const mp4 = pickMp4Uri(item);
  const hls =
    pickHttpUrl(item.hlsURL) ??
    pickHttpUrl(item.videoHlsURL) ??
    pickHttpUrl(item.video_hls_url) ??
    pickHttpUrl(item.HlsURL) ??
    "";
  const ready = isStreamProcessingReady(item);

  if (connectionQuality === "poor" || connectionQuality === "moderate") {
    if (preview && !preview.includes(".m3u8")) return preview;
    if (mobile) return mobile;
    if (mp4 && !mp4.includes(".m3u8")) return mp4;
    if (hls && ready) return hls;
    return mp4 || hls;
  }

  if (hls && ready) return hls;
  if (mobile) return mobile;
  if (mp4 && !mp4.includes(".m3u8")) return mp4;
  return hls || mp4;
}

/** Listing gallery URLs — must never be used as the full-screen video placeholder. */
export function feedListingImageUrls(item: FeedVideo): Set<string> {
  const raw = [
    item.property?.images?.[0],
    item.propertySale?.images?.[0],
    item.landmark?.images?.[0],
    ...(Array.isArray(item.property?.images) ? item.property!.images! : []),
    ...(Array.isArray(item.propertySale?.images)
      ? item.propertySale!.images!
      : []),
    ...(Array.isArray(item.landmark?.images) ? item.landmark!.images! : []),
  ];
  const out = new Set<string>();
  for (const x of raw) {
    const u = pickHttpUrl(x);
    if (u) out.add(u.split("?")[0]!);
  }
  return out;
}

function isListingPhotoUrl(item: FeedVideo, url: string): boolean {
  const norm = url.split("?")[0]!;
  return feedListingImageUrls(item).has(norm);
}

export type FeedPlaceholderKind = "blur" | "video";

export type FeedVideoPlaceholder = {
  uri: string;
  kind: FeedPlaceholderKind;
};

/**
 * Placeholder while buffering — only server blur frame or a real video still.
 * Never property listing photos (API often duplicates them into thumbnailURL).
 */
export function resolveFeedVideoPlaceholder(
  item: FeedVideo,
): FeedVideoPlaceholder | undefined {
  const anyItem = item as Record<string, unknown>;

  const blur =
    pickHttpUrl(anyItem.preview_blur_url) ?? pickHttpUrl(anyItem.previewBlurURL);
  if (blur) return { uri: blur, kind: "blur" };

  const candidates = [
    pickHttpUrl(anyItem.preview_thumbnail_url),
    pickHttpUrl(item.thumbnailURL),
    pickHttpUrl(item.thumbnail_url),
    pickHttpUrl(anyItem.poster_url),
    pickHttpUrl(anyItem.posterURL),
  ];

  for (const url of candidates) {
    if (!url) continue;
    if (isListingPhotoUrl(item, url)) continue;
    return { uri: url, kind: "video" };
  }

  // Last resort: listing photo beats a black frame on slow networks.
  const listing =
    pickHttpUrl(item.propertySale?.images?.[0]) ??
    pickHttpUrl(item.property?.images?.[0]) ??
    pickHttpUrl(item.landmark?.images?.[0]);
  if (listing) return { uri: listing, kind: "video" };

  return undefined;
}

export function resolveFeedVideoPlaceholderUri(item: FeedVideo): string | undefined {
  return resolveFeedVideoPlaceholder(item)?.uri;
}

/** @deprecated use resolveFeedVideoPlaceholder().kind === "blur" */
export function isFeedDedicatedBlurPlaceholder(item: FeedVideo): boolean {
  return resolveFeedVideoPlaceholder(item)?.kind === "blur";
}

export function feedPlaceholderBlurRadius(
  kind: FeedPlaceholderKind,
  surfaceReady: boolean,
): number {
  if (surfaceReady) return 0;
  return kind === "blur" ? 8 : 32;
}

/** @deprecated Use resolveFeedVideoPlaceholderUri */
export function resolveFeedPosterUri(item: FeedVideo): string | undefined {
  return resolveFeedVideoPlaceholderUri(item);
}

/** Prefetch video placeholder URLs only (no listing gallery). */
export function feedPosterPrefetchUris(item: FeedVideo): string[] {
  const p = resolveFeedVideoPlaceholder(item);
  const anyItem = item as Record<string, unknown>;
  const raw: unknown[] = [
    anyItem.preview_blur_url,
    anyItem.previewBlurURL,
    anyItem.preview_thumbnail_url,
    item.thumbnailURL,
    item.thumbnail_url,
    anyItem.poster_url,
    anyItem.posterURL,
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  if (p?.uri) {
    seen.add(p.uri.split("?")[0]!);
    out.push(p.uri);
  }
  for (const x of raw) {
    const u = pickHttpUrl(x);
    if (!u) continue;
    const key = u.split("?")[0]!;
    if (seen.has(key)) continue;
    if (isListingPhotoUrl(item, u)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}
