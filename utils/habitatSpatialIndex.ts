/**
 * In-memory spatial index for quartier plots — grid-bucket index over plot
 * centroids. Built once per plot dataset (cached via WeakMap on the array
 * identity, so a quartier's index survives re-renders and is dropped
 * automatically when its plot list is garbage-collected with the LRU cache).
 *
 * Purpose: on every camera movement, viewport culling must answer "which
 * plots intersect the visible region" without iterating all 1,800–50,000
 * plots per frame. A uniform grid over centroids is O(visible cells) per
 * query, allocation-free hot path, and needs no external dependency
 * (flatbush/rbush would require a new package — not worth a native rebuild
 * for point data this size).
 */
import type { Region } from "react-native-maps";
import type { HabitatPlot } from "../types/habitat";

/**
 * ~220m cells at Mauritania's latitude — a typical quartier (1–3 km across)
 * spans a few hundred cells, and a zoomed-in viewport touches only a handful.
 */
const CELL_DEG = 0.002;

export type PlotSpatialIndex = {
  cells: Map<string, HabitatPlot[]>;
  /** Plots with no usable centroid — always included in query results so they can't silently vanish. */
  unindexed: HabitatPlot[];
  size: number;
};

const indexByPlotArray = new WeakMap<HabitatPlot[], PlotSpatialIndex>();

function cellKey(lat: number, lng: number): string {
  return `${Math.floor(lat / CELL_DEG)}:${Math.floor(lng / CELL_DEG)}`;
}

export function buildPlotSpatialIndex(plots: HabitatPlot[]): PlotSpatialIndex {
  const cells = new Map<string, HabitatPlot[]>();
  const unindexed: HabitatPlot[] = [];
  for (const p of plots) {
    const lat = p.centroid_lat;
    const lng = p.centroid_lng;
    if (lat == null || lng == null) {
      unindexed.push(p);
      continue;
    }
    const key = cellKey(lat, lng);
    const bucket = cells.get(key);
    if (bucket) bucket.push(p);
    else cells.set(key, [p]);
  }
  return { cells, unindexed, size: plots.length };
}

/** Build-once accessor — same array identity returns the cached index. */
export function getPlotSpatialIndex(plots: HabitatPlot[]): PlotSpatialIndex {
  const cached = indexByPlotArray.get(plots);
  if (cached) return cached;
  const built = buildPlotSpatialIndex(plots);
  indexByPlotArray.set(plots, built);
  return built;
}

/**
 * All plots whose centroid falls inside the region expanded by `bufferRatio`
 * (0.5 = half a viewport of preload on each edge, so polygons already exist
 * when they scroll on-screen instead of popping in at the boundary).
 */
export function queryPlotsInRegion(
  plots: HabitatPlot[],
  region: Region,
  bufferRatio = 0.5,
): HabitatPlot[] {
  if (plots.length === 0) return [];
  const index = getPlotSpatialIndex(plots);

  const latPad = region.latitudeDelta * bufferRatio;
  const lngPad = region.longitudeDelta * bufferRatio;
  const minLat = region.latitude - region.latitudeDelta / 2 - latPad;
  const maxLat = region.latitude + region.latitudeDelta / 2 + latPad;
  const minLng = region.longitude - region.longitudeDelta / 2 - lngPad;
  const maxLng = region.longitude + region.longitudeDelta / 2 + lngPad;

  const minRow = Math.floor(minLat / CELL_DEG);
  const maxRow = Math.floor(maxLat / CELL_DEG);
  const minCol = Math.floor(minLng / CELL_DEG);
  const maxCol = Math.floor(maxLng / CELL_DEG);

  // Zoomed way out (viewport covers more cells than plots exist): scanning
  // the whole plot list once is cheaper than touching every empty cell.
  const cellCount = (maxRow - minRow + 1) * (maxCol - minCol + 1);
  if (cellCount >= index.size + index.cells.size) {
    return plots.filter((p) => {
      const lat = p.centroid_lat;
      const lng = p.centroid_lng;
      if (lat == null || lng == null) return true;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
  }

  const out: HabitatPlot[] = [...index.unindexed];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const bucket = index.cells.get(`${row}:${col}`);
      if (!bucket) continue;
      for (const p of bucket) {
        const lat = p.centroid_lat!;
        const lng = p.centroid_lng!;
        if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
          out.push(p);
        }
      }
    }
  }
  return out;
}
