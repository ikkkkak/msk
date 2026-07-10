import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { prefetchFeedListingImages } from "../../services/imagePrefetch";
import { flattenPropertySaleGalleryImages } from "../../utils/propertySaleGallery";
import {
  PROPERTY_SALE_FEED_FIELDS_CARD,
  PROPERTY_SALE_FEED_PAGE_LIMIT,
} from "../../constants";
import { SALE_PRICE_FILTER_MAX } from "../../utils/formatMruPrice";

/**
 * Property Sale Infinite Scroll - Modern Feed Architecture
 *
 * Implements automatic infinite scroll like Airbnb/Zillow:
 * - Initial fetch: 10 properties
 * - Auto-fetch next page when user scrolls near bottom
 * - Built-in duplicate prevention via normalized cache
 * - No manual "load more" button needed
 * - Preserves scroll position on filter changes
 *
 * BACKEND API CONTRACT (GET /property-sales/public):
 * - Params: lang, page (1-based), limit (10), filters...
 * - Response: { data|properties: [...], hasMore: boolean, meta: {...} }
 */
/** @deprecated Use PROPERTY_SALE_FEED_PAGE_LIMIT from constants */
export const PROPERTY_SALE_PAGE_LIMIT = PROPERTY_SALE_FEED_PAGE_LIMIT;

/**
 * Stable key fragment for React Query + PropertySaleList session.
 * Only fields that change GET /property-sales/public params belong here
 * (client-only filters like location string / propertyType are omitted).
 */
export function saleFeedFiltersKey(filters: unknown): string {
  const f = (filters || {}) as Record<string, any>;
  let yearKey: number | null = null;
  const yearBuilt = f.yearBuilt;
  if (
    yearBuilt &&
    String(yearBuilt).trim() !== "" &&
    String(yearBuilt).trim() !== "any"
  ) {
    const y = parseInt(String(yearBuilt).trim(), 10);
    if (!isNaN(y) && y > 0) yearKey = y;
  }
  let minP: number | null = null;
  let maxP: number | null = null;
  const salePriceRange = f.salePriceRange;
  if (
    salePriceRange &&
    Array.isArray(salePriceRange) &&
    salePriceRange.length === 2
  ) {
    const minPrice = Number(salePriceRange[0]);
    const maxPrice = Number(salePriceRange[1]);
    if (isFinite(minPrice) && minPrice > 0) minP = Math.trunc(minPrice);
    if (isFinite(maxPrice) && maxPrice < SALE_PRICE_FILTER_MAX)
      maxP = Math.trunc(maxPrice);
  }
  const pt = f.propertyType;
  const propertyType =
    pt && String(pt).trim() !== "" && String(pt).toLowerCase() !== "all"
      ? String(pt).trim().toLowerCase()
      : null;
  return JSON.stringify({
    property_type: propertyType,
    bedrooms: f.bedrooms && Number(f.bedrooms) > 0 ? Number(f.bedrooms) : 0,
    bathrooms: f.bathrooms && Number(f.bathrooms) > 0 ? Number(f.bathrooms) : 0,
    year_built: yearKey,
    country_id: f.country_id ? Number(f.country_id) : null,
    city_id: f.city_id ? Number(f.city_id) : null,
    zone_id: f.zone_id ? Number(f.zone_id) : null,
    minArea:
      f.minArea !== undefined && f.minArea !== null && Number(f.minArea) > 0
        ? Number(f.minArea)
        : null,
    maxArea:
      f.maxArea !== undefined && f.maxArea !== null && Number(f.maxArea) > 0
        ? Number(f.maxArea)
        : null,
    quartier_id:
      f.quartier_id && Number(f.quartier_id) > 0 ? Number(f.quartier_id) : null,
    min_price: minP,
    max_price: maxP,
    investment_opportunity: f.investmentOnly === true ? true : null,
  });
}

/** Expected backend response shape */
export type PropertySalesPage = {
  items: any[];
  hasMore: boolean;
  page: number;
};

export function normalizePropertySaleItem(it: any) {
  const rawId = it.id ?? it.ID ?? it.Id ?? it._id;
  const id = Number(rawId);
  const price = it.listing_price ?? it.price ?? it.amount;

  // Extract images from main gallery + classified room photos
  const images = flattenPropertySaleGalleryImages(it);

  const location =
    it.location ??
    it.coordinates ??
    (it.lat && it.lng ? { latitude: it.lat, longitude: it.lng } : undefined);

  // Flatten coordinates for MapPropertySale
  const latitude = location?.latitude ?? it.latitude ?? it.lat;
  const longitude = location?.longitude ?? it.longitude ?? it.lng;

  const bedrooms = it.bedrooms ?? it.Bedrooms;
  const bathrooms = it.bathrooms ?? it.Bathrooms;
  const square_footage = it.square_footage ?? it.area ?? it.size;
  const title = it.title ?? it.name ?? it.headline ?? "";
  const address = it.address ?? it.street ?? it.streetAddress ?? "";

  return {
    ...it,
    id,
    listing_price: price,
    price,
    images,
    location,
    latitude,
    longitude,
    bedrooms,
    bathrooms,
    square_footage,
    address,
    title
  };
}

function extractItems(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    console.log("[extractItems] Got array directly, length:", payload.length);
    return payload;
  }
  if (Array.isArray(payload?.properties)) {
    console.log(
      "[extractItems] Got from .properties, length:",
      payload.properties.length
    );
    return payload.properties;
  }
  if (Array.isArray(payload?.data)) {
    console.log("[extractItems] Got from .data, length:", payload.data.length);
    return payload.data;
  }
  if (Array.isArray(payload?.items)) {
    console.log(
      "[extractItems] Got from .items, length:",
      payload.items.length
    );
    return payload.items;
  }
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.payload)) return payload.payload;
  if (Array.isArray(payload?.videos)) return payload.videos;
  return [];
}

