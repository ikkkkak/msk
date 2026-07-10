/**
 * Video prefetch during splash — uses /bootstrap when possible, else direct feed fetch.
 */

import { QueryClient } from "@tanstack/react-query";
import { fetchVideoFeedPage } from "./videoFeedFetcher";
import { videoFeedQueryKey } from "./videoFeedQueryKey";
import { videoPreloadService } from "./videoPreloadService";
import { runAppBootstrap } from "./appBootstrap";
import { resolveInitialFeedQuality } from "./networkQuality";
import type { User } from "../types/user";

const LIMIT = 8;

export async function startVideoPrefetchDuringSplash(
  queryClient: QueryClient,
  user: User | null,
  lang = "en",
): Promise<void> {
  try {
    const useAuth = Boolean(user?.accessToken);
    const userId = user?.ID ?? undefined;
    const langParam = (lang || "en").toLowerCase();
    const feedQuality = await resolveInitialFeedQuality();

    const booted = await runAppBootstrap(queryClient, {
      useAuth,
      userId,
      lang: langParam,
    });

    const saleKey = videoFeedQueryKey({
      tab: "sale",
      userId,
      lang: langParam,
      feedQuality,
    });

    const existing = queryClient.getQueryData<{
      pages: Array<{ videos: unknown[] }>;
    }>(saleKey);

    if (!booted || !existing?.pages?.[0]?.videos?.length) {
      await queryClient.prefetchInfiniteQuery({
        queryKey: saleKey,
        queryFn: async (ctx) =>
          fetchVideoFeedPage({
            tab: "sale",
            cursor: (ctx.pageParam as string | null) ?? null,
            limit: LIMIT,
            lang: langParam,
            useAuth,
            skipCache: false,
            userId,
            fastFirstPage: ctx.pageParam == null,
            feedQuality,
          }),
        initialPageParam: null as string | null,
        getNextPageParam: (last: { nextCursor?: string | null }) =>
          last?.nextCursor ?? undefined,
        staleTime: 5 * 60 * 1000,
      });
    }

    const saleData = queryClient.getQueryData<{
      pages: Array<{ videos: unknown[] }>;
    }>(saleKey);
    const saleVideos = (saleData?.pages?.flatMap((p) => p.videos) ?? []) as any[];
    if (saleVideos.length > 0) {
      videoPreloadService.initialize(saleVideos);
    }

    if (__DEV__) {
      console.log(
        "[VideoPrefetch] Splash sale prefetch:",
        saleData?.pages?.[0]?.videos?.length ?? 0,
        "videos",
        "quality=",
        feedQuality,
      );
    }
  } catch (e) {
    if (__DEV__) {
      console.warn("[VideoPrefetch] Splash prefetch failed:", e);
    }
  }
}
