/**
 * CameraManager — bridges the app's Region-based camera contract onto the
 * Mapbox camera. The rest of the codebase (hook, callout overlay, fly-to
 * helpers) speaks react-native-maps `Region`; nothing outside the map
 * component needs to know the engine changed.
 */
import type { Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";
import { zoomFromRegion, regionFromBounds, regionWithPlotFriendlyZoom } from "../utils/habitatGeo";
import type { CadastreMapHandle } from "../utils/habitatCadastreMapRef";
import type { HabitatTileJson } from "../utils/habitatVectorTiles";

export function regionToZoom(region: Region): number {
  return Math.min(20, Math.max(2, zoomFromRegion(region.longitudeDelta)));
}

export function regionToCenter(region: Region): [number, number] {
  return [region.longitude, region.latitude];
}

export function cameraStateToRegion(center: [number, number], zoom: number): Region {
  const longitudeDelta = 360 / Math.pow(2, zoom);
  return {
    latitude: center[1],
    longitude: center[0],
    latitudeDelta: longitudeDelta,
    longitudeDelta,
  };
}

/** Fit padding for quartier MVT bounds (top, right, bottom, left). */
export const TILE_BOUNDS_EDGE_PADDING = [72, 48, 148, 48] as const;

const QUARTIER_VIEW_ZOOM = { minDelta: 0.03, maxDelta: 0.1 };

/** TileJSON bounds are [west, south, east, north]. */
export function regionFromTileJson(
  tileJson: HabitatTileJson | null | undefined,
): Region | null {
  const bounds = tileJson?.bounds;
  if (!bounds || bounds.length !== 4) return null;
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

/** Minimal surface of the Mapbox refs this manager needs (SDK-agnostic). */
type MapboxMapLike = {
  getPointInView?: (coord: number[]) => Promise<number[]>;
};
type MapboxCameraLike = {
  setCamera?: (opts: {
    centerCoordinate?: [number, number];
    zoomLevel?: number;
    animationDuration?: number;
    animationMode?: "flyTo" | "easeTo" | "moveTo" | "linearTo";
  }) => void;
  fitBounds?: (
    ne: [number, number],
    sw: [number, number],
    padding?: number | number[],
    animationDuration?: number,
  ) => void;
};

/** Imperative cadastre handle over Mapbox Map + Camera refs. */
export function createMapboxCadastreHandle(
  mapRef: React.RefObject<MapboxMapLike | null>,
  cameraRef: React.RefObject<MapboxCameraLike | null>,
): CadastreMapHandle {
  return {
    animateToRegion(region: Region, duration = 620) {
      cameraRef.current?.setCamera?.({
        centerCoordinate: regionToCenter(region),
        zoomLevel: regionToZoom(region),
        animationDuration: duration,
        animationMode: "easeTo",
      });
    },

    fitToCoordinates(
      coordinates: LatLng[],
      options?: {
        edgePadding?: { top: number; right: number; bottom: number; left: number };
        animated?: boolean;
      },
    ) {
      if (coordinates.length === 0) return;
      let west = Infinity;
      let south = Infinity;
      let east = -Infinity;
      let north = -Infinity;
      for (const c of coordinates) {
        west = Math.min(west, c.longitude);
        east = Math.max(east, c.longitude);
        south = Math.min(south, c.latitude);
        north = Math.max(north, c.latitude);
      }
      if (!Number.isFinite(west)) return;
      const pad = options?.edgePadding;
      cameraRef.current?.fitBounds?.(
        [east, north],
        [west, south],
        pad ? [pad.top, pad.right, pad.bottom, pad.left] : 40,
        options?.animated === false ? 0 : 280,
      );
    },

    async pointForCoordinate(coordinate: LatLng) {
      const map = mapRef.current;
      if (!map?.getPointInView) return null;
      try {
        const pt = await map.getPointInView([
          coordinate.longitude,
          coordinate.latitude,
        ]);
        if (!pt || pt.length < 2) return null;
        return { x: pt[0]!, y: pt[1]! };
      } catch {
        return null;
      }
    },
  };
}
