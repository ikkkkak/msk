/**
 * Camera positioning from MVT TileJSON — instant quartier fit without loading plot index.
 */
import type { Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";
import { regionFromBounds, regionWithPlotFriendlyZoom } from "./habitatGeo";
import type { HabitatTileJson } from "./habitatVectorTiles";

const QUARTIER_VIEW_ZOOM = { minDelta: 0.03, maxDelta: 0.1 };

/** TileJSON bounds are [west, south, east, north]. */
export function regionFromTileJsonBounds(
  bounds: [number, number, number, number],
): Region | null {
  const [west, south, east, north] = bounds;
  if (![west, south, east, north].every(Number.isFinite)) return null;
  if (east <= west || north <= south) return null;

  const corners: LatLng[] = [
    { latitude: south, longitude: west },
    { latitude: south, longitude: east },
    { latitude: north, longitude: west },
    { latitude: north, longitude: east },
  ];
  const fit = regionFromBounds(corners);
  if (!fit) return null;
  return regionWithPlotFriendlyZoom(fit, QUARTIER_VIEW_ZOOM);
}

export function regionFromTileJson(tileJson: HabitatTileJson | null | undefined): Region | null {
  if (!tileJson?.bounds?.length) return null;
  return regionFromTileJsonBounds(tileJson.bounds);
}

/** Fit padding for quartier MVT bounds (MapLibre fitBounds). */
export const TILE_BOUNDS_EDGE_PADDING = {
  top: 72,
  right: 48,
  bottom: 148,
  left: 48,
} as const;
