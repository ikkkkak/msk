/**
 * Server vector-tile endpoints for Habitat cadastre.
 *
 * The MapLibre GPU rendering path was removed — the cadastre map is the
 * platform's native provider (Apple Maps on iOS, Google Maps on Android)
 * with quartier-scoped, viewport-culled native polygons. These URL helpers
 * and the TileJSON type remain because the backend still serves MVT tiles
 * (used by web/admin tooling) and habitatApi types reference them.
 */
import { serverUrl } from "../constants";
import { isCadastreGpuMapActive } from "./habitatCadastreRenderer";

/** GPU vector tiles are permanently disabled in the mobile app. */
export const USE_HABITAT_VECTOR_TILES = false;

/** Above this count, per-plot geometry prefetch used to be skipped for the GPU path. */
export const LARGE_QUARTIER_PLOT_THRESHOLD = 150;

export function canUseHabitatVectorTiles(): boolean {
  return false;
}

/** Skip RN polygon geometry when an external layer handles drawing. */
export function shouldPrefetchPlotGeometry(_plotCount: number): boolean {
  return !isCadastreGpuMapActive();
}

export function isLargeQuartier(plotCount: number): boolean {
  return plotCount > LARGE_QUARTIER_PLOT_THRESHOLD;
}

/**
 * No ".pbf" suffix on purpose — Iris (backend router) doesn't match a
 * literal suffix glued onto a typed path param in the same segment, so
 * `{y}.pbf` 404s on every request. Verified directly against the deployed
 * Iris version.
 */
export function habitatSectorTileUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/tiles/{z}/{x}/{y}`;
}

export function habitatSectorTileJsonUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/tiles.json`;
}

export function habitatNationwideTileUrl(): string {
  return `${serverUrl}/habitat/tiles/{z}/{x}/{y}`;
}

export type HabitatTileJson = {
  tilejson: "2.2.0" | "3.0.0";
  name: string;
  description?: string;
  minzoom: number;
  maxzoom: number;
  bounds: [number, number, number, number];
  center?: [number, number, number];
  /** Plot count in sector (from server bounds query). */
  plot_count?: number;
  tiles: string[];
  vector_layers: Array<{
    id: string;
    description?: string;
    minzoom?: number;
    maxzoom?: number;
    fields: Record<string, string>;
  }>;
};
