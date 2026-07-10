/**
 * Prefetch HLS segments for upcoming feed items (bandwidth-safe).
 * Resolves master → variant playlist, warms segment 1 (+ optional segment 2).
 * Cancels in-flight fetches on fast scroll.
 */

import type { ConnectionQuality } from "../hooks/useConnectivity";
import { FEED_STREAMING_ONLY } from "../config/videoPlayback";

const activeControllers = new Map<string, AbortController>();

function cacheKey(videoId: string | number, playlistUrl: string): string {
  return `${videoId}:${playlistUrl.split("?")[0]}`;
}

function resolveUrl(base: string, line: string): string {
  const t = line.trim();
  if (!t || t.startsWith("#")) return "";
  if (t.startsWith("http")) return t;
  const root = base.substring(0, base.lastIndexOf("/") + 1);
  return root + t;
}

async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal, cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Master playlist → lowest variant media playlist, or media playlist as-is. */
async function resolveMediaPlaylistUrl(
  playlistUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const text = await fetchText(playlistUrl, signal);
  const lines = text.split("\n");
  const isMaster = lines.some((l) => l.includes("#EXT-X-STREAM-INF"));
  if (!isMaster) return playlistUrl;

  let lastVariant = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("#EXT-X-STREAM-INF")) continue;
    const u = resolveUrl(playlistUrl, t);
    if (u && u.includes(".m3u8")) lastVariant = u;
  }
  if (!lastVariant) return playlistUrl;
  return lastVariant;
}

/** Ordered segment URLs from a media playlist (not master). */
async function listSegmentUrls(
  mediaPlaylistUrl: string,
  signal: AbortSignal,
  maxSegments: number,
): Promise<string[]> {
  const text = await fetchText(mediaPlaylistUrl, signal);
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const u = resolveUrl(mediaPlaylistUrl, line);
    if (!u) continue;
    if (u.includes(".ts") || u.includes(".m4s")) {
      out.push(u);
      if (out.length >= maxSegments) break;
    }
  }
  return out;
}

async function warmSegments(
  videoId: string | number,
  playlistUrl: string,
  segmentCount: number,
  signal: AbortSignal,
): Promise<void> {
  const mediaUrl = await resolveMediaPlaylistUrl(playlistUrl, signal);
  if (signal.aborted) return;
  const segments = await listSegmentUrls(mediaUrl, signal, segmentCount);
  for (const seg of segments) {
    if (signal.aborted) return;
    await fetch(seg, { signal, cache: "force-cache" });
  }
}

/** Warm first ~1.5MB of progressive MP4 (moov + first GOP when fast-start). */
export function prefetchProgressiveLeadIn(
  videoId: string | number,
  mp4Url: string,
): void {
  const url = mp4Url.trim();
  if (!url || url.includes(".m3u8")) return;
  const key = cacheKey(videoId, url);
  if (activeControllers.has(key)) return;
  const ac = new AbortController();
  activeControllers.set(key, ac);
  void fetch(url, {
    signal: ac.signal,
    headers: { Range: "bytes=0-1572863" },
    cache: "force-cache",
  })
    .catch(() => {})
    .finally(() => {
      if (activeControllers.get(key) === ac) {
        activeControllers.delete(key);
      }
    });
}

/** Prefetch first playable bytes for whatever URL the feed will use. */
export function warmFeedPlayback(
  videoId: string | number,
  playbackUri: string,
  connectionQuality: ConnectionQuality = "good",
  mp4Alt?: string,
): void {
  const uri = playbackUri.trim();
  if (!uri) return;
  if (!FEED_STREAMING_ONLY) {
    if (uri.includes(".m3u8")) {
      prefetchFirstSegment(videoId, uri, connectionQuality);
    } else if (
      connectionQuality === "good" ||
      connectionQuality === "moderate"
    ) {
      prefetchProgressiveLeadIn(videoId, uri);
    }
    const alt = mp4Alt?.trim();
    if (
      alt &&
      alt !== uri &&
      !alt.includes(".m3u8") &&
      connectionQuality === "good"
    ) {
      prefetchProgressiveLeadIn(`${videoId}:mp4`, alt);
    }
    return;
  }
  if (uri.includes(".m3u8")) {
    prefetchFirstSegment(videoId, uri, connectionQuality);
  } else {
    prefetchProgressiveLeadIn(videoId, uri);
  }
  const alt = mp4Alt?.trim();
  if (alt && alt !== uri && !alt.includes(".m3u8")) {
    prefetchProgressiveLeadIn(`${videoId}:mp4`, alt);
  }
}

/** Warm first HLS segment(s); no-op if already warming. */
export function prefetchFirstSegment(
  videoId: string | number,
  playlistUrl: string,
  connectionQuality: ConnectionQuality = "good",
): void {
  if (!playlistUrl.includes(".m3u8")) return;
  const key = cacheKey(videoId, playlistUrl);
  if (activeControllers.has(key)) return;
  const ac = new AbortController();
  activeControllers.set(key, ac);
  const segmentCount = connectionQuality === "good" ? 3 : 1;
  void warmSegments(videoId, playlistUrl, segmentCount, ac.signal).catch(() => {
    /* aborted or network */
  }).finally(() => {
    if (activeControllers.get(key) === ac) {
      activeControllers.delete(key);
    }
  });
}

export function cancelSegmentPrefetch(keyOrVideoId: string | number): void {
  const prefix = String(keyOrVideoId);
  for (const [k, ac] of activeControllers.entries()) {
    if (k.startsWith(prefix) || prefix === "") {
      ac.abort();
      activeControllers.delete(k);
    }
  }
}

/** Cancel prefetches except those for the given video id prefixes. */
export function cancelExceptVideoIds(keepVideoIds: Array<string | number>): void {
  const prefixes = keepVideoIds.map((id) => `${String(id)}:`);
  if (prefixes.length === 0) return;
  for (const [k, ac] of activeControllers.entries()) {
    if (!prefixes.some((p) => k.startsWith(p))) {
      ac.abort();
      activeControllers.delete(k);
    }
  }
}
