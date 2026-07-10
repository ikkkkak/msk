import type { ListingAiDraft } from "../types/listingAi";
import { normalizeMediaUrlList } from "./mediaUri";
import { resolveRentUnitType } from "./rentListingTypes";

export function validateListingAiDraftForRentPublish(
  draft: ListingAiDraft,
  hasMedia: boolean,
): string | null {
  if (!String(draft.title || "").trim())
    return "listingAi.validation.titleRequired";
  if (!String(draft.description || "").trim())
    return "listingAi.validation.descriptionRequired";
  if (!hasMedia) return "listingAi.validation.mediaPhotoRequired";
  const price = Number(draft.nightly_price ?? draft.price);
  if (!Number.isFinite(price) || price <= 0)
    return "listingAi.validation.nightlyPriceInvalid";
  return null;
}

/** Maps AI review draft → POST /property body (media already on CDN). */
export function listingAiDraftToRentPayload(
  draft: ListingAiDraft,
  hostId: number,
): Record<string, unknown> {
  const cityName = String(draft.city_name || "").trim() || "Nouakchott";
  const address =
    [draft.quartier_name, draft.zone_name, cityName].filter(Boolean).join(", ") ||
    cityName;

  const nightly = Math.round(
    Number(draft.nightly_price ?? draft.price ?? 0) || 0,
  );
  const images = normalizeMediaUrlList(draft.image_urls ?? []);
  const amenityIds = (draft.amenity_ids ?? []).map((id) => String(id));
  const categoryId = Number(draft.property_category_id ?? 0) || 0;

  return {
    hostID: hostId,
    title: String(draft.title || "").trim() || "Rental listing",
    description: String(draft.description || "").trim(),
    propertyType: resolveRentUnitType(draft.property_type),
    addressLine1: address,
    addressLine2: "",
    city: cityName,
    state: cityName,
    zip: "00000",
    country: "Mauritania",
    ...(draft.city_id && draft.city_id > 0 ? { city_id: draft.city_id } : {}),
    ...(draft.zone_id && draft.zone_id > 0 ? { zone_id: draft.zone_id } : {}),
    ...(draft.quartier_id && draft.quartier_id > 0
      ? { quartier_id: draft.quartier_id }
      : {}),
    lat: Number.isFinite(draft.latitude) ? draft.latitude : 18.0463,
    lng: Number.isFinite(draft.longitude) ? draft.longitude : -15.9654,
    capacity: Math.max(1, draft.bedrooms ?? 1),
    bedrooms: Math.max(1, draft.bedrooms ?? 1),
    beds: Math.max(1, draft.bedrooms ?? 1),
    bathrooms: Math.max(1, draft.bathrooms ?? 1),
    nightlyPrice: nightly,
    cleaningFee: 0,
    serviceFee: 0,
    currency: "MRU",
    amenities: amenityIds,
    houseRules: "",
    cancellationPolicy: "flexible",
    images,
    isActive: true,
    bookingMode: "manual",
    neighborhoodDescription: String(draft.neighborhood_description || "").trim(),
    nearbyAttractions: [],
    checkInTime: "15:00",
    checkOutTime: "11:00",
    ...(categoryId > 0 ? { propertyCategoryId: categoryId } : {}),
  };
}
