import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";

export type ListingGuidePreview = {
  id: number;
  propertySaleId: number;
  diagnosis: string;
  severity: "info" | "action" | "urgent";
  status: string;
  category: string;
  triggerEvent: string;
  locale?: string;
};

export type GuideCategoryGroup = {
  category: string;
  count: number;
  comments: GuideComment[];
};

export type GuideComment = {
  id: number;
  propertySaleId?: number;
  hostId: number;
  parentId?: number;
  triggerEvent: string;
  severity: "info" | "action" | "urgent";
  category: string;
  tone: string;
  diagnosis: string;
  rootCause: string;
  prescription: string;
  impactForecast: string;
  algorithmSignals?: Record<string, unknown>;
  status: "unread" | "read" | "implemented" | "dismissed" | "resolved";
  hostAction?: string | null;
  body?: string;
  createdAt: string;
  propertySale?: { id: number; title?: string; city?: string };
  replies?: GuideComment[];
};

export const GUIDE_FEED_KEY = ["meskeny-guide-feed"] as const;
export const GUIDE_LISTING_KEY = (id: number) =>
  ["meskeny-guide-listing", id] as const;
export const GUIDE_UNREAD_KEY = ["meskeny-guide-unread"] as const;
export const GUIDE_PREVIEWS_KEY = ["meskeny-guide-previews"] as const;
export const GUIDE_GROUPED_KEY = ["meskeny-guide-grouped"] as const;

/** React Query persistence turns Map into a plain object — always normalize before use. */
export function normalizeGuidePreviewsMap(
  data: unknown,
): Map<number, ListingGuidePreview> {
  const map = new Map<number, ListingGuidePreview>();
  if (!data) return map;
  if (data instanceof Map) {
    data.forEach((v, k) => {
      const id = Number(k);
      if (!Number.isNaN(id) && v) map.set(id, v);
    });
    return map;
  }
  if (typeof data === "object") {
    Object.entries(data as Record<string, ListingGuidePreview>).forEach(
      ([k, v]) => {
        const id = Number(k);
        if (!Number.isNaN(id) && v) map.set(id, v);
      },
    );
  }
  return map;
}

export function useListingGuidePreviews(
  listingIds: number[],
  enabled = true,
) {
  const ids = [...new Set(listingIds.filter((id) => id > 0))].sort(
    (a, b) => a - b,
  );
  return useQuery({
    queryKey: [...GUIDE_PREVIEWS_KEY, ids.join(",")],
    enabled: enabled && ids.length > 0,
    queryFn: async () => {
      const res = await api.get(endpoints.guideListingPreviews(ids));
      const raw = res.data?.previews ?? {};
      const map = new Map<number, ListingGuidePreview>();
      Object.entries(raw).forEach(([k, v]) => {
        const id = Number(k);
        if (!Number.isNaN(id) && v) map.set(id, v as ListingGuidePreview);
      });
      return map;
    },
    select: normalizeGuidePreviewsMap,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useGuideGrouped(enabled = true) {
  return useQuery({
    queryKey: GUIDE_GROUPED_KEY,
    enabled,
    queryFn: async () => {
      const res = await api.get(endpoints.guideGrouped, {
        params: { limit: 8 },
      });
      return res.data as { groups: GuideCategoryGroup[] };
    },
    staleTime: 60_000,
  });
}

export function useGuideFeed(params?: {
  page?: number;
  severity?: string;
  needsAction?: boolean;
  listingId?: number;
}) {
  return useQuery({
    queryKey: [...GUIDE_FEED_KEY, params],
    queryFn: async () => {
      const res = await api.get(endpoints.guideFeed, {
        params: {
          page: params?.page ?? 1,
          limit: 20,
          severity: params?.severity,
          listing_id: params?.listingId,
          needs_action: params?.needsAction ? "1" : undefined,
          sort: params?.needsAction ? "needs_action" : "newest",
        },
      });
      return res.data as {
        comments: GuideComment[];
        total: number;
        page: number;
      };
    },
  });
}

export function useListingGuideComments(
  propertySaleId: number,
  highlightId?: number,
) {
  return useQuery({
    queryKey: [...GUIDE_LISTING_KEY(propertySaleId), highlightId],
    enabled: propertySaleId > 0,
    queryFn: async () => {
      const res = await api.get(
        endpoints.guideListingComments(propertySaleId),
        { params: highlightId ? { highlight: highlightId } : undefined },
      );
      return res.data as {
        comments: GuideComment[];
        highlightId?: number;
      };
    },
  });
}

export function useGuideComment(commentId: number | null) {
  return useQuery({
    queryKey: ["meskeny-guide-comment", commentId],
    enabled: !!commentId && commentId > 0,
    queryFn: async () => {
      const res = await api.get(endpoints.guideComment(commentId!));
      return res.data?.comment as GuideComment;
    },
  });
}

export function useGuideUnreadCount(enabled = true) {
  return useQuery({
    queryKey: GUIDE_UNREAD_KEY,
    enabled,
    queryFn: async () => {
      const res = await api.get(endpoints.guideUnreadCount);
      return (res.data?.count ?? 0) as number;
    },
    staleTime: 60_000,
  });
}

function invalidateGuide(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: GUIDE_FEED_KEY });
  qc.invalidateQueries({ queryKey: GUIDE_UNREAD_KEY });
  qc.invalidateQueries({ queryKey: GUIDE_PREVIEWS_KEY });
  qc.invalidateQueries({ queryKey: GUIDE_GROUPED_KEY });
  qc.invalidateQueries({ queryKey: ["meskeny-guide-listing"] });
  qc.invalidateQueries({ queryKey: ["meskeny-guide-comment"] });
}

export function useImplementGuideComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      await api.post(endpoints.guideImplement(commentId));
    },
    onSuccess: () => invalidateGuide(qc),
  });
}

export function useDismissGuideComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      await api.post(endpoints.guideDismiss(commentId));
    },
    onSuccess: () => invalidateGuide(qc),
  });
}

export function useReplyGuideComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      body,
    }: {
      commentId: number;
      body: string;
    }) => {
      const res = await api.post(endpoints.guideReply(commentId), { body });
      return res.data?.reply as GuideComment;
    },
    onSuccess: () => invalidateGuide(qc),
  });
}
