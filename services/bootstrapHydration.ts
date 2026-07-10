import type { QueryClient } from "@tanstack/react-query";
import {
  PROPERTY_SALE_FEED_FIELDS_CARD,
} from "../constants";
import {
  normalizePropertySaleItem,
  saleFeedFiltersKey,
} from "../hooks/queries/usePublicPropertySalesInfiniteQuery";
import { videoFeedQueryKey } from "./videoFeedQueryKey";
import { videoCacheService } from "./videoCache";
import type { BootstrapPayload } from "./bootstrapApi";
import { normalizeFeedVideoPage } from "../utils/normalizeFeedVideo";

function propertyListFromBootstrap(payload: BootstrapPayload): unknown[] {
  const ps = payload.propertySales;
  if (!ps) return [];
  if (Array.isArray(ps.items) && ps.items.length) return ps.items;
  if (Array.isArray(ps.properties) && ps.properties.length) return ps.properties;
  if (Array.isArray(ps.data) && ps.data.length) return ps.data;
  return [];
}

/** Hydrate React Query + local video cache from GET /bootstrap (one round trip). */
export function applyBootstrapPayload(
  queryClient: QueryClient,
  payload: BootstrapPayload,
  opts: {
    userId?: number;
    lang: string;
    feedQuality?: "high" | "low";
  },
): void {
  const lang = (opts.lang || "en").toLowerCase();
  const feedQuality = opts.feedQuality ?? "high";

  const saleVideos = payload.saleVideoFeed?.videos;
  if (Array.isArray(saleVideos) && saleVideos.length > 0) {
    const normalized = normalizeFeedVideoPage(saleVideos, "sale");
    const saleKey = videoFeedQueryKey({
      tab: "sale",
      userId: opts.userId,
      lang,
      feedQuality,
    });
    queryClient.setQueryData(saleKey, {
      pages: [
        {
          videos: normalized,
          nextCursor: payload.saleVideoFeed?.nextCursor ?? null,
          hasMore: payload.saleVideoFeed?.hasMore ?? false,
        },
      ],
      pageParams: [null],
    });
    void videoCacheService.saveFeed(
      "sale",
      normalized,
      payload.saleVideoFeed?.nextCursor ?? null,
    );
  }

  const rawProperties = propertyListFromBootstrap(payload);
  if (rawProperties.length > 0) {
    const items = rawProperties.map(normalizePropertySaleItem);
    const filtersKey = saleFeedFiltersKey({});
    queryClient.setQueryData(
      [
        "publicPropertySales",
        lang,
        filtersKey,
        PROPERTY_SALE_FEED_FIELDS_CARD,
        "gallery-v3",
      ],
      {
        pages: [
          {
            items,
            hasMore: payload.propertySales?.hasMore ?? false,
            page: 1,
          },
        ],
        pageParams: [1],
      },
    );
  }

  if (opts.userId && payload.user) {
    queryClient.setQueryData(["user", opts.userId], payload.user);
  }

  if (opts.userId && typeof payload.unreadMessages === "number") {
    queryClient.setQueryData(
      ["bootstrapUnreadMessages", opts.userId],
      payload.unreadMessages,
    );
  }
}
