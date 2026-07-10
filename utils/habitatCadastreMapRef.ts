import type { Region } from "react-native-maps";
import type { CameraRef, MapRef } from "@maplibre/maplibre-react-native";
import type React from "react";
import type { LatLng } from "../types/habitat";
import type { HabitatMapRef } from "./habitatMapFit";
import { zoomFromRegion } from "./habitatGeo";

/** Unified cadastre map handle — works with MapLibre or react-native-maps adapters. */
export type CadastreMapHandle = HabitatMapRef & {
  pointForCoordinate?: (
    coordinate: LatLng,
  ) => Promise<{ x: number; y: number } | null>;
};

export function regionToMapLibreZoom(region: Region): number {
  return Math.min(20, Math.max(2, zoomFromRegion(region.longitudeDelta)));
}

export function regionToMapLibreCenter(region: Region): [number, number] {
  return [region.longitude, region.latitude];
}

/** Build imperative handle for MapLibre Map + Camera refs. */
export function createMapLibreCadastreHandle(
  mapRef: React.RefObject<MapRef | null>,
  cameraRef: React.RefObject<CameraRef | null>,
): CadastreMapHandle {
  return {
    animateToRegion(region: Region, duration = 620) {
      const center = regionToMapLibreCenter(region);
      const zoom = regionToMapLibreZoom(region);
      cameraRef.current?.easeTo({
        center,
        zoom,
        duration,
        easing: "ease",
      });
    },

    fitToCoordinates(
      coordinates: LatLng[],
      options?: {
        edgePadding?: {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
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
      cameraRef.current?.fitBounds(
        [west, south, east, north],
        {
          padding: pad
            ? {
                top: pad.top,
                right: pad.right,
                bottom: pad.bottom,
                left: pad.left,
              }
            : undefined,
          duration: options?.animated === false ? 0 : 280,
          easing: "ease",
        },
      );
    },

    async pointForCoordinate(coordinate: LatLng) {
      const map = mapRef.current;
      if (!map?.project) return null;
      try {
        const pt = await map.project([coordinate.longitude, coordinate.latitude]);
        if (!pt || pt.length < 2) return null;
        return { x: pt[0]!, y: pt[1]! };
      } catch {
        return null;
      }
    },
  };
}
