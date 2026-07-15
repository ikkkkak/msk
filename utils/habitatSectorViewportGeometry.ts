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
 * Layer 2 — fetch geometry only for the visible map viewport (not entire quartier).
 * 1) POSTGIS bbox endpoint (spatial filter on server)
 * 2) Fallback geometry batch for visible lite-metadata rows still missing rings
 */
export async function fetchSectorViewportGeometry(opts: {
  sectorId: number;
  planId: number | null;
  region: Region;
  metadata: HabitatPlot[];
  maxPlots?: number;
}): Promise<SectorViewportGeometryResult> {
  const maxPlots = opts.maxPlots ?? MAX_NATIVE_MAP_CHILDREN_SECTOR;
  const z = zoomFromRegion(opts.region.longitudeDelta);
  if (z < MIN_SECTOR_VIEWPORT_ZOOM) {
    return { bboxPlots: 0, batchPlots: 0, drawableCount: 0 };
  }

  const bbox = bboxFromRegion(opts.region);
  let bboxCount = 0;
  let batchCount = 0;

  try {
    const { plots: bboxPlots } = await habitatApi.getPlotsInBBox({
      minLat: bbox.minLat,
      minLng: bbox.minLng,
      maxLat: bbox.maxLat,
      maxLng: bbox.maxLng,
      zoom: z,
      sectorId: opts.sectorId,
      planId: opts.planId ?? undefined,
    });
    if (bboxPlots.length > 0) {
      ingestPlotGeometryBatch(bboxPlots);
      bboxCount = bboxPlots.length;
    }
  } catch {
    /* bbox endpoint optional — fall through to id batch */
  }

  const visibleMeta = selectPlotsToDraw(opts.metadata, opts.region, maxPlots);
  const missingIds = visibleMeta
    .filter((p) => p.id != null && !hasStoredPlotGeometry(p))
    .map((p) => p.id as number)
    .slice(0, maxPlots);

  if (missingIds.length > 0) {
    try {
      const batch = await habitatApi.getPlotGeometryBatch(missingIds);
      if (batch.length > 0) {
        ingestPlotGeometryBatch(batch);
        batchCount = batch.length;
      }
    } catch {
      /* partial viewport is acceptable */
    }
  }

  const drawableCount = visibleMeta.filter(
    (p) =>
      hasStoredPlotGeometry(p) ||
      getPlotRings(p, { allowCentroidFallback: false }).length > 0,
  ).length;

  return { bboxPlots: bboxCount, batchPlots: batchCount, drawableCount };
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
