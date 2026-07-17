import type { Region } from "react-native-maps";
import type { HabitatPlot } from "../types/habitat";
import { habitatApi } from "../services/habitatApi";
import {
  hasStoredPlotGeometry,
  ingestPlotGeometryBatch,
  getPlotRings,
  isPlotGeometryCached,
} from "./habitatPlotGeometryCache";

/** Minimum zoom before fetching parcel geometry for a pinned quartier. */
export const MIN_SECTOR_VIEWPORT_ZOOM = 14;

export type SectorViewportGeometryResult = {
  bboxPlots: number;
  batchPlots: number;
  drawableCount: number;
};

/**
 * Quartier geometry load: fetch the pinned quartier's full plot geometry
 * once (batched), cache it in the geometry LRU, and never refetch on
 * pan/zoom. Plot ids already in the cache are skipped entirely, so
 * revisiting a recent quartier costs zero network requests. RENDERING is
 * viewport-culled downstream (habitatViewportPlots.ts + spatial index) —
 * caching everything here is what keeps plots from disappearing on zoom
 * while only a few hundred polygons are ever mounted.
 */
export async function fetchSectorViewportGeometry(opts: {
  sectorId: number;
  planId: number | null;
  region: Region;
  metadata: HabitatPlot[];
  maxPlots?: number;
}): Promise<SectorViewportGeometryResult> {
  let batchCount = 0;

  // LRU hit: skip every plot whose geometry is already cached.
  const missingPlotIds: number[] = [];
  for (const p of opts.metadata) {
    if (p.id == null) continue;
    if (isPlotGeometryCached(p.id)) continue;
    missingPlotIds.push(p.id);
  }

  if (missingPlotIds.length > 0) {
    try {
      // Batched to avoid request timeouts on large quartiers.
      const batchSize = 1000;
      for (let i = 0; i < missingPlotIds.length; i += batchSize) {
        const batch = await habitatApi.getPlotGeometryBatch(
          missingPlotIds.slice(i, i + batchSize),
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

  const drawableCount = opts.metadata.filter(
    (p) => hasStoredPlotGeometry(p) || getPlotRings(p).length > 0,
  ).length;

  return { bboxPlots: 0, batchPlots: batchCount, drawableCount };
}

/**
 * Progressive native polygon reveal — never mounts the whole quartier in a
 * single frame. 80/45ms is the configuration the 1,840-plot quartier was
 * verified stable with on-device; the evenly-spread mount order makes the
 * quartier look complete well before the last chunk lands (~1s for 1,840,
 * ~4.5s worst case for the largest 8K quartier).
 */
export const PLOT_SHAPE_CHUNK_SIZE = 80;
export const PLOT_SHAPE_CHUNK_DELAY_MS = 45;

/**
 * Step the mounted-polygon count from `startAt` toward `total` in chunks —
 * in EITHER direction. Mounting hundreds of native polygons in one frame is
 * the classic bridge-spike crash; removing ~2,000 in one commit is a
 * main-thread stall of its own (watchdog risk mid-gesture), so LOD
 * downgrades stage the same way upgrades do.
 */
export function scheduleProgressiveReveal(
  total: number,
  onReveal: (count: number) => void,
  chunkSize = PLOT_SHAPE_CHUNK_SIZE,
  delayMs = PLOT_SHAPE_CHUNK_DELAY_MS,
  /** Resume point — transitions stage only the delta instead of restarting from zero. */
  startAt = 0,
): () => void {
  const target = Math.max(0, total);
  const from = Math.max(0, startAt);
  const dir = target >= from ? 1 : -1;

  const advance = (n: number) =>
    dir > 0 ? Math.min(n + chunkSize, target) : Math.max(n - chunkSize, target);

  let revealed = advance(from);
  onReveal(revealed);
  if (revealed === target) return () => {};

  const timers: ReturnType<typeof setTimeout>[] = [];
  const step = () => {
    revealed = advance(revealed);
    onReveal(revealed);
    if (revealed !== target) {
      timers.push(setTimeout(step, delayMs));
    }
  };
  timers.push(setTimeout(step, delayMs));

  return () => {
    for (const t of timers) clearTimeout(t);
  };
}
