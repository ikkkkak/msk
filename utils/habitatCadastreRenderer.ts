import { USE_HABITAT_RASTER_OVERLAY } from "./habitatRasterOverlay";

/** Tracks whether the MapLibre GPU cadastre map is mounted (MVT draws all plots). */
let gpuMapActive = false;

export function setCadastreGpuMapActive(active: boolean): void {
  gpuMapActive = active;
}

export function isCadastreGpuMapActive(): boolean {
  return gpuMapActive;
}

/**
 * True whenever plot polygons are drawn by something other than this hook's
 * own client-side geometry pipeline — GPU vector tiles (MapLibre) or the
 * server-rendered raster overlay (native Apple/Google Maps). Either way,
 * useHabitatCadastre.ts should skip fetching/caching per-plot geometry
 * entirely; there's nothing for it to render from that data anymore.
 */
export function isPlotRenderingHandledExternally(): boolean {
  return isCadastreGpuMapActive() || USE_HABITAT_RASTER_OVERLAY;
}
