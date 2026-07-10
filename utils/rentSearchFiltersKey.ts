import { RENT_PRICE_FILTER_MAX } from "./formatMruPrice";

/**
 * Stable React Query key fragment for rent search (/properties/search).
 * Only includes fields that affect the API — avoids refetch on unrelated object churn.
 */
export function rentSearchFiltersKey(filters: unknown): string {
  const f = (filters || {}) as Record<string, any>;

  let listingType: string | null = null;
  const rawListing = f.listingType;
  if (
    rawListing &&
    String(rawListing).toLowerCase() !== "all" &&
    typeof rawListing === "string" &&
    rawListing.trim()
  ) {
    listingType = rawListing.trim().toLowerCase();
  }

  let propertyCategoryId: number | null = null;
  const rawCategory = f.propertyCategoryId;
  if (rawCategory != null && Number(rawCategory) > 0) {
    propertyCategoryId = Math.trunc(Number(rawCategory));
  }

  const rawType = f.propertyType;
  let legacyPropertyType: string | null = null;
  if (rawType && String(rawType).toLowerCase() !== "all") {
    const n = Number(rawType);
    if (Number.isFinite(n) && String(rawType).trim() !== "") {
      if (propertyCategoryId == null) propertyCategoryId = Math.trunc(n);
    } else if (typeof rawType === "string" && rawType.trim()) {
      legacyPropertyType = rawType.trim().toLowerCase();
      if (listingType == null) listingType = legacyPropertyType;
    }
  }

  const pr = f.priceRange;
  let minP: number | null = null;
  let maxP: number | null = null;
  if (Array.isArray(pr) && pr.length === 2) {
    const a = Number(pr[0]);
    const b = Number(pr[1]);
    if (isFinite(a) && a > 0) minP = Math.trunc(a);
    if (isFinite(b) && b < RENT_PRICE_FILTER_MAX) maxP = Math.trunc(b);
  }

  const rawCriteria: number[] = Array.isArray(f.locationCriteria)
    ? f.locationCriteria
        .map((id: unknown) => {
          const n =
            typeof id === "number" ? id : parseInt(String(id ?? ""), 10);
          return Number.isFinite(n) && n > 0 ? n : null;
        })
        .filter((id): id is number => id != null)
        .sort((a, b) => a - b)
    : [];

  return JSON.stringify({
    listingType,
    propertyCategoryId,
    legacyPropertyType,
    min_price: minP,
    max_price: maxP,
    bedrooms: f.bedrooms && Number(f.bedrooms) > 0 ? Number(f.bedrooms) : 0,
    bathrooms: f.bathrooms && Number(f.bathrooms) > 0 ? Number(f.bathrooms) : 0,
    country_id:
      f.country_id && Number(f.country_id) > 0 ? Number(f.country_id) : null,
    city_id: f.city_id && Number(f.city_id) > 0 ? Number(f.city_id) : null,
    zone_id: f.zone_id && Number(f.zone_id) > 0 ? Number(f.zone_id) : null,
    quartier_id:
      f.quartier_id && Number(f.quartier_id) > 0 ? Number(f.quartier_id) : null,
    locationCriteria: rawCriteria,
    amenities: Array.isArray(f.amenities)
      ? [...f.amenities].map(String).sort().join(",")
      : "",
    year_built:
      f.yearBuilt && String(f.yearBuilt) !== "any"
        ? parseInt(String(f.yearBuilt), 10) || null
        : null,
  });
}
