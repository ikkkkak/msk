/**
 * TWO-LAYER VIDEO CACHE
 * - Memory Cache: Fast, immediate access (current + next videos)
 * - Disk Cache: Persistent, survives app restarts
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

interface CachedVideo {
  id: number;
  url: string;
  timestamp: number; // When cached
  size: number; // Bytes
}

interface CacheStats {
  memorySize: number;
  diskSize: number;
  memoryCount: number;
  diskCount: number;
}

const MEMORY_LIMIT = 100 * 1024 * 1024; // 100MB
const DISK_LIMIT = 500 * 1024 * 1024; // 500MB
const CACHE_KEY_PREFIX = "@video_cache:";
const CACHE_STATS_KEY = "@video_cache_stats";

class TwoLayerVideoCache {
  private memoryCache: Map<number, CachedVideo> = new Map();
  private memorySize: number = 0;
  private diskSize: number = 0;

  /**
   * Add video to memory cache
   */
  async addToMemoryCache(
    videoId: number,
    url: string,
    sizeBytes: number
  ): Promise<void> {
    // Check if we need to evict
    if (this.memorySize + sizeBytes > MEMORY_LIMIT) {
      await this.evictFromMemory();
    }

    const cachedVideo: CachedVideo = {
      id: videoId,
      url,
      timestamp: Date.now(),
      size: sizeBytes
    };

    // If already exists, remove old size
    const existing = this.memoryCache.get(videoId);
    if (existing) {
      this.memorySize -= existing.size;
    }

    this.memoryCache.set(videoId, cachedVideo);
    this.memorySize += sizeBytes;

    console.log(
      `[TwoLayerCache] Added to memory: Video ${videoId} (${Math.round(sizeBytes / 1024)}KB). Total: ${Math.round(this.memorySize / 1024 / 1024)}MB`
    );
  }

  /**
   * Add video to disk cache
   */
  async addToDiskCache(
    videoId: number,
    url: string,
    sizeBytes: number
  ): Promise<void> {
    try {
      // Check if we need to evict
      if (this.diskSize + sizeBytes > DISK_LIMIT) {
        await this.evictFromDisk();
      }

      const cachedVideo: CachedVideo = {
        id: videoId,
        url,
        timestamp: Date.now(),
        size: sizeBytes
      };

      await AsyncStorage.setItem(
        `${CACHE_KEY_PREFIX}${videoId}`,
        JSON.stringify(cachedVideo)
      );

      this.diskSize += sizeBytes;

      console.log(
        `[TwoLayerCache] Added to disk: Video ${videoId} (${Math.round(sizeBytes / 1024)}KB). Total: ${Math.round(this.diskSize / 1024 / 1024)}MB`
      );
    } catch (error) {
      console.warn("[TwoLayerCache] Error adding to disk cache:", error);
    }
  }

  /**
   * Get video from cache (memory first, then disk)
   */
  async getFromCache(videoId: number): Promise<CachedVideo | null> {
    // Check memory first
    if (this.memoryCache.has(videoId)) {
      return this.memoryCache.get(videoId) || null;
    }

    // Check disk
    try {
      const data = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${videoId}`);
      if (data) {
        const cachedVideo = JSON.parse(data) as CachedVideo;
        console.log(`[TwoLayerCache] Retrieved from disk: Video ${videoId}`);
        return cachedVideo;
      }
    } catch (error) {
      console.warn("[TwoLayerCache] Error retrieving from disk cache:", error);
    }

    return null;
  }

  /**
   * Check if video is cached
   */
  async isCached(videoId: number): Promise<boolean> {
    if (this.memoryCache.has(videoId)) return true;

    try {
      const data = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${videoId}`);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Evict oldest videos from memory when limit reached
   */
  private async evictFromMemory(): Promise<void> {
    if (this.memoryCache.size === 0) return;

    // Sort by timestamp, evict oldest
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 25% or at least 1
    const toRemove = Math.max(1, Math.floor(entries.length * 0.25));

    for (let i = 0; i < toRemove; i++) {
      const [videoId, video] = entries[i];
      this.memoryCache.delete(videoId);
      this.memorySize -= video.size;
      console.log(`[TwoLayerCache] Evicted from memory: Video ${videoId}`);
    }
  }

  /**
   * Evict oldest videos from disk when limit reached
   */
  private async evictFromDisk(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));

      if (cacheKeys.length === 0) return;

      // Get all cached videos with timestamps
      const videos: Array<[string, CachedVideo]> = [];

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          videos.push([key, JSON.parse(data)]);
        }
      }

      // Sort by timestamp, evict oldest
      videos.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 25% or at least 1
      const toRemove = Math.max(1, Math.floor(videos.length * 0.25));

      for (let i = 0; i < toRemove; i++) {
        const [key, video] = videos[i];
        await AsyncStorage.removeItem(key);
        this.diskSize -= video.size;
        console.log(`[TwoLayerCache] Evicted from disk: Video ${video.id}`);
      }
    } catch (error) {
      console.warn("[TwoLayerCache] Error evicting from disk:", error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.memorySize = 0;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      this.diskSize = 0;
      console.log("[TwoLayerCache] Cleared all caches");
    } catch (error) {
      console.warn("[TwoLayerCache] Error clearing disk cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      memorySize: this.memorySize,
      diskSize: this.diskSize,
      memoryCount: this.memoryCache.size,
      diskCount: 0 // Would need to count disk entries
    };
  }

  /**
   * Optimize memory by removing videos far from current index
   */
  optimizeMemory(currentIndex: number, maxDistance: number = 5): void {
    const keysToRemove: number[] = [];

    for (const [videoId, video] of this.memoryCache.entries()) {
      // Estimate index from videoId (rough heuristic)
      // In real app, you'd track index separately
      if (Math.abs(videoId - currentIndex) > maxDistance) {
        keysToRemove.push(videoId);
      }
    }

    for (const videoId of keysToRemove) {
      const video = this.memoryCache.get(videoId);
      if (video) {
        this.memoryCache.delete(videoId);
        this.memorySize -= video.size;
      }
    }

    if (keysToRemove.length > 0) {
      console.log(
        `[TwoLayerCache] Memory optimization: Removed ${keysToRemove.length} videos`
      );
    }
  }
}

export const twoLayerVideoCache = new TwoLayerVideoCache();

export default TwoLayerVideoCache;
