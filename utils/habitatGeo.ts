import type { Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";

/** JSONB may arrive as object or string from API. */
export function parseGeoField(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  return raw;
}

/** #RRGGBB + alpha 0–1 for react-native-maps Polygon fillColor. */
export function colorWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(42, 82, 152, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Approximate map zoom from react-native-maps region (Web Mercator). */
export function zoomFromRegion(longitudeDelta: number): number {
  if (!longitudeDelta || longitudeDelta <= 0) return 10;
  return Math.round(Math.log2(360 / longitudeDelta));
}

/** Cadastre zoom tiers — city → district → quartier → parcel (GIS-style LOD). */
export type CadastreMapTier = "city" | "district" | "quartier" | "parcel";

export function cadastreMapTier(zoom: number): CadastreMapTier {
  if (zoom >= 16) return "parcel";
  if (zoom >= 11) return "quartier";
  if (zoom >= 10) return "district";
  return "city";
}

/** Browse map level — plots load only when user pins a quartier (not from zoom alone). */
export function viewLevelFromZoom(zoom: number): "plans" | "sectors" | "plots" {
  if (zoom >= 17) return "plots";
  if (zoom >= 12) return "sectors";
  return "plans";
}

/** City view — zone (plan) outlines only (zoom ≤ this). */
export const PLAN_LAYER_MAX_ZOOM = 10;

/** Parcel number + m² labels only when zoomed in close (cadastre sheet scale). */
export const PLOT_LABEL_MIN_ZOOM = 16;

export function mapZoomFromProps(
  zoom: number,
  longitudeDelta?: number,
): number {
  if (longitudeDelta != null && longitudeDelta > 0) {
    return zoomFromRegion(longitudeDelta);
  }
  return zoom;
}

export function shouldShowPlotLabelsOnMap(
  zoom: number,
  longitudeDelta?: number,
): boolean {
  const z =
    longitudeDelta != null && longitudeDelta > 0
      ? zoomFromRegion(longitudeDelta)
      : zoom;
  return z >= PLOT_LABEL_MIN_ZOOM;
}

export function coordinateInViewport(
  lat: number,
  lng: number,
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  paddingRatio = 0.15,
): boolean {
  const latPad = (bbox.maxLat - bbox.minLat) * paddingRatio;
  const lngPad = (bbox.maxLng - bbox.minLng) * paddingRatio;
  return (
    lat >= bbox.minLat - latPad &&
    lat <= bbox.maxLat + latPad &&
    lng >= bbox.minLng - lngPad &&
    lng <= bbox.maxLng + lngPad
  );
}

export function regionFromBounds(coords: LatLng[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null {
  if (!coords.length) return null;
  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;
  for (const c of coords) {
    if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) continue;
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const padLat = Math.max(0.012, latSpan * 0.22);
  const padLng = Math.max(0.012, lngSpan * 0.22);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latSpan + padLat, 0.014),
    longitudeDelta: Math.max(lngSpan + padLng, 0.014),
  };
}

/** Clamp zoom so parcel polygons stay visible (not over-zoomed). */
export function regionWithPlotFriendlyZoom(
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  opts?: { minDelta?: number; maxDelta?: number },
): Region {
  const minD = opts?.minDelta ?? 0.018;
  const maxD = opts?.maxDelta ?? 0.065;
  const clamp = (v: number) => Math.min(Math.max(v, minD), maxD);
  return {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: clamp(region.latitudeDelta),
    longitudeDelta: clamp(region.longitudeDelta),
  };
}

/** GeoJSON → polygon rings (re-export from habitatGeometry). */
export { geoJsonToPolygons } from "./habitatGeometry";

export function bboxFromRegion(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  return {
    minLat: region.latitude - halfLat,
    maxLat: region.latitude + halfLat,
    minLng: region.longitude - halfLng,
    maxLng: region.longitude + halfLng,
  };
}

/** Quantized viewport key — skip redundant plot fetches on micro-movements. */
export function computeViewportHash(region: Region): string {
  const z = zoomFromRegion(region.longitudeDelta);
  const lat = Math.round(region.latitude * 1e4) / 1e4;
  const lng = Math.round(region.longitude * 1e4) / 1e4;
  const latD = Math.round(region.latitudeDelta * 1e5) / 1e5;
  const lngD = Math.round(region.longitudeDelta * 1e5) / 1e5;
  return `${z}|${lat}|${lng}|${latD}|${lngD}`;
}
