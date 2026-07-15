/**
 * Vector tile URLs for Habitat cadastre (MapLibre migration).
 * Phase 2+: MapLibre VectorSource points at these tiles instead of 7K React polygons.
 */
import { serverUrl } from "../constants";
import {
  isMapLibreNativeAvailable,
  markMapLibreNativeUnavailable,
} from "./habitatMapLibreNative";
import { isCadastreGpuMapActive } from "./habitatCadastreRenderer";

/**
 * GPU vector tiles (MapLibre) — ENABLED. Render all 1,800+ plots via
 * MapLibre GL vector tiles (no native polygon render cap). Server provides
 * MVT tiles; MapLibre renders them on GPU without JavaScript polygon limit.
 */
export const USE_HABITAT_VECTOR_TILES = true;

/** Above this count, react-native-maps per-plot geometry prefetch is disabled (OOM). */
export const LARGE_QUARTIER_PLOT_THRESHOLD = 150;

/** Runtime gate: GPU MapLibre map mounted or native modules present. */
export function canUseHabitatVectorTiles(): boolean {
  if (!USE_HABITAT_VECTOR_TILES) return false;
  if (isCadastreGpuMapActive()) return true;
  return isMapLibreNativeAvailable();
}

/** Skip RN polygon geometry when GPU tiles handle drawing. */
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
 * Iris version. MapLibre doesn't need the extension; it reads the
 * Content-Type response header instead.
 */
export function habitatSectorTileUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/tiles/{z}/{x}/{y}`;
}

export function habitatSectorTileJsonUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/tiles.json`;
}

/**
 * Nationwide tile URL (no sector scoping) — backend requires PostGIS to be
 * ready (returns 503 otherwise). Not wired into the map yet; the product
 * flow still picks a quartier first. Exists so nationwide cadastre browsing
 * doesn't need another migration later.
 */
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
