import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { RENT_PRICE_FILTER_MAX } from "../../utils/formatMruPrice";
import { rentSearchFiltersKey } from "../../utils/rentSearchFiltersKey";
import {
  filterPublicRentProperties,
  rentPublicSearchParams,
} from "../../utils/rentPropertyVisibility";

type SearchPropertiesPage = {
  items: any[];
  page: number;
  hasMore: boolean;
};

function extractPropertiesFromPayload(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const container = payload?.data ?? payload;
  const props =
    container?.properties ??
    container?.Properties ??
    (Array.isArray(container) ? container : []);
  return Array.isArray(props) ? props : [];
}

export function useSearchPropertiesInfiniteQuery(options: {
  enabled: boolean;
  lang: string;
  filters: any;
  polygonFilter: { latitude: number; longitude: number }[] | null;
  limit?: number;
}) {
  const { enabled, lang, filters, polygonFilter, limit = 20 } = options;

  const f = (filters || {}) as Record<string, any>;
  const pr = f.priceRange;
  const minP = Array.isArray(pr) ? Number(pr[0]) : 0;
  const maxP = Array.isArray(pr) ? Number(pr[1]) : RENT_PRICE_FILTER_MAX;
  const hasStructuredRentFilters = Boolean(
    f.city_id > 0 ||
      f.zone_id > 0 ||
      f.quartier_id > 0 ||
      f.country_id > 0 ||
      (Number.isFinite(minP) && minP > 0) ||
      (Number.isFinite(maxP) && maxP > 0 && maxP < RENT_PRICE_FILTER_MAX) ||
      (f.listingType && String(f.listingType).toLowerCase() !== "all") ||
      (f.propertyCategoryId != null && Number(f.propertyCategoryId) > 0) ||
      (f.propertyType && String(f.propertyType).toLowerCase() !== "all"),
  );

  const usePolygon = Array.isArray(polygonFilter) && polygonFilter.length >= 3;

  const stableKey = JSON.stringify({
    lang,
    filters: rentSearchFiltersKey(filters),
    polygon: usePolygon ? polygonFilter : null,
    limit,
  });

  return useInfiniteQuery<SearchPropertiesPage>({
    queryKey: ["searchProperties", stableKey],
    initialPageParam: 1,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async ({ pageParam, signal }) => {
      const page = pageParam as number;

      if (page > 1) {
        const apiFilters = buildApiFilters(filters);
        const params: any = {
          lang,
          page,
          limit,
          ...apiFilters,
          ...rentPublicSearchParams(),
        };
        const res = await api.get("/properties/search", { params, signal });
        const rawItems = Array.isArray(res.data) ? res.data : extractPropertiesFromPayload(res.data);
        const items = filterPublicRentProperties(rawItems);
        const hasMore = rawItems.length === limit;
        return { items, page, hasMore };
      }

      if (usePolygon) {
        const res = await api.post(
          "/properties/search-polygon",
          { polygon: polygonFilter },
          { params: { lang }, signal },
        );
        const items = filterPublicRentProperties(
          extractPropertiesFromPayload(res.data),
        );
        return { items, page: 1, hasMore: false };
      }

      const apiFilters = buildApiFilters(filters);
      const params: any = {
        lang,
        page: 1,
        limit,
        ...apiFilters,
        ...rentPublicSearchParams(),
      };
      const res = await api.get("/properties/search", { params, signal });
      const rawItems = Array.isArray(res.data) ? res.data : extractPropertiesFromPayload(res.data);
      const items = filterPublicRentProperties(rawItems);
      const hasMore = rawItems.length === limit;
      return { items, page: 1, hasMore };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    retry: 2,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 12_000),
  });
}

function buildApiFilters(filters: any): Record<string, any> {
  const out: Record<string, any> = {
    ...rentPublicSearchParams(),
  };
  if (!filters) return out;

  const listingType = filters.listingType;
  if (
    listingType &&
    String(listingType).toLowerCase() !== "all" &&
    typeof listingType === "string" &&
    listingType.trim()
  ) {
    out.type = listingType.trim();
  }

  const categoryId = filters.propertyCategoryId;
  if (categoryId != null && Number(categoryId) > 0) {
    const id = String(Math.trunc(Number(categoryId)));
    out.categoryId = id;
    out.property_category_id = id;
  }

  const rawType = filters.propertyType;
  if (rawType && rawType !== "all") {
    const n = Number(rawType);
    if (Number.isFinite(n) && String(rawType).trim() !== "") {
      out.categoryId = String(Math.trunc(n));
    } else if (typeof rawType === "string" && rawType.trim() && !out.type) {
      out.type = rawType.trim();
    }
  }

  const minPrice = Number(filters.priceRange?.[0] ?? 0);
  const maxPrice = Number(filters.priceRange?.[1] ?? RENT_PRICE_FILTER_MAX);
  if (isFinite(minPrice) && minPrice > 0) out.minPrice = Math.trunc(minPrice);
  if (isFinite(maxPrice) && maxPrice < RENT_PRICE_FILTER_MAX)
    out.maxPrice = Math.trunc(maxPrice);

  const beds = Number(filters.bedrooms ?? 0);
  if (isFinite(beds) && beds > 0) out.minBedrooms = Math.trunc(beds);
  const baths = Number(filters.bathrooms ?? 0);
  if (isFinite(baths) && baths > 0) out.minBathrooms = Math.trunc(baths);

  const loc = filters.location;
  if (loc && typeof loc === "string" && loc.trim() && loc !== "all") {
    out.city = loc.trim();
  }
  if (filters.amenities?.length) {
    out.amenities = filters.amenities.join(",");
  }
  if (filters.locationCriteria?.length) {
    out.locationCriteria = filters.locationCriteria.join(",");
  }
  const yb = Number((filters as any)?.yearBuilt);
  if (isFinite(yb) && yb > 0) out.minYearBuilt = Math.trunc(yb);

  if (filters.country_id != null && Number(filters.country_id) > 0) {
    out.country_id = Number(filters.country_id);
  }
  if (filters.city_id != null && Number(filters.city_id) > 0) {
    out.city_id = Number(filters.city_id);
  }
  if (filters.zone_id != null && Number(filters.zone_id) > 0) {
    out.zone_id = Number(filters.zone_id);
  }
  if (filters.quartier_id != null && Number(filters.quartier_id) > 0) {
    out.quartier_id = Number(filters.quartier_id);
  }

  return out;
}
