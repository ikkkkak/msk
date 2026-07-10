/**
 * Video File Cache Service
 * Local disk cache for instant feed playback (TikTok-style).
 */

import * as FileSystem from "expo-file-system/legacy";

const CACHE_DIR = `${FileSystem.cacheDirectory}video-cache/`;
const MAX_CACHE_SIZE_MB = 500;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CONCURRENT_DOWNLOADS = 5;
/** First bytes for large MP4s — faststart moov + first GOP when CDN is configured correctly. */
const LEAD_IN_BYTES = 2_621_440; // 2.5 MB
/** Files at or below this size are downloaded whole (mobile/preview tier). */
const FULL_DOWNLOAD_MAX_BYTES = 12 * 1024 * 1024;

type DownloadListener = (localPath: string) => void;

/** Treat signed/CDN URLs as the same file when only query params differ. */
function normalizeUrlForVideoCache(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.trim().split("?")[0] ?? url;
  }
}

function urlsMatchForVideoCache(stored: string, requested: string): boolean {
  if (stored === requested) return true;
  const a = normalizeUrlForVideoCache(stored);
  const b = normalizeUrlForVideoCache(requested);
  return a.length > 0 && a === b;
}

function cacheFileStem(videoId: number, url: string): string {
  const last = url.split("/").pop()?.split("?")[0] || `video-${videoId}`;
  let ext = "";
  if (url.includes(".m3u8") || last === "master") {
    ext = ".m3u8";
  } else if (url.includes(".mp4") || last === "mobile" || last === "preview") {
    ext = ".mp4";
  } else if (!last.includes(".")) {
    ext = ".mp4";
  }
  const base = last.includes(".") ? last : `${last}${ext}`;
  return `${videoId}-${base}`;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return btoa(binary);
}

interface CachedVideoInfo {
  videoId: number;
  localPath: string;
  url: string;
  size: number;
  timestamp: number;
  lastAccessed: number;
  partial?: boolean;
}

class VideoFileCacheService {
  private cacheIndex: Map<number, CachedVideoInfo> = new Map();
  private downloadQueue: Array<{
    videoId: number;
    url: string;
    priority: number;
    leadInOnly?: boolean;
  }> = [];
  private activeWorkers = 0;
  private activeVideoIds = new Set<number>();
  private queueProcessing = false;
  private completeListeners = new Map<number, Set<DownloadListener>>();

