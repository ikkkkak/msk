/**
 * React Query Configuration
 * ─────────────────────────────────────────────────────────────────
 * Global settings for optimal caching + Redis backend integration
 *
 * Strategy:
 * • Stale-while-revalidate pattern for instant UI
 * • Aggressive caching with smart garbage collection
 * • Background refetching to keep data fresh
 * • Request deduplication prevents duplicate API calls
 * • Automatic retry with exponential backoff
 * ─────────────────────────────────────────────────────────────────
 */

import { QueryClient, DefaultOptions } from "@tanstack/react-query";

const queryConfig: DefaultOptions = {
  queries: {
    // ─── STALE TIMES (when data becomes "stale" and needs refresh) ───
    staleTime: 1000 * 60 * 5, // 5 minutes - data fresh for this long

    // ─── GARBAGE COLLECTION (how long to keep unused data in memory) ───
    gcTime: 1000 * 60 * 60, // 1 hour - keep data for potential back-nav

    // ─── REFETCH BEHAVIOR ───
    refetchOnMount: true, // Refetch if stale when component mounts
    refetchOnWindowFocus: true, // Refetch if stale when app comes to foreground
    refetchOnReconnect: true, // Refetch if stale when internet reconnects
    refetchInterval: false, // No automatic polling by default

    // ─── PLACEHOLDER & KEEPING OLD DATA ───
    placeholderData: (previousData: any) => previousData, // Show old data while fetching

    // ─── ERROR HANDLING ───
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s... (max 30s)
      return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
    }
  },

  mutations: {
    retry: 1, // Retry mutations once on failure
    retryDelay: 1000
  }
};

/**
 * Create QueryClient with Redis-optimized settings
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig
});

/**
 * Predefined cache keys for consistent query identification
 * These work with React Query's queryKey normalization
 */
export const cacheKeys = {
  // ─── VIDEO FEEDS ───
  videoFeed: (page: number = 1) => ["videoFeed", { page }],
  videoFeeds: {
    all: () => ["videoFeed"],
    byPage: (page: number) => ["videoFeed", { page }]
  },

  // ─── PROPERTY SALES ───
  properties: {
    all: () => ["propertyList"],
    byFilter: (filters: any) => ["propertyList", { filters }],
    byId: (id: number) => ["propertyDetails", id],
    infiniteList: (filters: any) => ["propertyList", { filters }]
  },

  // ─── LANDMARKS ───
  landmarks: {
    all: () => ["landmarks"],
    byFilter: (filters: any) => ["landmarks", { filters }]
  },

  // ─── LIKES & SAVES ───
  likes: {
    videos: () => ["likedVideos"],
    properties: () => ["likedProperties"]
  },
  saves: {
    videos: () => ["savedVideos"],
    properties: () => ["savedProperties"]
  }
};

/**
 * Helper to invalidate related caches after mutations
 * Call these when user performs actions (like, save, create, etc.)
 */
export const invalidateCacheAfterMutation = {
  // After creating a new video
  createdVideo: () => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.videoFeeds.all() });
  },

  // After creating a new property
  createdProperty: () => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.properties.all() });
  },

  // After liking a video
  likedVideo: (videoId?: number) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.likes.videos() });
  },

  // After saving a property
  savedProperty: (propertyId?: number) => {
    queryClient.invalidateQueries({ queryKey: cacheKeys.saves.properties() });
    // Also invalidate the specific property details if we have the ID
    if (propertyId) {
      queryClient.invalidateQueries({
        queryKey: cacheKeys.properties.byId(propertyId)
      });
    }
  },

  // After updating a property
  updatedProperty: (propertyId: number) => {
    queryClient.invalidateQueries({
      queryKey: cacheKeys.properties.byId(propertyId)
    });
    queryClient.invalidateQueries({ queryKey: cacheKeys.properties.all() });
  },

  // After viewing a property (for view tracking)
  viewedProperty: () => {
    // Don't invalidate on view - just track, don't refresh
  }
};
