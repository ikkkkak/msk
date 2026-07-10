/**
 * Prefetches the sale video feed on app mount so the Videos tab opens instantly.
 */

import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/useUser";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchVideoFeedPage } from "../services/videoFeedFetcher";
import { videoFeedQueryKey } from "../services/videoFeedQueryKey";
import { videoPreloadService } from "../services/videoPreloadService";

export function VideoFeedPrefetcher() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    const lang = (currentLanguage || "en").toLowerCase();
    const useAuth = Boolean(user?.accessToken);
    const userId = user?.ID;
    const feedQuality = "high" as const;
    const limit = 10;

    const saleKey = videoFeedQueryKey({
      tab: "sale",
      userId,
      lang,
      feedQuality,
    });
    const landKey = videoFeedQueryKey({
      tab: "landmarks",
      userId,
      lang,
      feedQuality,
    });

    const run = async () => {
      try {
        await Promise.all([
          queryClient.prefetchInfiniteQuery({
            queryKey: saleKey,
            queryFn: ({ pageParam }) =>
              fetchVideoFeedPage({
                tab: "sale",
                cursor: (pageParam as string | null) ?? null,
                limit,
                lang,
                useAuth,
                skipCache: false,
                userId,
                fastFirstPage: pageParam == null,
              }),
            initialPageParam: null as string | null,
            getNextPageParam: (last: { nextCursor?: string | null }) =>
              last?.nextCursor ?? undefined,
            staleTime: 5 * 60 * 1000,
          }),
          queryClient.prefetchInfiniteQuery({
            queryKey: landKey,
            queryFn: ({ pageParam }) =>
              fetchVideoFeedPage({
                tab: "landmarks",
                cursor: (pageParam as string | null) ?? null,
                limit,
                lang,
                useAuth,
                skipCache: true,
                userId,
                fastFirstPage: pageParam == null,
              }),
            initialPageParam: null as string | null,
            getNextPageParam: (last: { nextCursor?: string | null }) =>
              last?.nextCursor ?? undefined,
            staleTime: 5 * 60 * 1000,
          }),
        ]);

        const saleData = queryClient.getQueryData<{
          pages: Array<{ videos: unknown[] }>;
        }>(saleKey);
        const saleVideos = (saleData?.pages?.flatMap((p) => p.videos) ??
          []) as any[];
        if (saleVideos.length > 0) {
          videoPreloadService.initialize(saleVideos);
        }
      } catch (e) {
        if (__DEV__) {
          console.warn("[VideoFeedPrefetcher] Prefetch failed:", e);
        }
      }
    };

    void run();
  }, [queryClient, user?.ID, user?.accessToken, currentLanguage]);

  return null;
}
