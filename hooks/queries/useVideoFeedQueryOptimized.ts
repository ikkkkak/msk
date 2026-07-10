/**
 * Optimized Video Feed Query with Redis Backend Caching
 * ─────────────────────────────────────────────────────────────────
 * • Stale-while-revalidate pattern for instant UI
 * • Redis backend caching (via server) + React Query frontend cache
 * • Request deduplication - no duplicate fetches in-flight
 * • Automatic background refresh when stale
 * • Per-user cache isolation via userID
 * ─────────────────────────────────────────────────────────────────
 */

import {
  useQuery,
  UseQueryResult,
  useQueryClient
} from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { Video } from "../../types/video";
import { queryKeys, videoEndpoints, VideoFilters } from "../../constants";

interface VideoFeedResponse {
  videos: Video[];
  hasMore: boolean;
  nextCursor: string | null;
  source: "cache" | "database"; // Track if from Redis cache
}

/**
 * useVideoFeedQueryOptimized - Production-grade video feed query
 *
 * Architecture:
 * 1. First request: Redis cache hit on server → instant response
 * 2. Subsequent requests: React Query cache + server stale-while-revalidate
 * 3. Background: Auto-refetch when stale to keep data fresh
 * 4. Fallback: Full DB query if Redis misses
 */
export const useVideoFeedQueryOptimized = (
  page: number = 1,
  limit: number = 10,
  filters?: VideoFilters
): UseQueryResult<Video[], Error> & { source?: string } => {
  const { user } = useUser();

  const result = useQuery<Video[], Error, Video[]>({
    queryKey: [
      "videoFeed",
      { page, limit, filters: JSON.stringify(filters || {}) },
      user?.ID
    ],
    queryFn: async () => {
      console.log("📹 QUERY: Fetching video feed", {
        page,
        limit,
        userId: user?.ID,
        source: "redis-or-database"
      });

      const res = await axios.get<VideoFeedResponse>(
        videoEndpoints.feed(page, limit, filters),
        {
          headers: user?.accessToken
            ? { Authorization: `Bearer ${user.accessToken}` }
            : {}
        }
      );

      console.log("✅ QUERY RESULT:", {
        videoCount: res.data.videos?.length || 0,
        source: res.data.source,
        hasMore: res.data.hasMore
      });

      return res.data.videos as Video[];
    },
    // ─── CACHE STRATEGY ───
    staleTime: 30 * 1000, // Data fresh for 30 seconds
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    placeholderData: (previousData: any) => previousData, // Show old data while fetching

    // ─── REFETCH STRATEGY ───
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchInterval: 60 * 1000, // Background refresh every 60 seconds
    refetchIntervalInBackground: true, // Continue refreshing even if tab hidden

    // ─── ERROR HANDLING ───
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    enabled: true // Always enabled (auth is optional)
  });

  return result as any;
};

/**
 * useVideoFeedPrefetch - Prefetch next page in background
 * Call this when near end of current page to have next page ready
 */
export const useVideoFeedPrefetch = (nextPage: number, limit: number = 10) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return async () => {
    if (!queryClient) return;

    console.log("🔄 PREFETCH: Next video page", { page: nextPage });

    await queryClient.prefetchQuery({
      queryKey: [
        "videoFeed",
        { page: nextPage, limit, filters: JSON.stringify({}) },
        user?.ID
      ],
      queryFn: async () => {
        const res = await axios.get<VideoFeedResponse>(
          videoEndpoints.feed(nextPage, limit),
          {
            headers: user?.accessToken
              ? { Authorization: `Bearer ${user.accessToken}` }
              : {}
          }
        );
        return res.data.videos;
      }
    });
  };
};
