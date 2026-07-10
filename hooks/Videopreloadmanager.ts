// ─────────────────────────────────────────────
// videoPreloadManager.ts
// Manages video preloading with strict memory limits.
//
// RULES (from spec):
//   • Max 2 videos buffering simultaneously (never more)
//   • Keep max ±2 mounted around active index
//   • Never preload entire feed
// ─────────────────────────────────────────────

import { Image } from "react-native";

const PRELOAD_AHEAD = 2; // buffer i+1 and i+2
const PRELOAD_BEHIND = 2; // buffer i-1 and i-2 for instant scroll-back (TikTok window)
const MAX_CONCURRENT_BUFFER = 2;

class VideoPreloadManager {
  private prefetchedThumbs = new Set<string>();
  private bufferingRefs = new Set<any>(); // active video refs currently told to buffer
  private activeBufferCount = 0;

  // ── Thumbnails ────────────────────────────────
  prefetchThumbnail(url: string) {
    if (!url || this.prefetchedThumbs.has(url)) return;
    this.prefetchedThumbs.add(url);
    Image.prefetch(url).catch(() => {});
  }

  prefetchThumbnailRange(
    videos: Array<{ thumbnailURL?: string; thumbnail_url?: string }>,
    fromIndex: number,
    toIndex: number
  ) {
    for (
      let i = Math.max(0, fromIndex);
      i <= Math.min(videos.length - 1, toIndex);
      i++
    ) {
      const v = videos[i];
      const url = v?.thumbnailURL ?? v?.thumbnail_url ?? "";
      if (url) this.prefetchThumbnail(url);
    }
  }

  // ── Which indexes should be mounted ──────────
  getMountedRange(activeIndex: number, totalCount: number): [number, number] {
    return [
      Math.max(0, activeIndex - PRELOAD_BEHIND),
      Math.min(totalCount - 1, activeIndex + PRELOAD_AHEAD)
    ];
  }

  /**
   * Connectivity-aware window: e.g. 3G → ahead 1, poor → ahead 0 (active only).
   */
  getMountedRangeFlexible(
    activeIndex: number,
    totalCount: number,
    ahead: number,
    behind: number
  ): [number, number] {
    if (totalCount <= 0) return [0, 0];
    const hi = Math.min(totalCount - 1, activeIndex + Math.max(0, ahead));
    const lo = Math.max(0, activeIndex - Math.max(0, behind));
    return [lo, hi];
  }

  shouldMount(index: number, activeIndex: number, totalCount: number): boolean {
    const [lo, hi] = this.getMountedRange(activeIndex, totalCount);
    return index >= lo && index <= hi;
  }

  shouldMountFlexible(
    index: number,
    activeIndex: number,
    totalCount: number,
    ahead: number,
    behind: number
  ): boolean {
    const [lo, hi] = this.getMountedRangeFlexible(
      activeIndex,
      totalCount,
      ahead,
      behind
    );
    return index >= lo && index <= hi;
  }

  // ── Buffer management ─────────────────────────
  /**
   * Tell the ref to start buffering (warm decode) without playing.
   * Respects the MAX_CONCURRENT_BUFFER cap.
   */
  async warmBuffer(
    ref: any,
    videoIndex: number,
    activeIndex: number
  ): Promise<void> {
    if (!ref) return;
    if (videoIndex === activeIndex) return; // active video is playing, not warming
    if (this.bufferingRefs.has(ref)) return; // already warming this ref

    // Enforce cap
    if (this.activeBufferCount >= MAX_CONCURRENT_BUFFER) return;

    try {
      this.bufferingRefs.add(ref);
      this.activeBufferCount++;
      // Warm by getting status — this primes the decoder pipeline
      await ref.getStatusAsync();
    } catch (_) {
      // ignore
    }
  }

  /** Pause off-window players; keep decoder warm for scroll-back. */
  releaseBuffer(ref: any) {
    if (!ref) return;
    ref.pauseAsync?.().catch(() => {});
    ref.setIsMutedAsync?.(true).catch(() => {});
    if (this.bufferingRefs.has(ref)) {
      this.bufferingRefs.delete(ref);
      this.activeBufferCount = Math.max(0, this.activeBufferCount - 1);
    }
  }

  /** Destroy decoder + free native memory — only for rows far outside the window. */
  releaseDecoder(ref: any) {
    this.releaseBuffer(ref);
    ref.unloadAsync?.().catch(() => {});
  }

  releaseAll() {
    this.bufferingRefs.clear();
    this.activeBufferCount = 0;
    this.prefetchedThumbs.clear();
  }
}

export const videoPreloadManager = new VideoPreloadManager();
export { PRELOAD_AHEAD, PRELOAD_BEHIND };