  constructor() {
    void this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      await this.loadCacheIndex();
      void this.cleanOldCache();
    } catch (error) {
      console.error("[VideoFileCache] Failed to initialize:", error);
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      const indexPath = `${CACHE_DIR}.index.json`;
      const info = await FileSystem.getInfoAsync(indexPath);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(indexPath);
        const index = JSON.parse(content);
        this.cacheIndex = new Map(
          Object.entries(index).map(([k, v]: [string, any]) => [Number(k), v]),
        );
      }
    } catch (error) {
      console.warn("[VideoFileCache] Failed to load index:", error);
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const indexPath = `${CACHE_DIR}.index.json`;
      const indexObj = Object.fromEntries(this.cacheIndex);
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(indexObj));
    } catch (error) {
      console.error("[VideoFileCache] Failed to save index:", error);
    }
  }

  /** Memory-only lookup — hot path for VideoCard (no disk I/O). */
  getCachedVideoPathSync(
    videoId: number,
    url: string,
    opts?: { fullOnly?: boolean },
  ): string | null {
    const cached = this.cacheIndex.get(videoId);
    if (!cached) return null;
    if (!urlsMatchForVideoCache(cached.url, url)) return null;
    if (opts?.fullOnly && cached.partial) return null;
    cached.lastAccessed = Date.now();
    return cached.localPath;
  }

  onDownloadComplete(videoId: number, listener: DownloadListener): () => void {
    if (!this.completeListeners.has(videoId)) {
      this.completeListeners.set(videoId, new Set());
    }
    const set = this.completeListeners.get(videoId)!;
    set.add(listener);
    const cached = this.cacheIndex.get(videoId);
    if (cached?.localPath) {
      listener(cached.localPath);
    }
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.completeListeners.delete(videoId);
      }
    };
  }

  private emitDownloadComplete(videoId: number, localPath: string): void {
    for (const listener of this.completeListeners.get(videoId) ?? []) {
      listener(localPath);
    }
  }

  isQueuedOrDownloading(videoId: number): boolean {
    if (this.activeVideoIds.has(videoId)) return true;
    return this.downloadQueue.some((item) => item.videoId === videoId);
  }

  /** Bump queued item to front when user lands on a video. */
  boostPriority(videoId: number, priority: number): void {
    const item = this.downloadQueue.find((q) => q.videoId === videoId);
    if (item) {
      item.priority = Math.max(item.priority, priority);
      this.downloadQueue.sort((a, b) => b.priority - a.priority);
      return;
    }
    if (!this.activeVideoIds.has(videoId)) {
      return;
    }
  }

  async getCachedVideoPath(
    videoId: number,
    url: string,
  ): Promise<string | null> {
    const sync = this.getCachedVideoPathSync(videoId, url);
    if (!sync) return null;
    const fileInfo = await FileSystem.getInfoAsync(sync);
    if (fileInfo.exists) {
      return sync;
    }
    this.cacheIndex.delete(videoId);
    await this.saveCacheIndex();
    return null;
  }

  async preloadVideo(
    videoId: number,
    url: string,
    priority: number = 0,
    options?: { leadInOnly?: boolean },
  ): Promise<string | null> {
    const cached = await this.getCachedVideoPath(videoId, url);
    if (cached) {
      return cached;
    }

    const inQueue = this.downloadQueue.some((item) => item.videoId === videoId);
    if (inQueue) {
      this.boostPriority(videoId, priority);
      return null;
    }

    if (this.activeVideoIds.has(videoId)) {
      return null;
    }

    this.downloadQueue.push({
      videoId,
      url,
      priority,
      leadInOnly: options?.leadInOnly,
    });
    this.downloadQueue.sort((a, b) => b.priority - a.priority);

    if (!this.queueProcessing) {
      this.queueProcessing = true;
      void this.processDownloadQueue();
    }

    return null;
  }

  private async processDownloadQueue(): Promise<void> {
    while (
      this.downloadQueue.length > 0 &&
      this.activeWorkers < CONCURRENT_DOWNLOADS
    ) {
      const item = this.downloadQueue.shift();
      if (!item) break;

      this.activeWorkers += 1;
      this.activeVideoIds.add(item.videoId);
      void this.downloadVideo(item.videoId, item.url, item.leadInOnly)
        .then((localPath) => {
          if (localPath && __DEV__) {
            console.log(`[VideoFileCache] ✅ Preloaded video ${item.videoId}`);
          }
        })
        .catch((err) => {
          if (__DEV__) {
            console.warn(
              `[VideoFileCache] ❌ Preload video ${item.videoId}:`,
              err,
            );
          }
        })
        .finally(() => {
          this.activeVideoIds.delete(item.videoId);
          this.activeWorkers -= 1;
          if (this.downloadQueue.length > 0) {
            void this.processDownloadQueue();
          } else if (this.activeWorkers === 0) {
            this.queueProcessing = false;
          }
        });
    }

    if (this.activeWorkers === 0) {
      this.queueProcessing = false;
    }
  }

  private buildFullPath(videoId: number, url: string): string {
    return `${CACHE_DIR}${cacheFileStem(videoId, url)}`;
  }

  private buildPartialPath(videoId: number, url: string): string {
    return `${CACHE_DIR}${cacheFileStem(videoId, url)}.partial`;
  }

  private async probeContentLength(url: string): Promise<number | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const cl = res.headers.get("content-length");
      if (!cl) return null;
      const n = parseInt(cl, 10);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  private async fetchRangeToFile(
    url: string,
    destPath: string,
    byteCount: number,
  ): Promise<string | null> {
    try {
      const existing = await FileSystem.getInfoAsync(destPath);
      if (existing.exists && existing.size && existing.size > 48_000) {
        return destPath;
      }

      const res = await fetch(url, {
        headers: { Range: `bytes=0-${byteCount - 1}` },
      });
      if (!res.ok && res.status !== 206) {
        return null;
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength < 48_000) {
        return null;
      }

      const b64 = uint8ToBase64(new Uint8Array(buf));
      await FileSystem.writeAsStringAsync(destPath, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return destPath;
    } catch {
      return null;
    }
  }

  private registerCacheEntry(
    videoId: number,
    url: string,
    localPath: string,
    size: number,
    partial: boolean,
  ): void {
    const cachedInfo: CachedVideoInfo = {
      videoId,
      localPath,
      url,
      size,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      partial,
    };
    this.cacheIndex.set(videoId, cachedInfo);
    void this.saveCacheIndex();
    this.emitDownloadComplete(videoId, localPath);
  }

  private async downloadVideo(
    videoId: number,
    url: string,
    leadInOnly: boolean = false,
  ): Promise<string | null> {
    try {
      const localPath = this.buildFullPath(videoId, url);
      const partialPath = this.buildPartialPath(videoId, url);

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
        this.registerCacheEntry(
          videoId,
          url,
          localPath,
          fileInfo.size,
          false,
        );
        return localPath;
      }

      const partial = await this.fetchRangeToFile(
        url,
        partialPath,
        LEAD_IN_BYTES,
      );
      if (partial) {
        const partialInfo = await FileSystem.getInfoAsync(partial);
        this.registerCacheEntry(
          videoId,
          url,
          partial,
          partialInfo.size ?? LEAD_IN_BYTES,
          true,
        );
      }

      if (leadInOnly) {
        return partial;
      }

      const result = await FileSystem.downloadAsync(url, localPath);

      if (result.status === 200 && result.uri) {
        const fullInfo = await FileSystem.getInfoAsync(localPath);
        this.registerCacheEntry(
          videoId,
          url,
          result.uri,
          fullInfo.size ?? 0,
          false,
        );
        await FileSystem.deleteAsync(partialPath, { idempotent: true });
        await this.ensureCacheSize();
        return result.uri;
      }

      const partialCached = this.cacheIndex.get(videoId);
      return partialCached?.localPath ?? null;
    } catch (error) {
      console.error(
        `[VideoFileCache] Download error for video ${videoId}:`,
        error,
      );
      const partialCached = this.cacheIndex.get(videoId);
      return partialCached?.localPath ?? null;
    }
  }

  private async ensureCacheSize(): Promise<void> {
    let totalSize = 0;
    const videos = Array.from(this.cacheIndex.values());

    for (const video of videos) {
      totalSize += video.size;
    }

    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    if (totalSize > maxSizeBytes) {
      videos.sort((a, b) => a.lastAccessed - b.lastAccessed);

      for (const video of videos) {
        if (totalSize <= maxSizeBytes * 0.8) break;

        try {
          const fileInfo = await FileSystem.getInfoAsync(video.localPath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(video.localPath, { idempotent: true });
          }
          this.cacheIndex.delete(video.videoId);
          totalSize -= video.size;
        } catch (error) {
          console.warn(
            `[VideoFileCache] Failed to delete ${video.videoId}:`,
            error,
          );
        }
      }

      await this.saveCacheIndex();
    }
  }

  private async cleanOldCache(): Promise<void> {
    const now = Date.now();
    const videosToDelete: number[] = [];

    for (const [videoId, info] of this.cacheIndex.entries()) {
      if (now - info.lastAccessed > MAX_CACHE_AGE_MS) {
        videosToDelete.push(videoId);
      }
    }

    for (const videoId of videosToDelete) {
      const info = this.cacheIndex.get(videoId);
      if (info) {
        try {
          await FileSystem.deleteAsync(info.localPath, { idempotent: true });
          this.cacheIndex.delete(videoId);
        } catch (error) {
          console.warn(
            `[VideoFileCache] Failed to delete old video ${videoId}:`,
            error,
          );
        }
      }
    }

    if (videosToDelete.length > 0) {
      await this.saveCacheIndex();
    }
  }

  async removeVideo(videoId: number): Promise<void> {
    const cached = this.cacheIndex.get(videoId);
    if (cached) {
      try {
        await FileSystem.deleteAsync(cached.localPath, { idempotent: true });
        this.cacheIndex.delete(videoId);
        await this.saveCacheIndex();
      } catch (error) {
        console.warn(`[VideoFileCache] Failed to remove video ${videoId}:`, error);
      }
    }
  }

  async clearCache(): Promise<void> {
    try {
      for (const info of this.cacheIndex.values()) {
        await FileSystem.deleteAsync(info.localPath, { idempotent: true });
      }
      this.cacheIndex.clear();
      await this.saveCacheIndex();

      this.downloadQueue = [];
      this.activeWorkers = 0;
      this.activeVideoIds.clear();
      this.queueProcessing = false;
    } catch (error) {
      console.error("[VideoFileCache] Failed to clear cache:", error);
    }
  }

  getCacheStats(): { count: number; totalSizeMB: number; queueLength: number } {
    let totalSize = 0;
    for (const info of this.cacheIndex.values()) {
      totalSize += info.size;
    }

    return {
      count: this.cacheIndex.size,
      totalSizeMB: totalSize / (1024 * 1024),
      queueLength: this.downloadQueue.length,
    };
  }
}

export const videoFileCacheService = new VideoFileCacheService();
