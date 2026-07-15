export type HabitatPlan = {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  color?: string;
  bounds_geojson?: Record<string, unknown> | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  sector_count?: number;
  plot_count?: number;
};

export type HabitatSector = {
  id: number;
  plan_id: number;
  name: string;
  name_ar?: string;
  code?: string;
  bounds_geojson?: Record<string, unknown> | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  original_lat?: number | null;
  original_lng?: number | null;
  plot_count?: number;
};

/**
 * "Ilot" (city block) subdivision within a sector, e.g. "08_NC" inside
 * quartier ANCIEN_AEROPORT. Not every sector has any — the source cadastre
 * data only carries this subdivision for some quartiers. Has no polygon
 * boundary of its own (only a centroid), so it renders as a named marker,
 * not a filled region like plans/sectors.
 */
export type HabitatSubSector = {
  id: number;
  sector_id: number;
  name: string;
  name_ar?: string;
  code?: string;
  plot_count?: number;
  total_area_m2?: number;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  sector?: HabitatSector;
};

export type HabitatPlot = {
  id: number;
  plan_id: number;
  sector_id: number;
  sub_sector_id?: number | null;
  plot_number: string;
  /** True when this cadastre plot has an active verified+published land listing. */
  is_for_sale?: boolean;
  area_m2?: number | null;
  area_rounded?: number | null;
  dimensions_string?: string;
  sides_m?: number[] | null;
  /**
   * Overloaded in the source data: usually a numeric front-height
   * measurement (as a string, e.g. "1.5"), but for plots in a sector that
   * has Ilot subdivisions it's the Ilot code itself (e.g. "08_NC") — same
   * string as sub_sector_code / sub_sector.name.
   */
  il_value?: string | null;
  el_value?: number | null;
  res_value?: number | null;
  geom_geojson?: Record<string, unknown> | null;
  corners?: unknown;
  length_m?: number | null;
  width_m?: number | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  sub_sector_code?: string | null;
  plan?: HabitatPlan;
  sector?: HabitatSector;
  sub_sector?: HabitatSubSector;
};

export type HabitatMapViewLevel = "plans" | "sectors" | "sub_sectors" | "plots";

export type LatLng = { latitude: number; longitude: number };
