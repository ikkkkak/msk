/**
 * usePropertiesInfinite.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom hook for infinite-scroll property queries using TanStack Query.
 *
 * Features:
 * • useInfiniteQuery for cursor/page-based pagination
 * • Automatic background refetching (staleTime: 5 minutes)
 * • AsyncStorage persistence (works offline)
 * • Deduplication of in-flight requests
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import {
  endpoints,
  PROPERTY_SALE_FEED_FIELDS_CARD,
  PROPERTY_SALE_FEED_PAGE_LIMIT,
} from "../constants";

export interface PropertySaleItem {
  id: number;
  title: string;
  city?: string;
  state?: string;
  country?: string;
  listing_price?: number;
  price?: number;
  images?: string[];
  organization?: {
    banner_image?: string;
    name?: string;
    logo?: string;
    logoURL?: string;
    phone?: string;
    website?: string;
  };
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  area?: number;
  address?: string;
  amenities?: string[];
  property_type?: string;
  year_built?: number;
  description?: string;
  videos?: string[];
  video_url?: string;
  videoUrl?: string;
  video?: string;
  /** Sale listing marked sold by host — feed may still show for social proof. */
  is_sold?: boolean;
  updated_at?: string;
}

interface ApiPageResponse {
  items?: PropertySaleItem[];
  data?: PropertySaleItem[];
  properties?: PropertySaleItem[];
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string | number | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface UsePropertiesOptions {
  fetchUrl?: string;
  limit?: number;
  enabled?: boolean;
}

export interface PageData {
  items: PropertySaleItem[];
  page: number;
  total: number;
  hasMore: boolean;
}

/**
 * Custom hook for fetching properties with infinite scroll pagination
 *
 * @param options - Configuration options
 * @returns Query state and methods (data, fetchNextPage, refetch, hasNextPage, etc.)
 */
export function usePropertiesInfinite(options: UsePropertiesOptions = {}) {
  const {
    fetchUrl = "/property-sales/public",
    limit = PROPERTY_SALE_FEED_PAGE_LIMIT,
    enabled = true
  } = options;

  return useInfiniteQuery<
    PageData,
    Error,
    InfiniteData<PageData, number>,
    (string | number)[],
    number
  >({
    queryKey: ["properties", fetchUrl, limit, PROPERTY_SALE_FEED_FIELDS_CARD] as (
      | string
      | number
    )[],
    queryFn: async ({ pageParam = 1 }) => {
      // Build full URL with page-based pagination
      const fullUrl = fetchUrl.startsWith("http")
        ? fetchUrl
        : `${endpoints.baseURL}${fetchUrl}`;

      const url = new URL(fullUrl);
      url.searchParams.set("page", String(pageParam));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("fields", PROPERTY_SALE_FEED_FIELDS_CARD);
      url.searchParams.set("feed_mode", "legacy");

      console.log(`📡 Fetching page ${pageParam} from:`, url.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiPageResponse = await response.json();

      // Extract items from any response format
      const items: PropertySaleItem[] =
        json.items ?? json.data ?? json.properties ?? [];

      console.log(`✅ Page ${pageParam} loaded:`, {
        itemsCount: items.length,
        total: json.total,
        hasMore: json.hasMore,
        nextPage: (json.page ?? pageParam) + 1
      });

      return {
        items,
        page: json.page ?? pageParam,
        total: json.total ?? items.length,
        hasMore: json.hasMore ?? items.length === limit
      };
    },

    // Determine next page parameter
    getNextPageParam: (lastPage: PageData, pages) => {
      // If no more items, don't fetch next page
      if (!lastPage.hasMore) {
        return undefined;
      }
      // Next page number
      return pages.length + 1;
    },

    // Initial page
    initialPageParam: 1,

    // Cache configuration
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    // Only run if enabled
    enabled
  });
}
