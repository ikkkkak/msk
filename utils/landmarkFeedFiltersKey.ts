export type LandmarkFeedFilters = {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  city_id?: number;
  zone_id?: number;
  quartier_id?: number;
  investmentOnly?: boolean;
};

export function landmarkFeedFiltersKey(filters: LandmarkFeedFilters): string {
  const f = filters ?? {};
  return JSON.stringify({
    min_price:
      f.minPrice != null && Number(f.minPrice) > 0 ? Number(f.minPrice) : null,
    max_price:
      f.maxPrice != null && Number(f.maxPrice) > 0 ? Number(f.maxPrice) : null,
    min_area:
      f.minArea != null && Number(f.minArea) > 0 ? Number(f.minArea) : null,
    max_area:
      f.maxArea != null && Number(f.maxArea) > 0 ? Number(f.maxArea) : null,
    city_id: f.city_id != null && Number(f.city_id) > 0 ? Number(f.city_id) : null,
    zone_id: f.zone_id != null && Number(f.zone_id) > 0 ? Number(f.zone_id) : null,
    quartier_id:
      f.quartier_id != null && Number(f.quartier_id) > 0
        ? Number(f.quartier_id)
        : null,
    investment_opportunity: f.investmentOnly === true ? true : null,
  });
}
