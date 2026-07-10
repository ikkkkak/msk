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

export type HabitatPlot = {
  id: number;
  plan_id: number;
  sector_id: number;
  plot_number: string;
  /** True when this cadastre plot has an active verified+published land listing. */
  is_for_sale?: boolean;
  area_m2?: number | null;
  area_rounded?: number | null;
  dimensions_string?: string;
  sides_m?: number[] | null;
  il_value?: number | null;
  el_value?: number | null;
  res_value?: number | null;
  geom_geojson?: Record<string, unknown> | null;
  corners?: unknown;
  length_m?: number | null;
  width_m?: number | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  plan?: HabitatPlan;
  sector?: HabitatSector;
};

export type HabitatMapViewLevel = "plans" | "sectors" | "plots";

export type LatLng = { latitude: number; longitude: number };
