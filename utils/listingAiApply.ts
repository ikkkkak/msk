import type { ListingAiDraft } from "../types/listingAi";

/** Apply AI draft to rent listing Formik fields. */
export function applyRentListingDraft(
  draft: ListingAiDraft,
  setFieldValue: (field: string, value: unknown) => void,
  setSelectedCityId: (id: number) => void,
  setSelectedZoneId: (id: number) => void,
) {
  setFieldValue("title", draft.title || "");
  setFieldValue("description", draft.description || "");
  if (draft.nightly_price && draft.nightly_price > 0) {
    setFieldValue("price", String(Math.round(draft.nightly_price)));
  } else if (draft.price && draft.price > 0) {
    setFieldValue("price", String(Math.round(draft.price)));
  }
  if (draft.area && draft.area > 0) {
    setFieldValue("area", String(draft.area));
    if (draft.area_unit) setFieldValue("areaUnit", draft.area_unit);
  }
  if (draft.city_id) {
    setSelectedCityId(draft.city_id);
    setFieldValue("city_id", draft.city_id);
  }
  if (draft.city_name) setFieldValue("city", draft.city_name);
  if (draft.zone_id) {
    setSelectedZoneId(draft.zone_id);
    setFieldValue("zone_id", draft.zone_id);
  }
  if (draft.zone_name) setFieldValue("zone", draft.zone_name);
  if (draft.quartier_id) setFieldValue("quartier_id", draft.quartier_id);
  if (draft.quartier_name) setFieldValue("quartier", draft.quartier_name);
  if (draft.neighborhood_description) {
    setFieldValue("neighborhoodDescription", draft.neighborhood_description);
  }
  if (draft.latitude) setFieldValue("lat", String(draft.latitude));
  if (draft.longitude) setFieldValue("lng", String(draft.longitude));
  if (draft.image_urls?.length) {
    setFieldValue("images", draft.image_urls);
  }
  if (draft.property_category_id && draft.property_category_id > 0) {
    setFieldValue("landCategoryId", draft.property_category_id);
  }
  if (draft.amenity_ids?.length) {
    setFieldValue("amenities", draft.amenity_ids);
  }
}

/** Apply AI draft to property sale form state. */
export function applySaleListingDraft(
  draft: ListingAiDraft,
  setFormData: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void,
  setImages: (urls: string[]) => void,
  setMapRegion?: (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void,
) {
  setFormData((prev) => ({
    ...prev,
    title: draft.title || prev.title,
    description: draft.description || prev.description,
    price: draft.price ? String(Math.round(draft.price)) : prev.price,
    bedrooms: draft.bedrooms != null ? String(draft.bedrooms) : prev.bedrooms,
    bathrooms:
      draft.bathrooms != null ? String(draft.bathrooms) : prev.bathrooms,
    area: draft.area ? String(draft.area) : prev.area,
    city_id: draft.city_id ?? prev.city_id,
    zone_id: draft.zone_id ?? prev.zone_id,
    quartier_id: draft.quartier_id ?? prev.quartier_id,
    property_type: draft.property_type || prev.property_type,
    year_built:
      draft.year_built != null && draft.year_built > 0
        ? String(draft.year_built)
        : prev.year_built,
    latitude: draft.latitude ?? prev.latitude,
    longitude: draft.longitude ?? prev.longitude,
    indoor_features: draft.indoor_features?.length
      ? draft.indoor_features
      : prev.indoor_features,
    outdoor_features: draft.outdoor_features?.length
      ? draft.outdoor_features
      : prev.outdoor_features,
    amenity_ids: draft.amenity_ids?.length
      ? draft.amenity_ids
      : prev.amenity_ids,
  }));
  if (draft.image_urls?.length) setImages(draft.image_urls);
  if (draft.latitude && draft.longitude && setMapRegion) {
    setMapRegion({
      latitude: draft.latitude,
      longitude: draft.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }
}

export type LandmarkAiSetters = {
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setArea: (v: string) => void;
  setPrice: (v: string) => void;
  setLandType: (v: string) => void;
  setRegion: (v: string) => void;
  setDistrict: (v: string) => void;
  setSelectedCityId: (v: number | undefined) => void;
  setSelectedZoneId: (v: number | undefined) => void;
  setSelectedQuartierId: (v: number | undefined) => void;
  setLandmarkImages: (v: string[]) => void;
  setPlotNumber?: (v: string) => void;
};

/** Apply AI draft to landmark screen state. */
export function applyLandListingDraft(
  draft: ListingAiDraft,
  s: LandmarkAiSetters,
) {
  s.setTitle(draft.title || "");
  s.setDescription(draft.description || "");
  if (draft.area && draft.area > 0) s.setArea(String(draft.area));
  if (draft.price && draft.price > 0) s.setPrice(String(Math.round(draft.price)));
  if (draft.land_type) s.setLandType(draft.land_type);
  if (draft.city_name) s.setRegion(draft.city_name);
  if (draft.zone_name || draft.quartier_name) {
    s.setDistrict(
      [draft.quartier_name, draft.zone_name].filter(Boolean).join(", "),
    );
  }
  if (draft.city_id) s.setSelectedCityId(draft.city_id);
  if (draft.zone_id) s.setSelectedZoneId(draft.zone_id);
  if (draft.quartier_id) s.setSelectedQuartierId(draft.quartier_id);
  if (draft.image_urls?.length) s.setLandmarkImages(draft.image_urls);
  const pn = draft.plot_number?.trim();
  if (pn && s.setPlotNumber) s.setPlotNumber(pn);
}
