import type { HabitatPlot, LatLng } from "../types/habitat";
import {
  extractPlotPolygons,
  plotLabelCoordinate,
  normalizeMauritaniaLatLng,
} from "./habitatGeometry";

export type PlotShapeDescriptor = {
  plot: HabitatPlot;
  rings: LatLng[][];
  labelAt: LatLng | null;
};

type StoredGeometry = {
  geom_geojson?: Record<string, unknown> | null;
  corners?: unknown;
};

type StoredMetadata = Partial<
  Pick<
    HabitatPlot,
    | "area_m2"
    | "area_rounded"
    | "dimensions_string"
    | "sides_m"
    | "length_m"
    | "width_m"
    | "il_value"
    | "el_value"
    | "res_value"
    | "centroid_lat"
    | "centroid_lng"
  >
>;

const ringsByPlotId = new Map<number, LatLng[][]>();
const geometrySourceByPlotId = new Map<number, StoredGeometry>();
const metadataByPlotId = new Map<number, StoredMetadata>();

/** Parsed rings cache — small; geometry sources can hold a full quartier index. */
const RINGS_CACHE_CAP = 1_500;
const GEOMETRY_SOURCE_CAP = 25_000;

function trimCache<K, V>(map: Map<K, V>, cap: number): void {
  if (map.size < cap) return;
  const drop = Math.floor(cap * 0.15);
  const iter = map.keys();
  for (let i = 0; i < drop; i++) {
    const next = iter.next();
    if (next.done) break;
    map.delete(next.value);
  }
}

export function isPlotGeometryCached(plotId: number): boolean {
  return geometrySourceByPlotId.has(plotId);
}

function pickMetadata(plot: HabitatPlot): StoredMetadata {
  const out: StoredMetadata = {};
  if (plot.area_m2 != null) out.area_m2 = plot.area_m2;
  if (plot.area_rounded != null) out.area_rounded = plot.area_rounded;
  if (plot.dimensions_string) out.dimensions_string = plot.dimensions_string;
  if (plot.sides_m?.length) out.sides_m = plot.sides_m;
  if (plot.length_m != null) out.length_m = plot.length_m;
  if (plot.width_m != null) out.width_m = plot.width_m;
  if (plot.il_value != null) out.il_value = plot.il_value;
  if (plot.el_value != null) out.el_value = plot.el_value;
  if (plot.res_value != null) out.res_value = plot.res_value;
  if (plot.centroid_lat != null) out.centroid_lat = plot.centroid_lat;
  if (plot.centroid_lng != null) out.centroid_lng = plot.centroid_lng;
  return out;
}

/** Merge cached geometry + metadata onto a plot record (lite index, search hit, etc.). */
export function enrichPlotFromGeometryCache(plot: HabitatPlot): HabitatPlot {
  if (plot.id == null) return plot;
  const meta = metadataByPlotId.get(plot.id);
  const geom = geometrySourceByPlotId.get(plot.id);
  if (!meta && !geom) return plot;

  let merged: HabitatPlot = { ...plot };
  if (meta) merged = { ...merged, ...meta };
  if (geom) {
    merged = {
      ...merged,
      geom_geojson: geom.geom_geojson ?? merged.geom_geojson,
      corners: geom.corners ?? merged.corners,
    };
  }

  const normalized = normalizeMauritaniaLatLng(
    merged.centroid_lat,
    merged.centroid_lng,
  );
  if (normalized) {
    merged.centroid_lat = normalized.latitude;
    merged.centroid_lng = normalized.longitude;
  }
  return merged;
}

function plotWithStoredGeometry(plot: HabitatPlot): HabitatPlot {
  return enrichPlotFromGeometryCache(plot);
}

export function hasStoredPlotGeometry(plot: HabitatPlot): boolean {
  if (plot.geom_geojson || plot.corners) return true;
  if (plot.id != null && geometrySourceByPlotId.has(plot.id)) return true;
  if (plot.id != null) {
    const rings = ringsByPlotId.get(plot.id);
    if (rings && rings.length > 0) return true;
  }
  return false;
}

/** Store geometry + card metadata from a batch or detail fetch. */
export function ingestPlotGeometryBatch(plots: HabitatPlot[]): void {
  for (const plot of plots) {
    const id = plot.id;
    if (id == null) continue;

    if (plot.geom_geojson || plot.corners) {
      geometrySourceByPlotId.set(id, {
        geom_geojson: plot.geom_geojson,
        corners: plot.corners,
      });
      ringsByPlotId.delete(id);
      trimCache(geometrySourceByPlotId, GEOMETRY_SOURCE_CAP);
    }

    const meta = pickMetadata(plot);
    if (Object.keys(meta).length > 0) {
      metadataByPlotId.set(id, { ...metadataByPlotId.get(id), ...meta });
    }
  }
}

/** Cached plot rings — avoids re-parsing GeoJSON on every map render. */
export function getPlotRings(plot: HabitatPlot): LatLng[][] {
  const enriched = plotWithStoredGeometry(plot);
  const id = enriched.id;
  if (id != null) {
    const cached = ringsByPlotId.get(id);
    if (cached) return cached;
  }

  const rings = extractPlotPolygons(enriched);
  if (id != null) {
    trimCache(ringsByPlotId, RINGS_CACHE_CAP);
    ringsByPlotId.set(id, rings);
  }
  return rings;
}

export function clearPlotGeometryCache(): void {
  ringsByPlotId.clear();
  geometrySourceByPlotId.clear();
  metadataByPlotId.clear();
}

/** Parse every plot once — call before mounting native polygons. */
export function buildPlotShapeDescriptors(
  plots: HabitatPlot[],
): PlotShapeDescriptor[] {
  const out: PlotShapeDescriptor[] = [];
  for (const plot of plots) {
    const enriched = plotWithStoredGeometry(plot);
    const rings = getPlotRings(enriched);
    const labelAt = plotLabelCoordinate(enriched);
    if (rings.length) out.push({ plot: enriched, rings, labelAt });
    else if (labelAt) out.push({ plot: enriched, rings: [], labelAt });
  }
  return out;
}

/** Warm geometry cache in idle slices so the first paint stays smooth. */
export function prewarmPlotGeometry(
  plots: HabitatPlot[],
  chunkSize = 120,
): void {
  if (plots.length === 0) return;
  let i = 0;
  const tick = () => {
    const end = Math.min(i + chunkSize, plots.length);
    for (; i < end; i++) getPlotRings(plots[i]!);
    if (i < plots.length) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
