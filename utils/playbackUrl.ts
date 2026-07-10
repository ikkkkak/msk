/**
 * Pure playback URL helpers — keep in a leaf module (no app imports) to avoid circular deps.
 */

/** Fix legacy/broken media URLs before they reach expo-av. */
export function normalizePlaybackUrl(url: string): string {
  let u = (url ?? "").trim();
  if (!u || u.startsWith("file://") || u.startsWith("data:")) return u;

  if (
    u.includes(".digitaloceanspaces.com") &&
    !u.includes(".cdn.digitaloceanspaces.com")
  ) {
    u = u.replace(
      /\.([a-z0-9]+)\.digitaloceanspaces\.com/i,
      ".$1.cdn.digitaloceanspaces.com",
    );
  }

  const qIdx = u.indexOf("?");
  const path = qIdx >= 0 ? u.slice(0, qIdx) : u;
  const query = qIdx >= 0 ? u.slice(qIdx) : "";

  if (path.includes("/hls/") && !path.includes(".m3u8")) {
    if (path.endsWith("/master") || path.endsWith("/master/")) {
      const fixed = path.replace(/\/$/, "") + ".m3u8";
      return fixed + query;
    }
  }

  if (
    (path.endsWith("/mobile") || path.endsWith("/mobile/")) &&
    !path.endsWith(".mp4")
  ) {
    const fixed = path.replace(/\/$/, "") + ".mp4";
    return fixed + query;
  }

  return u;
}

/** True when URL is the server-generated mobile/preview MP4 tier. */
export function isMobileMp4PlaybackUrl(url: string): boolean {
  const path = (url ?? "").split("?")[0] ?? "";
  return path.includes(".mp4") || /\/mobile(\.mp4)?$/i.test(path);
}

/** Local disk paths must have a video extension or iOS AVPlayer refuses to decode. */
export function isPlayableLocalVideoPath(path: string): boolean {
  if (!path.startsWith("file://")) return false;
  const base = path.split("?")[0] ?? path;
  return /\.(mp4|m3u8|mov)$/i.test(base);
}
