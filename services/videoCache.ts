import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from '../types/video';
import { PropertySaleVideo } from '../types/propertySaleVideo';
import { LandmarkVideo } from '../types/landmarkVideo';
import { isValidFeedVideoId } from '../utils/normalizeFeedVideo';

const CACHE_KEY_PREFIX = '@video_feed_cache_v5_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHED_VIDEOS = 200; // Keep last 200 videos in cache

type VideoTab = 'rent' | 'sale' | 'landmarks';

interface CachedFeed {
  videos: (Video | PropertySaleVideo | LandmarkVideo)[];
  cursor: string | null;
  timestamp: number;
  tab: VideoTab;
}

/**
 * Video Feed Cache Service
 * Implements persistent caching for video feeds to ensure stable, TikTok-like experience
 */
class VideoCacheService {
  private memoryCache: Map<string, CachedFeed> = new Map();
  private readonly CACHE_KEY: Record<VideoTab, string> = {
    rent: `${CACHE_KEY_PREFIX}rent`,
    sale: `${CACHE_KEY_PREFIX}sale`,
    landmarks: `${CACHE_KEY_PREFIX}landmarks`,
  };

  private getCacheKey(tab: VideoTab): string {
    return this.CACHE_KEY[tab];
  }

  /**
   * Get cached feed for a tab
   */
  async getCachedFeed(tab: VideoTab): Promise<CachedFeed | null> {
    const cacheKey = this.getCacheKey(tab);
    
    // Check memory cache first
    const memoryCache = this.memoryCache.get(cacheKey);
    if (memoryCache && this.isCacheValid(memoryCache.timestamp)) {
      return memoryCache;
    }

    // Check persistent storage
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const feed: CachedFeed = JSON.parse(cached);
        if (this.isCacheValid(feed.timestamp)) {
          // Restore to memory cache
          this.memoryCache.set(cacheKey, feed);
          return feed;
        } else {
          // Cache expired, remove it
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading video cache:', error);
    }

    return null;
  }

  /**
   * Save feed to cache
   */
  async saveFeed(tab: VideoTab, videos: (Video | PropertySaleVideo | LandmarkVideo)[], cursor: string | null): Promise<void> {
    const cacheKey = this.getCacheKey(tab);
    
    // Get existing cache
    const existing = await this.getCachedFeed(tab);
    const existingVideos = existing?.videos || [];
    
    // Merge with existing, avoiding duplicates
    const videoMap = new Map<string, Video | PropertySaleVideo | LandmarkVideo>();
    
    const put = (v: Video | PropertySaleVideo | LandmarkVideo) => {
      if (!isValidFeedVideoId(v.ID)) return;
      videoMap.set(String(v.ID), v);
    };
    
    // Add existing videos first
    existingVideos.forEach(put);
    
    // Add new videos (will overwrite duplicates)
    videos.forEach(put);
    
    // Convert back to array and limit size
    const allVideos = Array.from(videoMap.values());
    const limitedVideos = allVideos.slice(0, MAX_CACHED_VIDEOS);
    
    const feed: CachedFeed = {
      videos: limitedVideos,
      cursor,
      timestamp: Date.now(),
      tab,
    };

    // Save to memory cache
    this.memoryCache.set(cacheKey, feed);

    // Save to persistent storage
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(feed));
    } catch (error) {
      console.error('Error saving video cache:', error);
    }
  }

  /**
   * Append videos to existing cache
   */
  async appendToFeed(tab: VideoTab, videos: (Video | PropertySaleVideo | LandmarkVideo)[], cursor: string | null): Promise<void> {
    const existing = await this.getCachedFeed(tab);
    const existingVideos = existing?.videos || [];
    
    // Merge avoiding duplicates
    const videoMap = new Map<string, Video | PropertySaleVideo | LandmarkVideo>();
    const put = (v: Video | PropertySaleVideo | LandmarkVideo) => {
      if (!isValidFeedVideoId(v.ID)) return;
      videoMap.set(String(v.ID), v);
    };
    existingVideos.forEach(put);
    videos.forEach(put);
    
    const allVideos = Array.from(videoMap.values());
    const limitedVideos = allVideos.slice(0, MAX_CACHED_VIDEOS);
    
    await this.saveFeed(tab, limitedVideos, cursor);
  }

  /**
   * Update a single video in cache (for like/save updates)
   */
  async updateVideoInCache(tab: VideoTab, videoId: number, updates: Partial<Video | PropertySaleVideo | LandmarkVideo>): Promise<void> {
    const existing = await this.getCachedFeed(tab);
    if (!existing) return;

    const updatedVideos = existing.videos.map(v => {
      if (v.ID === videoId) {
        return { ...v, ...updates };
      }
      return v;
    });

    await this.saveFeed(tab, updatedVideos, existing.cursor);
  }

  /**
   * Clear cache for a tab
   */
  async clearCache(tab: VideoTab): Promise<void> {
    const cacheKey = this.getCacheKey(tab);
    this.memoryCache.delete(cacheKey);
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing video cache:', error);
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_EXPIRY_MS;
  }

  /**
   * Get backup feed (cached videos as fallback)
   */
  async getBackupFeed(tab: VideoTab): Promise<(Video | PropertySaleVideo | LandmarkVideo)[]> {
    const cached = await this.getCachedFeed(tab);
    return cached?.videos || [];
  }
}

export const videoCacheService = new VideoCacheService();

