import type { PropertySaleFormPayload } from "../services/propertySalePublish";
import type { ListingAiDraft } from "../types/listingAi";
import {
  isHttpMediaUrl,
  isValidMediaUri,
  resolveUploadedMediaUrl,
} from "./mediaUri";

export type ListingAiPublishMedia = {
  localImages?: string[];
  localVideo?: { uri: string; mimeType?: string } | null;
};

function resolvePublishImages(
  draft: ListingAiDraft,
  media?: ListingAiPublishMedia,
): string[] {
  const fromState = (media?.localImages ?? []).filter(isValidMediaUri).slice(0, 10);
  if (fromState.length) {
    return fromState.map((uri) =>
      isHttpMediaUrl(uri) ? resolveUploadedMediaUrl(uri) : uri,
    );
  }
  return (draft.image_urls ?? [])
    .filter(isValidMediaUri)
    .slice(0, 10)
    .map((uri) => (isHttpMediaUrl(uri) ? resolveUploadedMediaUrl(uri) : uri));
}

function resolvePublishVideo(
  draft: ListingAiDraft,
  media?: ListingAiPublishMedia,
): { uri: string; mimeType?: string } | null {
  if (media?.localVideo?.uri && isValidMediaUri(media.localVideo.uri)) {
    return media.localVideo;
  }
  const raw = (draft.video_urls ?? []).find(isValidMediaUri);
  if (!raw) return null;
  return {
    uri: isHttpMediaUrl(raw) ? resolveUploadedMediaUrl(raw) : raw,
  };
}

export function validateListingAiDraftForSalePublish(
  draft: ListingAiDraft,
  hasMedia: boolean,
): string | null {
  if (!String(draft.title || "").trim())
    return "listingAi.validation.titleRequired";
  if (!String(draft.description || "").trim())
    return "listingAi.validation.descriptionRequired";
  if (!hasMedia) return "listingAi.validation.mediaRequired";
  const price = Number(draft.price);
  if (!Number.isFinite(price) || price <= 0)
    return "listingAi.validation.priceInvalid";
  const area = Number(draft.area);
  if (!Number.isFinite(area) || area <= 0)
    return "listingAi.validation.areaInvalid";
  return null;
}

/** Maps AI review draft → publishPropertySale inputs (local or CDN media). */
export function listingAiDraftToPropertySalePublish(
  draft: ListingAiDraft,
  paperTypes: string[],
  skipPapers: boolean,
  media?: ListingAiPublishMedia,
): {
  form: PropertySaleFormPayload;
  images: string[];
  video: { uri: string; mimeType?: string } | null;
} {
  const cityName = String(draft.city_name || "").trim();
  const address =
    [draft.quartier_name, draft.zone_name, cityName].filter(Boolean).join(", ") ||
    cityName ||
    "Address";

  const imageUrls = resolvePublishImages(draft, media);
  const videoAsset = resolvePublishVideo(draft, media);

  return {
    form: {
      title: String(draft.title || "").trim(),
      description: String(draft.description || "").trim(),
      property_type: String(draft.property_type || "Apartment").trim() || "Apartment",
      price: Math.max(0, Math.round(Number(draft.price) || 0)),
      bedrooms: draft.bedrooms != null ? Math.max(0, draft.bedrooms) : null,
      bathrooms: draft.bathrooms != null ? Math.max(0, draft.bathrooms) : null,
      area: Math.max(1, Math.round(Number(draft.area) || 0)),
      year_built:
        draft.year_built != null && draft.year_built > 0
          ? draft.year_built
          : 0,
      city_id: draft.city_id ?? null,
      zone_id: draft.zone_id ?? null,
      quartier_id: draft.quartier_id ?? null,
      latitude: Number.isFinite(draft.latitude) ? draft.latitude! : 18.0735,
      longitude: Number.isFinite(draft.longitude) ? draft.longitude! : -15.9582,
      indoor_features: draft.indoor_features ?? [],
      outdoor_features: draft.outdoor_features ?? [],
      amenity_ids: draft.amenity_ids ?? [],
      paper_types: skipPapers ? [] : paperTypes,
      address,
      city: cityName,
      state: "-",
      country: "Mauritania",
    },
    images: imageUrls,
    video: videoAsset,
  };
}