export function usePublicPropertySalesInfiniteQuery(options: {
  enabled: boolean;
  lang: string;
  filters: any;
  limit?: number;
}) {
  const { enabled, lang, filters, limit = PROPERTY_SALE_FEED_PAGE_LIMIT } = options;

  const stableFiltersKey = saleFeedFiltersKey(filters);

  return useInfiniteQuery<PropertySalesPage>({
    // Stable key: reuse cache across remounts (tab switches). A random mount nonce
    // forced a cold fetch every time → long skeletons + false "failed" perception.
    queryKey: ["publicPropertySales", lang, stableFiltersKey, PROPERTY_SALE_FEED_FIELDS_CARD, "gallery-v3"],
    initialPageParam: 1,
    enabled,

    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Fewer retries than a short-timeout loop — each attempt uses a long timeout below.
    retry: 2,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 15_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    // Keep prior page visible while filter key changes — no empty flash between requests.
    placeholderData: (previousData) => previousData,

    // Main query function
    queryFn: async ({ pageParam, signal }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;

      const params: any = {
        lang,
        page,
        limit: Math.max(1, Math.min(limit || PROPERTY_SALE_FEED_PAGE_LIMIT, 50)), // Clamp 1-50
        // Newest DB rows first; gold is not pinned to the top of the feed.
        feed_mode: "legacy",
        fields: PROPERTY_SALE_FEED_FIELDS_CARD,
      };

      console.log(
        `[publicPropertySales] FETCH page=${page} feed_mode=${params.feed_mode} limit=${params.limit} t=${Date.now()}`
      );

      // Apply filters
      const f = filters || {};

      if (f.bedrooms && Number(f.bedrooms) > 0)
        params.bedrooms = Number(f.bedrooms);
      if (f.bathrooms && Number(f.bathrooms) > 0)
        params.bathrooms = Number(f.bathrooms);

      const yearBuilt = (f as any).yearBuilt;
      if (
        yearBuilt &&
        String(yearBuilt).trim() !== "" &&
        String(yearBuilt).trim() !== "any"
      ) {
        const yearNum = parseInt(String(yearBuilt).trim(), 10);
        if (!isNaN(yearNum) && yearNum > 0) params.year_built = yearNum;
      }

      if (f.country_id && Number(f.country_id) > 0)
        params.country_id = Number(f.country_id);
      if (f.city_id) params.city_id = f.city_id;
      if (f.zone_id) params.zone_id = f.zone_id;

      const minArea = (f as any).minArea;
      const maxArea = (f as any).maxArea;
      if (minArea !== undefined && minArea !== null && Number(minArea) > 0)
        params.min_area = Number(minArea);
      if (maxArea !== undefined && maxArea !== null && Number(maxArea) > 0)
        params.max_area = Number(maxArea);

      if (f.quartier_id && Number(f.quartier_id) > 0)
        params.quartier_id = f.quartier_id;

      const salePriceRange = (f as any).salePriceRange;
      if (
        salePriceRange &&
        Array.isArray(salePriceRange) &&
        salePriceRange.length === 2
      ) {
        const minPrice = Number(salePriceRange[0]);
        const maxPrice = Number(salePriceRange[1]);
        if (isFinite(minPrice) && minPrice > 0)
          params.min_price = Math.trunc(minPrice);
        if (isFinite(maxPrice) && maxPrice < SALE_PRICE_FILTER_MAX)
          params.max_price = Math.trunc(maxPrice);
      }

      if ((f as { investmentOnly?: boolean }).investmentOnly === true) {
        params.investment_opportunity = "true";
      }

      const propertyType = (f as { propertyType?: string }).propertyType;
      if (
        propertyType &&
        String(propertyType).trim() !== "" &&
        String(propertyType).toLowerCase() !== "all"
      ) {
        params.property_type = String(propertyType).trim();
      }

      // Default axios timeout is 8s (see services/api.ts). Smart-feed + DB often needs longer;
      // without this, mobile sees ~20s of skeleton then "Something went wrong" (timeouts × retries).
      const res = await api.get("/property-sales/public", {
        params,
        signal,
        timeout: 90_000,
      });

      // Extract items from response
      const rawItems = extractItems(res.data);
      const items = rawItems.map(normalizePropertySaleItem);

      if (items.length > 0) {
        prefetchFeedListingImages(items);
      }

      if (items.length > 0) {
        console.log(
          `[publicPropertySales] page=${page} response head ids:`,
          items.slice(0, 10).map((it: any) => it.id)
        );
      } else {
        console.log(`[publicPropertySales] page=${page} response empty`);
      }

      // Log first item structure for debugging
      if (items.length > 0) {
        const firstItem = items[0];
        console.log(
          `[🔍 Page ${page}] First item ID: ${firstItem.id}, Has ${firstItem.images?.length || 0} images, Title: ${firstItem.title}`
        );
      }

      // Determine if more pages exist - check multiple locations
      let hasMore = false;
      if (typeof res.data?.hasMore === "boolean") {
        hasMore = res.data.hasMore;
      } else if (res.data?.meta?.total) {
        // Calculate from total count and current position
        const totalItems = res.data.meta.total;
        const currentItems = (page - 1) * params.limit + items.length;
        hasMore = currentItems < totalItems;
      } else {
        // Fallback: if we got a full page, probably more exists
        hasMore = items.length >= params.limit;
      }

      console.log(
        `[∞ Page ${page}] Items: ${items.length}, HasMore: ${hasMore}, Total: ${res.data?.meta?.total || "?"}`
      );

      return { items, hasMore, page };
    },

    // Auto-pagination: when to fetch next page
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },

  });
}
