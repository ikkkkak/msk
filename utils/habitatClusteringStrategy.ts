/**
 * Viewport-culled plot rendering for the native cadastre map.
 *
 * Strategy (quartier-based loading):
 * - A quartier's full plot list is fetched once and kept indexed in memory
 *   (utils/habitatSpatialIndex.ts) — plots are NEVER re-fetched on pan/zoom.
 * - Rendering is viewport-only: each camera move queries the spatial index
 *   for plots intersecting the visible region (+50% preload buffer) and
 *   mounts only those as native polygons, capped at a few hundred.
 * - Full-precision geometry — no vertex simplification (corners stay locked).
 *
 * Even a 50,000-plot quartier never mounts more than MAX_INDIVIDUAL_PLOTS
 * native views at once.
 */

import { type Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";
import type { HabitatPlot } from "../types/habitat";
import { queryPlotsInRegion } from "./habitatSpatialIndex";

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

/** Hard ceiling on simultaneously mounted plot polygons (native view budget). */
const MAX_INDIVIDUAL_PLOTS = 250;
/** Extra viewport fetched around the visible edge so plots don't pop in at the boundary. */
const VIEWPORT_BUFFER_RATIO = 0.5;

/**
 * Clustering intentionally disabled — plots render individually at every
 * zoom; density is controlled by viewport culling + the render cap instead.
 */
export function clusterPlotsByGrid(
  _plots: HabitatPlot[],
  _region: Region,
  _zoom: number,
): PlotCluster[] {
  return [];
}

/**
 * Viewport culling via spatial index. The quartier's plots all stay cached
 * and indexed; only those intersecting the buffered viewport are returned,
 * stride-sampled down to the native render cap when over budget.
 */
export function filterPlotsByViewport(
  plots: HabitatPlot[],
  region: Region,
  _zoom: number,
): HabitatPlot[] {
  if (plots.length === 0) return [];

  const inView = queryPlotsInRegion(plots, region, VIEWPORT_BUFFER_RATIO);
  if (inView.length <= MAX_INDIVIDUAL_PLOTS) return inView;

  const stride = Math.ceil(inView.length / MAX_INDIVIDUAL_PLOTS);
  const out: HabitatPlot[] = [];
  for (let i = 0; i < inView.length && out.length < MAX_INDIVIDUAL_PLOTS; i += stride) {
    out.push(inView[i]!);
  }
  return out;
}

/**
 * Geometry passthrough — simplification permanently disabled so plot corners
 * render at full precision at every zoom level.
 */
export function simplifyRing(ring: LatLng[]): LatLng[] {
  return ring;
}

/** Main filter: viewport-culled individual plots (clustering disabled). */
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
