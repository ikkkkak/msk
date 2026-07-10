import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../useUser";
import { useRef, useEffect, useMemo } from "react";
import { Video } from "../../types/video";
import { PropertySaleVideo } from "../../types/propertySaleVideo";
import { LandmarkVideo } from "../../types/landmarkVideo";
import { videoCacheService } from "../../services/videoCache";
import { getOrCreateDeviceId } from "../../utils/deviceId";
import {
  fetchVideoFeedPage,
  type VideoFeedFilters
} from "../../services/videoFeedFetcher";
import { videoFeedQueryKey } from "../../services/videoFeedQueryKey";
import { retryDelayMs } from "../../utils/apiRetry";
import {
  isValidFeedVideoId,
  normalizeFeedVideoPage,
} from "../../utils/normalizeFeedVideo";
import {
  dedupeFeedClips,
  stripRentPropertySaleFallback,
} from "../../utils/videoFeedMerge";

interface VideoFeedResponse {
  videos: (Video | PropertySaleVideo | LandmarkVideo)[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseCursorVideoFeedOptions {
  tab: "rent" | "sale" | "landmarks";
  limit?: number;
  enabled?: boolean;
  lang?: string;
  filters?: VideoFeedFilters;
  feedQuality?: "high" | "low";
}

/**
 * Cursor-based video feed hook
 * Implements stable, TikTok-like feed that doesn't refetch on interactions
 */
export const useCursorVideoFeed = ({
  tab,
  limit = 20,
  enabled = true,
  lang = "en",
  filters,
  feedQuality = "high"
}: UseCursorVideoFeedOptions) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const langParam = (lang || "en").toLowerCase();
  const useAuth = Boolean(user?.accessToken);
  const hasFilters = Boolean(filters && Object.keys(filters).length > 0);

  const queryKey = useMemo(
    () =>
      videoFeedQueryKey({
        tab,
        userId: user?.ID,
        lang: langParam,
        filters,
        feedQuality,
      }),
    [tab, user?.ID, langParam, filters, feedQuality],
  );

  return useInfiniteQuery<VideoFeedResponse>({
    queryKey,
    queryFn: async ({ pageParam = null }) => {
      const deviceId = await getOrCreateDeviceId();
      const isFirstPage = pageParam == null;

      try {
        if (__DEV__) {
          console.log(
            `[VideoFeed] fetch ${tab} user=${user?.ID ?? "anon"} page=${pageParam ?? "0"}`,
          );
        }

        // Stale-while-revalidate: show cached feed instantly, refresh in background.
        if (isFirstPage && !hasFilters && langParam === "en") {
          const cached = await videoCacheService.getCachedFeed(tab);
          if (cached && cached.videos.length > 0) {
            const normalized = normalizeFeedVideoPage(cached.videos, tab);
            if (normalized.length > 0) {
              const cachedPage: VideoFeedResponse = {
                videos: normalized.slice(0, limit),
                nextCursor: cached.cursor,
                hasMore: cached.cursor !== null,
              };
              void fetchVideoFeedPage({
                tab,
                cursor: null,
                limit,
                lang: langParam,
                filters,
                useAuth,
                skipCache: true,
                userId: user?.ID,
                deviceId,
                feedQuality,
                fastFirstPage: true,
              })
                .then((fresh) => {
                  if (fresh.videos.length === 0) return;
                  queryClient.setQueryData(
                    queryKey,
                    (old: { pages: VideoFeedResponse[]; pageParams: unknown[] } | undefined) => {
                      if (!old || old.pages.length <= 1) {
                        return { pages: [fresh], pageParams: [null] };
                      }
                      return old;
                    },
                  );
                })
                .catch(() => {});
              return cachedPage;
            }
          }
        }

        const page = await fetchVideoFeedPage({
          tab,
          cursor: pageParam as string | null,
          limit,
          lang: langParam,
          filters,
          useAuth,
          skipCache: false,
          userId: user?.ID,
          deviceId,
          feedQuality,
          fastFirstPage: isFirstPage,
        });
        return page;
  } catch (error: unknown) {
    console.error(`❌ Error fetching ${tab} feed:`, error);
    if (isFirstPage) {
      const cached = await videoCacheService.getCachedFeed(tab);
      if (cached && cached.videos.length > 0) {
        const normalized = normalizeFeedVideoPage(cached.videos, tab);
        if (normalized.length > 0) {
          return {
            videos: normalized.slice(0, limit),
            nextCursor: cached.cursor,
            hasMore: cached.cursor !== null,
          };
        }
      }
    }
    const backup = await videoCacheService.getBackupFeed(tab);
        if (backup.length > 0) {
          return {
            videos: backup.slice(0, limit),
            nextCursor: null,
            hasMore: false
          };
        }
        throw error;
      }
    },
    enabled,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attempt) => retryDelayMs(attempt)
  });
};

export const useAccumulatedVideos = (
  tab: "rent" | "sale" | "landmarks",
  lang?: string,
  filters?: VideoFeedFilters,
  feedQuality?: "high" | "low",
  options?: { enabled?: boolean },
) => {
  const { data, ...rest } = useCursorVideoFeed({
    tab,
    lang,
    filters,
    feedQuality,
    enabled: options?.enabled !== false,
  });

  const accumulatedVideos = data?.pages.flatMap((page) => page.videos) || [];

  const normalized = normalizeFeedVideoPage(accumulatedVideos, tab);

  // Dedup by feed row id (e.g. sale clip "42_0" — never collapse by property id alone).
  const uniqueVideos = Array.from(
    new Map(
      normalized
        .filter((v) => isValidFeedVideoId(v.ID))
        .map((v) => [String(v.ID), v]),
    ).values(),
  );

  const tabVideos =
    tab === "rent"
      ? stripRentPropertySaleFallback(uniqueVideos)
      : uniqueVideos;
  const spacedVideos = dedupeFeedClips(tabVideos);

  // ── Frontend debug logs ───────────────────────────────────────────────
  // Logs the exact ID order that the UI is currently holding for the feed.
  // Helps verify shuffle/rotation across reloads & pagination.
  const prevLenRef = useRef(0);
  const prevTabRef = useRef(tab);

  // Reset when switching feed tab.
  useEffect(() => {
    prevTabRef.current = tab;
    prevLenRef.current = 0;
  }, [tab]);

  useEffect(() => {
    const ids = spacedVideos.map((v) => String(v.ID));
    const prevLen = prevLenRef.current;

    if (ids.length === 0) return;

    if (prevLen === 0) {
      console.log(
        `[Frontend VideoFeed] ${tab} initial (${ids.length}) ids:`,
        ids.slice(0, 30)
      );
      prevLenRef.current = ids.length;
      return;
    }

    if (ids.length > prevLen) {
      console.log(
        `[Frontend VideoFeed] ${tab} appended (${prevLen} -> ${ids.length}) ids:`,
        ids.slice(prevLen, prevLen + 30)
      );
      prevLenRef.current = ids.length;
      return;
    }

    // If length didn't change, log head change (detect reshuffle without pagination)
    const prevHead = spacedVideos[0]?.ID;
    // (We don't store previous head to keep it simple; only log on length changes.)
  }, [tab, spacedVideos.length, spacedVideos[0]?.ID]);

  return {
    videos: spacedVideos,
    ...rest
  };
};
