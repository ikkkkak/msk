import { useEffect, useRef, useCallback } from 'react';
import { Image, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';
import { endpoints } from '../constants';

export interface StoryPreviewTarget {
  thumbURL?: string;
  mediaURL?: string;
  type?: 'image' | 'video';
  userId?: number;
}

interface StoryClip {
  id: string | number;
  type: 'image' | 'video';
  mediaURL: string;
  thumbURL?: string;
  durationSeconds?: number;
}

interface PreloadOptions {
  preloadMetadata?: boolean;
  preloadVideos?: boolean;
  preloadImages?: boolean;
}

// Cache for downloaded video paths
const videoCache = new Map<string, string>();
const metadataCache = new Map<number, StoryClip[]>();
const preloadedUrls = new Set<string>();

// Download video to cache for instant playback
const downloadVideoToCache = async (url: string): Promise<string | null> => {
  if (!url) return null;
  
  // Check memory cache first
  if (videoCache.has(url)) {
    return videoCache.get(url) || null;
  }

  try {
    const hash = url.split('/').pop()?.split('?')[0] || encodeURIComponent(url);
    const destPath = `${FileSystem.cacheDirectory}story-video-${hash}`;
    
    // Check if already cached on disk
    const info = await FileSystem.getInfoAsync(destPath);
    if (info.exists) {
      videoCache.set(url, destPath);
      return destPath;
    }

    // Download to cache
    const result = await FileSystem.downloadAsync(url, destPath);
    if (result.status === 200) {
      videoCache.set(url, destPath);
      return destPath;
    }
    return null;
  } catch (error) {
    console.warn('[StoriesPreload] Video cache failed:', error);
    return null;
  }
};

// Prefetch image using React Native's Image.prefetch
const prefetchImage = async (url: string): Promise<boolean> => {
  if (!url || preloadedUrls.has(url)) return true;
  
  try {
    await Image.prefetch(url);
    preloadedUrls.add(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Fetch story metadata from API
const fetchStoryMetadata = async (userId: number): Promise<StoryClip[]> => {
  // Check cache
  if (metadataCache.has(userId)) {
    return metadataCache.get(userId) || [];
  }

  try {
    const res = await axios.get(`${endpoints.baseURL}/stories/${userId}`, {
      timeout: 10000,
    });
    
    const clips = (res.data?.stories || []).map((s: any) => ({
      id: s.id,
      type: s.type,
      mediaURL: s.media_url,
      thumbURL: s.thumb_url,
      durationSeconds: s.duration_seconds,
    }));
    
    // Cache the metadata
    metadataCache.set(userId, clips);
    return clips;
  } catch (error) {
    console.warn('[StoriesPreload] Metadata fetch failed:', error);
    return [];
  }
};

// Preload all media for a user's stories
const preloadUserStories = async (
  userId: number,
  options: PreloadOptions
): Promise<void> => {
  const clips = await fetchStoryMetadata(userId);
  if (clips.length === 0) return;

  const tasks: Promise<any>[] = [];

  // Preload first 3 clips more aggressively
  const priorityClips = clips.slice(0, 3);
  
  for (const clip of priorityClips) {
    // Always prefetch thumbnails
    if (clip.thumbURL) {
      tasks.push(prefetchImage(clip.thumbURL));
    }

    // Prefetch images
    if (clip.type === 'image' && clip.mediaURL && options.preloadImages !== false) {
      tasks.push(prefetchImage(clip.mediaURL));
    }

    // Cache videos for instant playback
    if (clip.type === 'video' && clip.mediaURL && options.preloadVideos) {
      tasks.push(downloadVideoToCache(clip.mediaURL));
    }
  }

  // Execute all in parallel
  await Promise.allSettled(tasks);
};

export const useStoriesPreload = (
  targets: StoryPreviewTarget[],
  maxAhead: number = 5,
  options: PreloadOptions = {}
) => {
  const isPreloading = useRef(false);
  const preloadedUsers = useRef<Set<number>>(new Set());

  const getCachedMetadata = useCallback((userId: number) => {
    return metadataCache.get(userId);
  }, []);

  const getCachedVideoPath = useCallback((url: string) => {
    return videoCache.get(url);
  }, []);

  useEffect(() => {
    if (!Array.isArray(targets) || targets.length === 0) return;
    if (isPreloading.current) return;

    isPreloading.current = true;

    const preload = async () => {
      try {
        const subset = targets.slice(0, Math.min(maxAhead, targets.length));

        for (const target of subset) {
          // Prefetch thumbnails immediately
          if (target.thumbURL && !preloadedUrls.has(target.thumbURL)) {
            prefetchImage(target.thumbURL).catch(() => {});
          }

          // Preload user stories if we have userId
          const userId = target.userId;
          if (
            userId !== undefined &&
            options.preloadMetadata &&
            !preloadedUsers.current.has(userId)
          ) {
            preloadedUsers.current.add(userId);
            
            // Preload in background (non-blocking)
            preloadUserStories(userId, {
              preloadMetadata: true,
              preloadVideos: options.preloadVideos,
              preloadImages: options.preloadImages !== false,
            }).catch(() => {});
          }
        }
      } finally {
        isPreloading.current = false;
      }
    };

    // Start preloading with a small delay to not block initial render
    const timer = setTimeout(preload, 200);
    return () => clearTimeout(timer);
  }, [JSON.stringify(targets.map(t => t.userId)), maxAhead, options.preloadMetadata, options.preloadVideos, options.preloadImages]);

  return {
    getCachedMetadata,
    getCachedVideoPath,
  };
};

// Export utilities for use elsewhere
export const preloadStoryMedia = async (clips: StoryClip[], options?: PreloadOptions) => {
  const tasks: Promise<any>[] = [];

  for (const clip of clips.slice(0, 5)) {
    if (clip.thumbURL) {
      tasks.push(prefetchImage(clip.thumbURL));
    }
    if (clip.type === 'image' && clip.mediaURL) {
      tasks.push(prefetchImage(clip.mediaURL));
    }
    if (clip.type === 'video' && clip.mediaURL && options?.preloadVideos) {
      tasks.push(downloadVideoToCache(clip.mediaURL));
    }
  }

  await Promise.allSettled(tasks);
};

export const clearStoryCache = () => {
  videoCache.clear();
  metadataCache.clear();
  preloadedUrls.clear();
};

export default useStoriesPreload;
