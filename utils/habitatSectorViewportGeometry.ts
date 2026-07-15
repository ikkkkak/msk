import type { Region } from "react-native-maps";
import type { HabitatPlot } from "../types/habitat";
import { habitatApi } from "../services/habitatApi";
import { bboxFromRegion, zoomFromRegion } from "./habitatGeo";
import {
  hasStoredPlotGeometry,
  ingestPlotGeometryBatch,
  getPlotRings,
} from "./habitatPlotGeometryCache";
import { selectPlotsToDraw } from "./habitatViewportPlots";
import { MAX_NATIVE_MAP_CHILDREN_SECTOR } from "./habitatMapLimits";

/** Minimum zoom before fetching parcel geometry for a pinned quartier. */
export const MIN_SECTOR_VIEWPORT_ZOOM = 14;

export type SectorViewportGeometryResult = {
  bboxPlots: number;
  batchPlots: number;
  drawableCount: number;
};

/**
 * FULL SECTOR STRATEGY: Fetch ALL plots for the entire sector once, cache forever.
 * No viewport-based filtering — all 1,800+ plots loaded and cached in memory.
 * This prevents plots from disappearing on zoom.
 */
export async function fetchSectorViewportGeometry(opts: {
  sectorId: number;
  planId: number | null;
  region: Region;
  metadata: HabitatPlot[];
  maxPlots?: number;
}): Promise<SectorViewportGeometryResult> {
  let batchCount = 0;

  // Fetch ALL plots for the entire sector (not just viewport)
  const allPlotIds = opts.metadata
    .filter((p) => p.id != null)
    .map((p) => p.id as number);

  if (allPlotIds.length > 0) {
    try {
      // Fetch in batches to avoid timeout
      const batchSize = 1000;
      for (let i = 0; i < allPlotIds.length; i += batchSize) {
        const batch = await habitatApi.getPlotGeometryBatch(
          allPlotIds.slice(i, i + batchSize),
        );
        if (batch.length > 0) {
          ingestPlotGeometryBatch(batch);
          batchCount += batch.length;
        }
      }
    } catch {
      /* partial load acceptable */
    }
  }

  // Return all metadata plots as drawable (no viewport filtering)
  const drawableCount = opts.metadata.filter(
    (p) =>
      hasStoredPlotGeometry(p) ||
      getPlotRings(p, { allowCentroidFallback: false }).length > 0,
  ).length;

  return { bboxPlots: 0, batchPlots: batchCount, drawableCount };
}

/** Progressive native polygon reveal — avoids 1754 polygons in one frame. */
export const PLOT_SHAPE_CHUNK_SIZE = 80;
export const PLOT_SHAPE_CHUNK_DELAY_MS = 45;

export function scheduleProgressiveReveal(
  total: number,
  onReveal: (count: number) => void,
  chunkSize = PLOT_SHAPE_CHUNK_SIZE,
  delayMs = PLOT_SHAPE_CHUNK_DELAY_MS,
): () => void {
  if (total <= 0) {
    onReveal(0);
    return () => {};
  }

  let revealed = Math.min(chunkSize, total);
  onReveal(revealed);

  if (revealed >= total) return () => {};

  const timers: ReturnType<typeof setTimeout>[] = [];
  const step = () => {
    revealed = Math.min(revealed + chunkSize, total);
    onReveal(revealed);
    if (revealed < total) {
      timers.push(setTimeout(step, delayMs));
    }
  };
  timers.push(setTimeout(step, delayMs));

  return () => {
    for (const t of timers) clearTimeout(t);
  };
}
