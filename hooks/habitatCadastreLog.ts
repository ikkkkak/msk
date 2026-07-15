/** Shared cadastre log tag — isolated to avoid circular hook imports. */
import type { HabitatPlot } from "../types/habitat";
import { serverUrl } from "../constants";
import {
  plotAnchorCoordinate,
  plotGeometryAnchor,
} from "../utils/habitatGeometry";
import { getPlotRings } from "../utils/habitatPlotGeometryCache";
import { canUseHabitatVectorTiles } from "../utils/habitatVectorTiles";

export const CADASTRE_LOG = "[HabitatCadastre]";

export function devCadastreLog(...args: unknown[]) {
  if (__DEV__) console.log(...args);
}

/** Always logs API calls — pass quiet:true for high-volume geometry batches. */
export function logCadastreApiRequest(
  method: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  result?: Record<string, unknown> & { quiet?: boolean },
) {
  if (result?.quiet) return;
  const { quiet: _quiet, ...resultFields } = result ?? {};
  const cleanParams: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) cleanParams[k] = String(v);
    }
  }
  const qs = Object.keys(cleanParams).length
    ? `?${new URLSearchParams(cleanParams).toString()}`
    : "";
  const fullUrl = `${serverUrl}${path}${qs}`;
  console.log(`${CADASTRE_LOG} [API] ${method} ${path}`, {
    full_url: fullUrl,
    api_base: serverUrl,
    params: cleanParams,
    ...resultFields,
  });
}

/** Summary when user picks a zone (plan) — no plots loaded yet. */
export function logCadastreZoneSelected(payload: {
  planId: number;
  planName?: string;
  quartiersFound: number;
  api: string;
}) {
  console.log(`${CADASTRE_LOG} [Filter] ZONE SELECTED`, {
    api_base: serverUrl,
    zone_id: payload.planId,
    zone_name: payload.planName,
    quartiers_found: payload.quartiersFound,
    api: payload.api,
    full_url: `${serverUrl}${payload.api.replace(/^GET /, "/")}`,
  });
}

/** Summary when user picks a quartier (sector) — plots fetch starting. */
export function logCadastreQuartierFetchStart(payload: {
  planId: number;
  planName?: string;
  sectorId: number;
  sectorName?: string;
}) {
  console.log(`${CADASTRE_LOG} [Filter] QUARTIER SELECTED — fetching plots`, {
    api_base: serverUrl,
    zone_id: payload.planId,
    zone_name: payload.planName,
    quartier_id: payload.sectorId,
    quartier_name: payload.sectorName,
    count_api: `GET /habitat/sectors/${payload.sectorId}/plots?page=1&limit=1&lite=true`,
    plots_api: `GET /habitat/sectors/${payload.sectorId}/plots?lite=true&page=N&limit=500`,
    geometry_api: canUseHabitatVectorTiles()
      ? "GPU vector tiles (MVT) — all plots drawn on map"
      : "GET /habitat/plots/bbox (viewport only) + chunked native polygons",
  });
}

/** Summary after quartier plots are loaded. */
export function logCadastreQuartierPlotsLoaded(payload: {
  planId: number;
  sectorId: number;
  sectorName?: string;
  plotsInDb: number;
  plotsLoaded: number;
  plotsTruncated: boolean;
  plotsWithGeometry: number;
  plotsDrawn: number;
  fetchPath: string;
}) {
  console.log(`${CADASTRE_LOG} [Filter] QUARTIER PLOTS LOADED`, {
    api_base: serverUrl,
    zone_id: payload.planId,
    quartier_id: payload.sectorId,
    quartier_name: payload.sectorName,
    plots_in_db: payload.plotsInDb,
    plots_loaded: payload.plotsLoaded,
    plots_truncated: payload.plotsTruncated,
    plots_with_geometry: payload.plotsWithGeometry,
    plots_drawn_on_map: payload.plotsDrawn,
    fetch_api: payload.fetchPath,
  });
}

/** Clear one-line summary — quartier selected, plots found vs drawn. */
export function logQuartierDrawSummary(payload: {
  quartierName: string;
  quartierId: number;
  plotsFound: number;
  plotsLoaded: number;
  plotsWithGeometry: number;
  plotsDrawn: number;
  phase?: "index" | "geometry_complete" | "vector_tiles";
}) {
  const tag =
    payload.phase === "geometry_complete"
      ? " [geometry complete]"
      : payload.phase === "vector_tiles"
        ? " [GPU vector tiles — all plots]"
        : "";
  console.log(
    `${CADASTRE_LOG} Quartier selected: "${payload.quartierName}" (id ${payload.quartierId}) | ` +
      `plots found: ${payload.plotsFound} | loaded: ${payload.plotsLoaded} | ` +
      `with geometry: ${payload.plotsWithGeometry} | drawn on map: ${payload.plotsDrawn}${tag}`,
  );
}

function ringBounds(rings: Array<Array<{ latitude: number; longitude: number }>>) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of rings) {
    for (const c of ring) {
      minLat = Math.min(minLat, c.latitude);
      maxLat = Math.max(maxLat, c.latitude);
      minLng = Math.min(minLng, c.longitude);
      maxLng = Math.max(maxLng, c.longitude);
    }
  }
  if (!Number.isFinite(minLat)) return null;
  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
  };
}

/** Console snapshot of plot fields used by the map callout (always logs, including prod). */
export function logPlotClickDetails(label: string, plot: HabitatPlot) {
  const rings = getPlotRings(plot);
  const anchor = plotAnchorCoordinate(plot);
  const geomAnchor = plotGeometryAnchor(plot);
  const bounds = ringBounds(rings);
  const first = rings[0]?.[0];

  console.log(`${CADASTRE_LOG} ===== PLOT CLICKED (${label}) =====`, {
    id: plot.id,
    plot_number: plot.plot_number,
    plan_id: plot.plan_id,
    sector_id: plot.sector_id,
    plan: plot.plan
      ? {
          id: plot.plan.id,
          code: plot.plan.code,
          name: plot.plan.name,
          name_ar: plot.plan.name_ar,
        }
      : null,
    sector: plot.sector
      ? {
          id: plot.sector.id,
          code: plot.sector.code,
          name: plot.sector.name,
          name_ar: plot.sector.name_ar,
        }
      : null,
    area_m2: plot.area_m2,
    area_rounded: plot.area_rounded,
    sides_m: plot.sides_m,
    dimensions_string: plot.dimensions_string,
    length_m: plot.length_m,
    width_m: plot.width_m,
    il_value: plot.il_value,
    el_value: plot.el_value,
    res_value: plot.res_value,
    is_for_sale: plot.is_for_sale,
    centroid_lat: plot.centroid_lat,
    centroid_lng: plot.centroid_lng,
    pin_anchor: anchor,
    geom_anchor: geomAnchor,
    ring_count: rings.length,
    ring_first_point: first ?? null,
    ring_bounds: bounds,
    has_geom: Boolean(plot.geom_geojson),
  });
}
