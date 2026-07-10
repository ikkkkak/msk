/**
 * Vector tile URLs for Habitat cadastre (MapLibre migration).
 * Phase 2+: MapLibre VectorSource points at these tiles instead of 7K React polygons.
 */
import { serverUrl } from "../constants";
import { isMapLibreNativeAvailable } from "./habitatMapLibreNative";

/** Enable vector-tile architecture when MapLibre is linked (requires native rebuild). */
export const USE_HABITAT_VECTOR_TILES = true;

/** Runtime gate: flag on AND MapLibre native binary present. */
export function canUseHabitatVectorTiles(): boolean {
  return USE_HABITAT_VECTOR_TILES && isMapLibreNativeAvailable();
}

export function habitatSectorTileUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/tiles/{z}/{x}/{y}.pbf`;
}

export function habitatSectorTileJsonUrl(sectorId: number): string {
  return `${serverUrl}/habitat/sectors/${sectorId}/tiles.json`;
}

export type HabitatTileJson = {
  tilejson: "2.2.0" | "3.0.0";
  name: string;
  description?: string;
  minzoom: number;
  maxzoom: number;
  bounds: [number, number, number, number];
  center?: [number, number, number];
  tiles: string[];
  vector_layers: Array<{
    id: string;
    description?: string;
    minzoom?: number;
    maxzoom?: number;
    fields: Record<string, string>;
  }>;
};
