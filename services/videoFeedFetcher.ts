/**
 * Shared video feed fetch logic for useCursorVideoFeed + prefetching.
 * Used to prefetch feeds on app mount so VideoFeedScreen opens instantly.
 */

import { api, publicApi } from "./api";
import { videoCacheService } from "./videoCache";
import * as ScoringService from "./videoScoringService";
import * as DiversityService from "./videoDiversityService";
import * as RotationTracker from "./videoRotationTracker";
import type { Video } from "../types/video";
import type { PropertySaleVideo } from "../types/propertySaleVideo";
import type { LandmarkVideo } from "../types/landmarkVideo";
import {
  normalizeFeedVideoPage,
} from "../utils/normalizeFeedVideo";

export interface VideoFeedPage {
  videos: (Video | PropertySaleVideo | LandmarkVideo)[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface VideoFeedFilters {
  city?: string;
  country_id?: number;
  city_id?: number;
  zone_id?: number;
  quartier_id?: number;
  min_area?: number;
  max_area?: number;
  min_price?: number;
  max_price?: number;
  /** Landmark filters */
  district?: string;
  region?: string;
}

export interface FetchVideoFeedPageOptions {
  tab: "rent" | "sale" | "landmarks";
  cursor?: string | null;
  limit?: number;
  lang?: string;
  filters?: VideoFeedFilters;
  /** Use authenticated client when true */
  useAuth?: boolean;
  /** Skip cache and always hit API (e.g. for prefetch to get fresh data fast) */
  skipCache?: boolean;
  /** User ID for personalized scoring and rotation */
  userId?: string | number;
  /** Device ID for anonymous user tracking */
  deviceId?: string;
  /** `low` → fewer/smaller fields on supported endpoints (2G/3G) */
  feedQuality?: "high" | "low";
  /** Skip heavy client shuffle/scoring on first page — show API order immediately */
  fastFirstPage?: boolean;
}

const defaultLimit = 20;
const defaultLang = "en";

/**
 * Apply scoring, rotation tracking, and diversity to videos
 */
async function processVideoFeed(
  videos: (Video | PropertySaleVideo | LandmarkVideo)[],
  userId?: string | number,
  deviceId?: string
): Promise<(Video | PropertySaleVideo | LandmarkVideo)[]> {
  console.log(
    `[PROCESS-VIDEO-FEED] Started with ${videos.length} videos, userId=${userId}, deviceId=${deviceId}`
  );

  if (!videos.length) {
    console.warn(`[PROCESS-VIDEO-FEED] ❌ Empty video array received!`);
    return videos;
  }

  // Build view history map for user
  let viewHistoryMap: Map<string | number, Date | string | null> = new Map();
  if (userId) {
    viewHistoryMap = await RotationTracker.buildViewHistoryMap(userId);
    console.log(
      `[VideoFeed] Loaded ${viewHistoryMap.size} videos from view history`
    );
  }

  // Score each video
  const scored = ScoringService.scoreVideos(
    videos.map((v) => ({
      id: v.ID,
      createdAt: v.CreatedAt || new Date(),
      likesCount: v.LikesCount || 0,
      commentsCount: v.CommentsCount || 0,
      viewCount: v.ViewCount || 0,
      completionRate: (v as any).CompletionRate || 0.5,
      city: (v as any).Property?.City || (v as any).City,
      zone: (v as any).Property?.Zone || (v as any).Zone,
      propertyType:
        (v as any).Property?.PropertyType || (v as any).PropertyType,
      price: (v as any).Property?.Price || (v as any).Price,
      bedrooms: (v as any).Property?.Bedrooms || (v as any).Bedrooms,
      bathrooms: (v as any).Property?.Bathrooms || (v as any).Bathrooms,
      area: (v as any).Property?.Area || (v as any).Area
    })),
    {}, // params (empty for anonymous users)
    viewHistoryMap
  );

  // Map scores back to videos
  const videoMap = new Map(videos.map((v) => [v.ID, v]));
  const scoredVideos = scored.map(
    (s) =>
      ({
        ...videoMap.get(s.videoId),
        score: s.score
      }) as any
  );

  console.log(
    `[Scoring] Top 3 scores:`,
    scoredVideos.slice(0, 3).map((v) => ({ id: v.ID, score: v.score }))
  );

  // Apply diversity re-ranking
  const diversified = DiversityService.diversifyVideoList(
    scoredVideos.map((v) => ({
      id: v.ID,
      score: v.score,
      city: (v as any).Property?.City || (v as any).City,
      zone: (v as any).Property?.Zone || (v as any).Zone,
      propertyType:
        (v as any).Property?.PropertyType || (v as any).PropertyType,
      price: (v as any).Property?.Price || (v as any).Price,
      bedrooms: (v as any).Property?.Bedrooms || (v as any).Bedrooms,
      bathrooms: (v as any).Property?.Bathrooms || (v as any).Bathrooms,
      hostUserId: (v as any).UserID
    })),
    "both"
  );

  console.log(
    `[Diversity] Reordered videos. First 3 IDs: ${diversified
      .slice(0, 3)
      .map((d) => d.id)
      .join(", ")}`
  );

  // ========================================
  // RANDOM SHUFFLE: Simple & Effective
  // ========================================

  console.log(
    `[SHUFFLE-DEBUG] Input: ${diversified.length} videos, ready to randomize`
  );
  console.log(
    `[SHUFFLE-DEBUG] First 5 before shuffle: ${diversified
      .slice(0, 5)
      .map((d) => d.id)
      .join(", ")}`
  );

  // Use Fisher-Yates with Math.random() - TRUE randomization on every refresh
  const shuffled = [...diversified];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // VERIFICATION: Log position changes
  const changes = diversified.filter((v, i) => shuffled[i]?.id !== v.id).length;
  console.log(`[SHUFFLE] ✅ Reordered ${changes}/${diversified.length} videos`);
  console.log(
    `[SHUFFLE] First 5 AFTER shuffle: ${shuffled
      .slice(0, 5)
      .map((d) => d.id)
      .join(", ")}`
  );

  const mapped = shuffled
    .map((d) => {
      const key = d.id;
      return videoMap.get(key) ?? videoMap.get(String(key));
    })
    .filter(
      (v): v is (Video | PropertySaleVideo | LandmarkVideo) =>
        v != null &&
        v.ID !== undefined &&
        v.ID !== null &&
        `${(v as any).ID}`.length > 0
    );

  if (mapped.length === 0 && videos.length > 0) {
    console.warn(
      "[PROCESS-VIDEO-FEED] Shuffle/diversity lost all items (ID mismatch); using raw API list."
    );
    return videos;
  }

  return mapped;
}

/**
 * Fetch a single page of video feed. Uses cache when skipCache=false and lang=en.
 */
export async function fetchVideoFeedPage(
  opts: FetchVideoFeedPageOptions
): Promise<VideoFeedPage> {
  const {
    tab,
    cursor = null,
    limit = defaultLimit,
    lang = defaultLang,
    filters,
    useAuth = false,
    skipCache = false,
    feedQuality = "high",
    fastFirstPage = false,
  } = opts;
  const langParam = (lang || "en").toLowerCase();
  const apiClient = useAuth ? api : publicApi;

  const hasFilters = filters && Object.keys(filters).length > 0;
  const isFirstPage = !cursor;

  // Cache is a fallback only — SWR path in useCursorVideoFeed returns cache before this runs.
  if (!skipCache && isFirstPage && langParam === "en" && !hasFilters) {
    const cached = await videoCacheService.getCachedFeed(tab);
    if (cached && cached.videos.length > 0) {
      const normalized = normalizeFeedVideoPage(cached.videos, tab);
      if (normalized.length > 0 && __DEV__) {
        console.log(
          `[VideoFeed] ${tab} cache warm (${normalized.length} items) — fetching fresh`,
        );
      }
    }
  }

  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("lang", langParam);
  // Sale/land: numeric cursor = page index. Rent: always video-id cursor.
  if (cursor) {
    if (tab === "rent") {
      params.set("cursor", String(cursor));
    } else if (/^\d+$/.test(String(cursor))) {
      params.set("page", String(cursor));
    } else {
      params.set("cursor", String(cursor));
    }
  }
  if (tab === "rent") {
    params.set("unified", "1");
  }
  if (feedQuality === "low") {
    params.set("quality", "low");
    params.set("lite", "1");
  }
  if (filters) {
    if (filters.city) params.set("city", filters.city);
    if (filters.country_id)
      params.set("country_id", String(filters.country_id));
    if (filters.city_id) params.set("city_id", String(filters.city_id));
    if (filters.zone_id) params.set("zone_id", String(filters.zone_id));
    if (filters.quartier_id)
      params.set("quartier_id", String(filters.quartier_id));
    if (filters.min_area) params.set("min_area", String(filters.min_area));
    if (filters.max_area) params.set("max_area", String(filters.max_area));
    if (filters.min_price) params.set("min_price", String(filters.min_price));
    if (filters.max_price) params.set("max_price", String(filters.max_price));
    if (filters.district) params.set("district", filters.district);
    if (filters.region) params.set("region", filters.region);
  }
  const endpoint =
    tab === "rent"
      ? `/video/feed?${params.toString()}`
      : tab === "landmarks"
        ? `/landmarks/videos/feed?${params.toString()}`
        : `/property-sale-videos/feed?${params.toString()}`;

  // Sale feed SQL can be slow; allow long tail on poor networks but prefer cached SWR path.
  const res = await apiClient.get(endpoint, { timeout: 45_000 });
  let videos = normalizeFeedVideoPage(res.data.videos || [], tab);

  console.log(
    `[VideoFeed] Backend returned ${videos.length} videos from ${endpoint}`
  );

  const skipProcessing = true;
  if (videos.length > 0 && !skipProcessing) {
    try {
      // CRITICAL: Pass userId and deviceId from options (not from global context!)
      const userId = opts.userId;
      const deviceId = opts.deviceId;

      console.log(
        `[VideoFeed] 🎯 About to shuffle - userId=${userId}, deviceId=${deviceId}`
      );

      videos = await processVideoFeed(videos, userId, deviceId);
      console.log(
        `[VideoFeed] ✅ Processed ${videos.length} videos with scoring & diversity for user ${userId || "anonymous"} (device ${deviceId?.substring(0, 8) || "unknown"})`
      );
    } catch (error) {
      console.warn(
        "[VideoFeed] Scoring/diversity error, using raw videos:",
        error
      );
    }
  }

  const page: VideoFeedPage = {
    videos,
    nextCursor: res.data.nextCursor ?? null,
    hasMore:
      res.data.hasMore !== false &&
      (Boolean(res.data.nextCursor) || res.data.hasMore === true),
  };

  if (page.videos.length > 0) {
    if (cursor) {
      await videoCacheService.appendToFeed(tab, page.videos, page.nextCursor);
    } else {
      await videoCacheService.saveFeed(tab, page.videos, page.nextCursor);
    }
  }

  return page;
}

/**
 * Fetch first page only; used for prefetch. Skips cache to prioritize fresh API response.
 */
export async function prefetchVideoFeedFirstPage(
  tab: "rent" | "sale" | "landmarks",
  useAuth: boolean,
  lang: string = "en"
): Promise<VideoFeedPage> {
  return fetchVideoFeedPage({
    tab,
    limit: defaultLimit,
    lang,
    useAuth,
    skipCache: true
  });
}
