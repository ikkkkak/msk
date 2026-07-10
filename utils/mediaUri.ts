import { endpoints } from "../constants";

function mediaOrigin(): string {
  const base = (endpoints.baseURL || "").replace(/\/+$/, "");
  if (/\/api$/i.test(base)) return base.replace(/\/api$/i, "") || base;
  return base;
}

/** Picker/cache URIs that must be read with expo-file-system. */
export function isLocalMediaUri(uri: string): boolean {
  const u = String(uri || "").trim();
  return /^(file:\/\/|content:\/\/|data:)/i.test(u);
}

/** Already stored on server/CDN — must not call readAsStringAsync. */
export function isUploadedMediaUri(uri: string): boolean {
  const u = String(uri || "").trim();
  if (!u || isLocalMediaUri(u)) return false;
  return /^https?:\/\//i.test(u) || u.startsWith("//") || u.startsWith("/");
}

/** Valid for submit/display (local picker URI or uploaded URL/path). */
export function isValidMediaUri(uri: unknown): boolean {
  return typeof uri === "string" && uri.trim().length > 0 &&
    (isLocalMediaUri(uri) || isUploadedMediaUri(uri));
}

/**
 * Normalize upload API paths for payloads and Image sources.
 * Fixes legacy `/habitat-bucket/...` paths from misconfigured GCS_PUBLIC_BASE_URL.
 */
/** All images already on CDN — publish can skip upload entirely. */
export function getReadyImageUrlsForSubmit(images: string[]): string[] | null {
  if (!images.length) return [];
  const out: string[] = [];
  for (const img of images) {
    if (!isUploadedMediaUri(img)) return null;
    const url = resolveUploadedMediaUrl(img);
    if (!isHttpMediaUrl(url)) return null;
    out.push(url);
  }
  return out;
}

export function getReadyVideoUrlsForSubmit(
  video: { uri: string; mimeType?: string } | null,
): string[] | null {
  if (!video?.uri) return [];
  if (!isUploadedMediaUri(video.uri)) return null;
  const url = resolveUploadedMediaUrl(video.uri);
  if (!isHttpMediaUrl(url)) return null;
  return [url];
}

export function isHttpMediaUrl(uri: string): boolean {
  return /^https?:\/\//i.test(String(uri || "").trim());
}

/** Normalize AI/upload paths to https for form state and publish (no re-upload). */
export function normalizeMediaUrlList(urls: string[]): string[] {
  return urls
    .map((u) => resolveUploadedMediaUrl(u))
    .filter((u) => isHttpMediaUrl(u));
}

export function resolveUploadedMediaUrl(raw: string): string {
  const u = String(raw || "").trim();
  if (!u) return "";
  if (isLocalMediaUri(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/habitat-bucket/")) {
    return `https://storage.googleapis.com${u}`;
  }
  if (u.startsWith("habitat-bucket/")) {
    return `https://storage.googleapis.com/${u}`;
  }
  const origin = mediaOrigin();
  if (origin && u.startsWith("/")) return `${origin}${u}`;
  if (origin) return `${origin}/${u.replace(/^\/+/, "")}`;
  return u;
}

/** First playable https video on a property sale (listing upload or legacy fields). */
export function resolvePropertySaleVideoUrl(
  data: Record<string, unknown> | null | undefined,
): string | null {
  const playback = resolvePropertySaleVideoPlayback(data);
  return playback?.streamUrl ?? null;
}

/** HLS-first playback metadata for property sale videos (detail, cards, feed). */
export function resolvePropertySaleVideoPlayback(
  data: Record<string, unknown> | null | undefined,
  connectionQuality: "good" | "moderate" | "poor" = "good",
): {
  streamUrl: string;
  posterUrl?: string;
  hlsURL?: string;
  mobileVideoURL?: string;
} | null {
  if (!data) return null;

  const saleVideos = data.saleVideos ?? data.SaleVideos;
  if (Array.isArray(saleVideos) && saleVideos.length > 0) {
    const first = saleVideos[0] as Record<string, unknown>;
    const stream = pickSaleVideoStreamUrl(first, connectionQuality);
    if (stream) {
      const poster =
        pickHttp(first.thumbnailURL) ??
        pickHttp(first.thumbnail_url) ??
        pickHttp(first.preview_blur_url) ??
        pickHttp(first.previewBlurURL);
      return {
        streamUrl: stream,
        posterUrl: poster,
        hlsURL: pickHttp(first.hlsURL) ?? pickHttp(first.hls_url),
        mobileVideoURL:
          pickHttp(first.mobileVideoURL) ?? pickHttp(first.mobile_video_url),
      };
    }
  }

  const mp4Candidates = [
    ...(Array.isArray(data.videos) ? (data.videos as unknown[]) : []),
    data.video_url,
    data.videoUrl,
    data.video,
  ];
  for (const c of mp4Candidates) {
    if (typeof c !== "string" || !c.trim()) continue;
    const url = resolveUploadedMediaUrl(c);
    if (isHttpMediaUrl(url)) {
      return { streamUrl: url };
    }
  }
  return null;
}

function pickHttp(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t.startsWith("http://") && !t.startsWith("https://")) return undefined;
  return t;
}

function pickSaleVideoStreamUrl(
  row: Record<string, unknown>,
  connectionQuality: "good" | "moderate" | "poor",
): string | null {
  const hls = pickHttp(row.hlsURL) ?? pickHttp(row.hls_url);
  const mobile =
    pickHttp(row.mobileVideoURL) ??
    pickHttp(row.mobile_video_url) ??
    pickHttp(row.preview_video_url);
  const mp4 = pickHttp(row.videoURL) ?? pickHttp(row.video_url);

  if (
    (connectionQuality === "moderate" || connectionQuality === "poor") &&
    mobile
  ) {
    return mobile;
  }
  if (hls) return hls;
  if (mp4?.includes(".m3u8")) return mp4;
  return mp4 ?? null;
}

export function resolvePropertySaleVideoUrls(
  data: Record<string, unknown> | null | undefined,
): string[] {
  if (!data) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (raw: unknown) => {
    if (typeof raw !== "string" || !raw.trim()) return;
    const url = resolveUploadedMediaUrl(raw);
    if (!isHttpMediaUrl(url) || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };
  if (Array.isArray(data.videos)) {
    for (const v of data.videos as unknown[]) push(v);
  }
  push(data.video_url);
  push(data.videoUrl);
  push(data.video);
  return out;
}
