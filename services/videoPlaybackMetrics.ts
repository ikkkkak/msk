/**
 * Lightweight QoE metrics for short-form video (TTFF, rebuffer, scroll cancels).
 * Wire to analytics backend when ready.
 */

export type VideoQoESample = {
  videoId: string | number;
  tab?: string;
  ttffMs?: number;
  rebufferCount?: number;
  bitrateSwitchCount?: number;
  usedHls?: boolean;
  connectionQuality?: string;
  at: number;
};

const recent: VideoQoESample[] = [];
const MAX = 40;

export function recordVideoQoE(sample: VideoQoESample): void {
  recent.push({ ...sample, at: Date.now() });
  if (recent.length > MAX) recent.shift();
  if (__DEV__) {
    console.log("[VideoQoE]", sample);
  }
}

export function getRecentVideoQoE(): readonly VideoQoESample[] {
  return recent;
}

/** Call when user starts loading a visible clip */
export function markVideoLoadStart(videoId: string | number): () => void {
  const t0 = Date.now();
  return () => {
    recordVideoQoE({
      videoId,
      ttffMs: Date.now() - t0,
      at: Date.now(),
    });
  };
}

export function recordRebuffer(videoId: string | number): void {
  recordVideoQoE({ videoId, rebufferCount: 1, at: Date.now() });
}

export function recordPrefetchCancelled(videoId: string | number): void {
  if (__DEV__) {
    console.log("[VideoQoE] prefetch cancelled", videoId);
  }
}

/** Clips that already drew a first frame — survives list remounts / refetch. */
const revealedSurfaces = new Set<string>();

export function markFeedVideoSurfaceRevealed(videoId: string | number): void {
  const key = String(videoId);
  if (!key) return;
  revealedSurfaces.add(key);
}

export function isFeedVideoSurfaceRevealed(videoId: string | number): boolean {
  return revealedSurfaces.has(String(videoId));
}

export function clearFeedVideoSurfaceRevealed(): void {
  revealedSurfaces.clear();
}
