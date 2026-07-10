import type { RentDiscoveryQueryFilters } from "../hooks/queries/useLocationDiscovery";
import { RENT_PRICE_FILTER_MAX } from "./formatMruPrice";

/** Stable React Query key fragment for rent discovery fetches. */
export function rentDiscoveryFiltersKey(
  filters?: RentDiscoveryQueryFilters,
): string {
  const f = filters ?? {};
  const pt = f.propertyType;
  const propertyType =
    pt && String(pt).trim() !== "" && String(pt).toLowerCase() !== "all"
      ? String(pt).trim().toLowerCase()
      : null;
  return JSON.stringify({
    property_type: propertyType,
    property_category_id:
      f.propertyCategoryId != null && f.propertyCategoryId > 0
        ? f.propertyCategoryId
        : null,
    country_id: f.countryId != null && f.countryId > 0 ? f.countryId : null,
    city_id: f.cityId != null && f.cityId > 0 ? f.cityId : null,
    zone_id: f.zoneId != null && f.zoneId > 0 ? f.zoneId : null,
    quartier_id:
      f.quartierId != null && f.quartierId > 0 ? f.quartierId : null,
    min_price: f.minPrice != null && f.minPrice > 0 ? Math.trunc(f.minPrice) : null,
    max_price: f.maxPrice != null && f.maxPrice > 0 ? Math.trunc(f.maxPrice) : null,
  });
}

/** Map rent filter bar state → /properties/search filter shape. */
export function rentDiscoveryToSearchFilters(
  filters?: RentDiscoveryQueryFilters,
): Record<string, unknown> {
  const f = filters ?? {};
  const out: Record<string, unknown> = {
    propertyType: "all",
    priceRange: [0, RENT_PRICE_FILTER_MAX],
  };
  if (f.propertyType && String(f.propertyType).toLowerCase() !== "all") {
    out.listingType = f.propertyType;
  }
  if (f.propertyCategoryId != null && f.propertyCategoryId > 0) {
    out.propertyCategoryId = f.propertyCategoryId;
  }
  if (f.countryId != null && f.countryId > 0) out.country_id = f.countryId;
  if (f.cityId != null && f.cityId > 0) out.city_id = f.cityId;
  if (f.zoneId != null && f.zoneId > 0) out.zone_id = f.zoneId;
  if (f.quartierId != null && f.quartierId > 0) out.quartier_id = f.quartierId;
  const min = f.minPrice ?? 0;
  const max = f.maxPrice ?? RENT_PRICE_FILTER_MAX;
  out.priceRange = [
    min > 0 ? Math.trunc(min) : 0,
    max > 0 && max < RENT_PRICE_FILTER_MAX
      ? Math.trunc(max)
      : RENT_PRICE_FILTER_MAX,
  ];
  return out;
}
