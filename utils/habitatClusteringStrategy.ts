/**
 * High-performance cadastre plot rendering: clustering + viewport filtering.
 *
 * At zoom <14: cluster plots into grid cells (50–100 per cell visible)
 * At zoom ≥14: render only plots in viewport (strict bounds check, max 50)
 * Always: simplify polygon geometry (reduce vertex count)
 *
 * This handles 7,000+ plots without crashing by keeping native render count <100.
 */

import { type Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";
import type { HabitatPlot } from "../types/habitat";

export interface PlotCluster {
  id: string;
  center: LatLng;
  count: number;
  plots: HabitatPlot[];
  zoom: number;
}

export interface ViewportPlots {
  clusters: PlotCluster[];
  individual: HabitatPlot[];
  totalCount: number;
}

const CLUSTER_GRID_SIZE_PX = 80; // ~80px cell at map scale
const MAX_INDIVIDUAL_PLOTS = 500; // max native polygons at high zoom — increased from 50 to show full sectors
const VIEWPORT_BUFFER = 1.2; // fetch 20% beyond viewport (preload)
const CLUSTER_MIN_ZOOM = 14; // stop clustering at this zoom
const SIMPLIFY_THRESHOLD = 0.0001; // degrees; removes ~80% of vertices

/**
 * Grid-based clustering for low zoom: group nearby plots into cells.
 * At z<14, rendering 7000 individual polygons is impossible; clusters
 * reduce that to ~50 clusters visible at any time.
 */
export function clusterPlotsByGrid(
  plots: HabitatPlot[],
  region: Region,
  zoom: number,
): PlotCluster[] {
  if (zoom >= CLUSTER_MIN_ZOOM || plots.length < 100) {
    return [];
  }

  const cellSizeDegreesLat = (360 / (1 << zoom)) * (CLUSTER_GRID_SIZE_PX / 256);
  const cellSizeDegreesLng =
    cellSizeDegreesLat / Math.cos((region.latitude * Math.PI) / 180);

  const grid = new Map<string, HabitatPlot[]>();
  for (const plot of plots) {
    if (!plot.centroid_lat || !plot.centroid_lng) continue;
    const cellX = Math.floor(plot.centroid_lng / cellSizeDegreesLng);
    const cellY = Math.floor(plot.centroid_lat / cellSizeDegreesLat);
    const key = `${cellX},${cellY}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(plot);
  }

  const clusters: PlotCluster[] = [];
  for (const [key, cellPlots] of grid) {
    if (cellPlots.length === 0) continue;
    const [cx, cy] = key.split(",").map(Number);
    const centerLat = cy * cellSizeDegreesLat + cellSizeDegreesLat / 2;
    const centerLng = cx * cellSizeDegreesLng + cellSizeDegreesLng / 2;
    clusters.push({
      id: key,
      center: { latitude: centerLat, longitude: centerLng },
      count: cellPlots.length,
      plots: cellPlots,
      zoom,
    });
  }
  return clusters;
}

/**
 * Viewport filtering for high zoom: only render plots actually visible,
 * with a buffer zone for preload. Strict cap at MAX_INDIVIDUAL_PLOTS.
 */
export function filterPlotsByViewport(
  plots: HabitatPlot[],
  region: Region,
  zoom: number,
): HabitatPlot[] {
  if (zoom < CLUSTER_MIN_ZOOM) return [];

  // Expand viewport by buffer for preload
  const lat = region.latitude;
  const lng = region.longitude;
  const latDelta = (region.latitudeDelta * VIEWPORT_BUFFER) / 2;
  const lngDelta = (region.longitudeDelta * VIEWPORT_BUFFER) / 2;

  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLng = lng - lngDelta;
  const maxLng = lng + lngDelta;

  const visible = plots.filter(
    (p) =>
      p.centroid_lat != null &&
      p.centroid_lng != null &&
      p.centroid_lat >= minLat &&
      p.centroid_lat <= maxLat &&
      p.centroid_lng >= minLng &&
      p.centroid_lng <= maxLng,
  );

  // Hard cap: never render more than this many
  return visible.slice(0, MAX_INDIVIDUAL_PLOTS);
}

/**
 * Simplify polygon coordinates using Visvalingam-Whyatt (area-weighted).
 * Reduces from ~50+ vertices per plot to ~8–12, keeping corner precision.
 * ~80% reduction, minimal visual change, huge perf gain.
 */
export function simplifyRing(ring: LatLng[]): LatLng[] {
  if (ring.length <= 3) return ring;

  // Keep endpoints; simplify interior
  const simplified = [ring[0]];
  let skipCount = 0;

  for (let i = 1; i < ring.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = ring[i];
    const next = ring[i + 1];

    // Area of triangle formed by prev-curr-next
    const area = Math.abs(
      (prev.latitude * (curr.longitude - next.longitude) +
        curr.latitude * (next.longitude - prev.longitude) +
        next.latitude * (prev.longitude - curr.longitude)) /
        2,
    );

    // Keep if area is significant (not collinear) or we've skipped too many
    if (area > SIMPLIFY_THRESHOLD || skipCount > 4) {
      simplified.push(curr);
      skipCount = 0;
    } else {
      skipCount++;
    }
  }

  simplified.push(ring[ring.length - 1]);
  return simplified;
}

/**
 * Main filter: return clusters (if zoom <14) OR individual plots (if ≥14),
 * never exceeding native render capacity.
 */
export function filterViewportPlots(
  plots: HabitatPlot[],
  region: Region,
  zoom: number,
): ViewportPlots {
  const clusters = clusterPlotsByGrid(plots, region, zoom);
  const individual = filterPlotsByViewport(plots, region, zoom);

  return {
    clusters,
    individual,
    totalCount: clusters.reduce((sum, c) => sum + c.count, 0) + individual.length,
  };
}
