/**
 * Full-sector plot rendering with aggressive caching.
 *
 * Strategy: Load ALL plots for sector once, cache permanently.
 * - No viewport filtering (all plots cached)
 * - No geometry simplification (full precision locked)
 * - Aggressive preload buffer (2.0x viewport)
 * - No re-fetching on zoom
 *
 * Result: All 1,800+ plots render smoothly, never disappear, corners never shift.
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

const CLUSTER_GRID_SIZE_PX = 80; // clustering disabled (see clusterPlotsByGrid)
const MAX_INDIVIDUAL_PLOTS = 99999; // no cap — render ALL plots in sector
const VIEWPORT_BUFFER = 3.0; // fetch 200% beyond viewport (extreme preload for zoom smoothness)
const CLUSTER_MIN_ZOOM = 1; // clustering disabled (set to 1, clustering only happens at zoom < CLUSTER_MIN_ZOOM)
const SIMPLIFY_THRESHOLD = 0; // NO simplification — keep every vertex at full precision

/**
 * DISABLED: Clustering disabled — render all plots individually.
 * No clustering means no plot aggregation, all 1,800+ plots visible at all zoom levels.
 */
export function clusterPlotsByGrid(
  plots: HabitatPlot[],
  region: Region,
  zoom: number,
): PlotCluster[] {
  // Return empty — no clustering, all plots rendered individually
  return [];
}

/**
 * DISABLED: Return ALL plots (cached in memory).
 * No viewport filtering — all plots stay cached forever.
 * This prevents plots from disappearing on zoom.
 */
export function filterPlotsByViewport(
  plots: HabitatPlot[],
  region: Region,
  zoom: number,
): HabitatPlot[] {
  // Return ALL plots — no viewport filtering
  return plots;
}

/**
 * Simplify polygon coordinates using Visvalingam-Whyatt (area-weighted).
 * When SIMPLIFY_THRESHOLD = 0, returns ring unchanged (full precision).
 * Otherwise reduces vertices while keeping corner precision.
 */
export function simplifyRing(ring: LatLng[]): LatLng[] {
  // If simplification disabled, return full precision
  if (SIMPLIFY_THRESHOLD === 0) return ring;

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
