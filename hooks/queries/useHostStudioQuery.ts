import {
  useQuery,
  type QueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";
import { isHostStudioAuthError } from "../../components/host-studio/hostStudioAuth";

/** Stable query key — use for prefetch / invalidation. */
export const HOST_STUDIO_QUERY_KEY = ["host-studio"] as const;

/** Background refresh while Host Dashboard is focused (ms). */
export const HOST_STUDIO_LIVE_INTERVAL_MS = 30_000;

/** Data considered fresh for this long; live hook still polls when focused. */
export const HOST_STUDIO_STALE_MS = 15_000;

export type HostStudioTrend = {
  days: string[];
  views: number[];
  saves: number[];
  likes: number[];
};

export type HostStudioMetrics = {
  views: number;
  saves: number;
  likes: number;
  comments?: number;
  reservations?: number;
};

export type HostStudioListing = {
  kind: "rent" | "sale";
  id: number;
  title: string;
  city: string;
  status: string;
  image_url: string;
  metrics: HostStudioMetrics;
  trend: HostStudioTrend;
};

export type HostStudioVideo = {
  kind: "rent" | "sale";
  id: number;
  property_id?: number;
  property_sale_id?: number;
  listing_title: string;
  caption: string;
  video_url: string;
  thumbnail_url: string;
  status?: string;
  duration_sec?: number;
  created_at?: string;
  metrics: HostStudioMetrics;
};

export type HostStudioVideoSummary = {
  rent_count: number;
  sale_count: number;
  rent_views: number;
  rent_likes: number;
  sale_views: number;
  sale_likes: number;
  total_views: number;
  total_likes: number;
  total_videos: number;
};

function num(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function normalizeMetrics(raw: unknown): HostStudioMetrics {
  const m = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    views: num(m.views ?? m.view_count),
    saves: num(m.saves ?? m.saves_count),
    likes: num(m.likes ?? m.likes_count),
    comments: num(m.comments ?? m.comments_count),
    reservations: num(m.reservations),
  };
}

function normalizeTrend(raw: unknown): HostStudioTrend {
  const t = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const toNums = (arr: unknown) =>
    Array.isArray(arr) ? arr.map((v) => num(v)) : [];
  return {
    days: Array.isArray(t.days) ? t.days.map(String) : [],
    views: toNums(t.views),
    saves: toNums(t.saves),
    likes: toNums(t.likes),
  };
}

export const EMPTY_HOST_STUDIO_SUMMARY: HostStudioData["summary"] = {
  active_listings: 0,
  total_views: 0,
  total_saves: 0,
  total_likes: 0,
  pending_reservations: 0,
  trend: { days: [], views: [] },
};

function normalizeSummary(raw: unknown): HostStudioData["summary"] {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const trend = normalizeTrend(s.trend);
  return {
    active_listings: num(s.active_listings),
    total_views: num(s.total_views),
    total_saves: num(s.total_saves),
    total_likes: num(s.total_likes),
    pending_reservations: num(s.pending_reservations),
    trend: {
      days: trend.days,
      views: trend.views,
    },
  };
}

function normalizeListing(raw: Record<string, unknown>): HostStudioListing {
  return {
    kind: (raw.kind as HostStudioListing["kind"]) ?? "rent",
    id: num(raw.id),
    title: String(raw.title ?? ""),
    city: String(raw.city ?? ""),
    status: String(raw.status ?? ""),
    image_url: String(raw.image_url ?? raw.imageUrl ?? ""),
    metrics: normalizeMetrics(raw.metrics),
    trend: normalizeTrend(raw.trend),
  };
}

function normalizeStudioVideo(raw: Record<string, unknown>): HostStudioVideo {
  return {
    kind: (raw.kind as HostStudioVideo["kind"]) ?? "rent",
    id: num(raw.id),
    property_id: raw.property_id != null ? num(raw.property_id) : undefined,
    property_sale_id:
      raw.property_sale_id != null ? num(raw.property_sale_id) : undefined,
    listing_title: String(raw.listing_title ?? raw.listingTitle ?? ""),
    caption: String(raw.caption ?? ""),
    video_url: String(raw.video_url ?? raw.videoURL ?? ""),
    thumbnail_url: String(raw.thumbnail_url ?? raw.thumbnailURL ?? ""),
    status: raw.status != null ? String(raw.status) : undefined,
    duration_sec: raw.duration_sec != null ? num(raw.duration_sec) : undefined,
    created_at:
      raw.created_at != null ? String(raw.created_at) : undefined,
    metrics: normalizeMetrics(raw.metrics),
  };
}

function normalizeVideoSummary(raw: unknown): HostStudioVideoSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  return {
    rent_count: num(s.rent_count),
    sale_count: num(s.sale_count),
    rent_views: num(s.rent_views),
    rent_likes: num(s.rent_likes),
    sale_views: num(s.sale_views),
    sale_likes: num(s.sale_likes),
    total_views: num(s.total_views),
    total_likes: num(s.total_likes),
    total_videos: num(s.total_videos),
  };
}

function parseHostStudioPayload(body: unknown): HostStudioData {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid host studio response");
  }
  const root = body as Record<string, unknown>;
  if (root.error) {
    throw new Error(String(root.error));
  }
  const payload = (root.data ?? root) as Record<string, unknown>;
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing host studio data");
  }
  if (payload.error) {
    throw new Error(String(payload.error));
  }

  return {
    summary: normalizeSummary(payload.summary),
    listings: Array.isArray(payload.listings)
      ? payload.listings.map((row) =>
          normalizeListing(row as Record<string, unknown>),
        )
      : [],
    videos: Array.isArray(payload.videos)
      ? payload.videos.map((row) =>
          normalizeStudioVideo(row as Record<string, unknown>),
        )
      : [],
    video_summary: normalizeVideoSummary(payload.video_summary),
    broker_verification: (payload.broker_verification &&
    typeof payload.broker_verification === "object"
      ? payload.broker_verification
      : undefined) as HostStudioBrokerVerification | undefined,
  };
}

export type HostStudioBrokerVerification = {
  status: string;
  broker_id?: string;
  is_verified?: boolean;
  expected_views_boost_pct?: number;
  estimated_monthly_leads_mru?: number;
};

export type HostStudioData = {
  summary: {
    active_listings: number;
    total_views: number;
    total_saves: number;
    total_likes: number;
    pending_reservations: number;
    trend: { days: string[]; views: number[] };
  };
  listings: HostStudioListing[];
  videos: HostStudioVideo[];
  video_summary?: HostStudioVideoSummary;
  broker_verification?: HostStudioBrokerVerification;
};

export { isHostStudioAuthError, getHostStudioErrorMessage } from "../../components/host-studio/hostStudioAuth";

export async function fetchHostStudio(): Promise<HostStudioData> {
  const res = await api.get(`${endpoints.baseURL}/host/studio`, {
    timeout: 20_000,
  });
  return parseHostStudioPayload(res.data);
}

export function invalidateHostStudio(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: HOST_STUDIO_QUERY_KEY });
}

export function useHostStudioQuery(
  enabled = true,
  options?: { refetchInterval?: number | false },
): UseQueryResult<HostStudioData, Error> {
  return useQuery({
    queryKey: HOST_STUDIO_QUERY_KEY,
    queryFn: fetchHostStudio,
    enabled,
    staleTime: HOST_STUDIO_STALE_MS,
    gcTime: 1000 * 60 * 30,
    placeholderData: (previousData) => previousData,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchInterval: options?.refetchInterval ?? false,
    retry: (failureCount, error) => {
      if (isHostStudioAuthError(error)) return false;
      return failureCount < 2;
    },
  });
}
