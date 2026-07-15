import type { Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";
import { bboxFromRegion, regionFromBounds } from "./habitatGeo";
import {
  coerceCoord,
  landmarkCornerRing,
  resolveLandmarkMapGeometry,
} from "./landmarkMapGeometry";
import { getLandmarkPrimaryImageUrl, resolveLandmarkAssetUrl } from "./landmarkMedia";
import {
  focusMapOnSelectedPlot,
  plotCalloutEdgePadding,
  type HabitatMapRef,
} from "./habitatMapFit";

export type MapLandmarkRecord = Record<string, unknown> & {
  id: number;
  title?: string;
  name?: string;
  price?: number;
  area?: number;
  area_unit?: string;
  images?: string[];
  point1_lat?: number;
  point1_lng?: number;
  point2_lat?: number;
  point2_lng?: number;
  point3_lat?: number;
  point3_lng?: number;
  point4_lat?: number;
  point4_lng?: number;
  lat?: number;
  lng?: number;
  zone_name?: string;
  city_name?: string;
  centroid_lat?: number;
  centroid_lng?: number;
  primary_image_url?: string;
  habitat_plot_id?: number;
  /** Cadastre parcel outline from linked habitat plot (when listing has no corner points). */
  plot_ring?: Array<{ lat?: number; lng?: number; latitude?: number; longitude?: number }>;
  sides?: string[];
  is_verified?: boolean;
  is_published?: boolean;
  is_gold?: boolean;
  status?: string;
};

/** Show parcel outline from this zoom (aligned with cluster break-apart). */
export const LAND_PLOT_OUTLINE_MIN_ZOOM = 12;
export const LAND_PLOT_DETAIL_MIN_ZOOM = 13;
export const LAND_MAP_MAX_VISIBLE = 36;

export function landmarkPlotRingFromApi(lm: MapLandmarkRecord): LatLng[] | null {
  const raw = lm.plot_ring;
  if (!Array.isArray(raw) || raw.length < 3) return null;

  const ring: LatLng[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const rec = p as Record<string, unknown>;
    const lat = coerceCoord(rec.lat ?? rec.latitude);
    const lng = coerceCoord(rec.lng ?? rec.longitude);
    if (lat != null && lng != null) {
      ring.push({ latitude: lat, longitude: lng });
    }
  }
  return ring.length >= 3 ? ring : null;
}

export function landmarkHasPlotGeometry(lm: MapLandmarkRecord): boolean {
  if (landmarkCornerRing(lm)) return true;
  return landmarkPlotRingFromApi(lm) != null;
}

export function landmarkPlotRing(lm: MapLandmarkRecord): LatLng[] | null {
  const corner = landmarkCornerRing(lm);
  if (corner && corner.length >= 3) return corner;

  const fromPlot = landmarkPlotRingFromApi(lm);
  if (fromPlot) return fromPlot;

  const geo = resolveLandmarkMapGeometry(lm);
  const ring = geo.polygonRings[0];
  if (ring && ring.length >= 3) return ring;
  return null;
}

export function shouldShowLandPlotOutline(_mapZoom: number, selected: boolean): boolean {
  return selected;
}

export function shouldShowLandPlotDetail(_mapZoom: number, selected: boolean): boolean {
  return selected;
}

export function isPublishedMapLandmark(lm: MapLandmarkRecord): boolean {
  const status = String(lm.status || "").toLowerCase();
  return (
    lm.is_verified === true &&
    (lm.is_published === true || status === "verified")
  );
}

/** One entry per landmark id — prevents inflated cluster counts. */
export function dedupeMapLandmarks(
  landmarks: MapLandmarkRecord[],
): MapLandmarkRecord[] {
  const byId = new Map<number, MapLandmarkRecord>();
  for (const lm of landmarks) {
    const id = Number(lm.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (!byId.has(id)) byId.set(id, lm);
  }
  return [...byId.values()];
}

/** One map pin per cadastre plot (or per coordinate) — duplicate listings share one pin. */
export function dedupeLandmarksByPlot(
  landmarks: MapLandmarkRecord[],
): MapLandmarkRecord[] {
  const seen = new Map<string, MapLandmarkRecord>();
  for (const lm of dedupeMapLandmarks(landmarks)) {
    const plotId = Number(lm.habitat_plot_id);
    let key: string;
    if (Number.isFinite(plotId) && plotId > 0) {
      key = `plot:${plotId}`;
    } else {
      const c = landmarkCentroid(lm);
      key = c
        ? `coord:${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`
        : `id:${lm.id}`;
    }
    if (!seen.has(key)) seen.set(key, lm);
  }
  return [...seen.values()];
}

export function landmarkMapPinKey(lm: MapLandmarkRecord): string {
  const plotId = Number(lm.habitat_plot_id);
  if (Number.isFinite(plotId) && plotId > 0) return `plot:${plotId}`;
  const c = landmarkCentroid(lm);
  if (c) return `coord:${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`;
  return `id:${lm.id}`;
}

export function landmarkCentroid(lm: MapLandmarkRecord): LatLng | null {
  const clat = Number(lm.centroid_lat);
  const clng = Number(lm.centroid_lng);
  if (Number.isFinite(clat) && Number.isFinite(clng)) {
    return { latitude: clat, longitude: clng };
  }

  const geo = resolveLandmarkMapGeometry(lm);
  if (geo.mapCenter) return geo.mapCenter;

  const lat = Number(lm.lat);
  const lng = Number(lm.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export function landmarkMapFitCoordinates(lm: MapLandmarkRecord): LatLng[] {
  const ring = landmarkPlotRing(lm);
  if (ring?.length) return ring;

  const center = landmarkCentroid(lm);
  return center ? [center] : [];
}

export function regionForAllLandmarks(landmarks: MapLandmarkRecord[]): Region | null {
  const coords: LatLng[] = [];
  for (const lm of landmarks) {
    const fit = landmarkMapFitCoordinates(lm);
    if (fit.length) coords.push(...fit);
    else {
      const c = landmarkCentroid(lm);
      if (c) coords.push(c);
    }
  }
  const fit = regionFromBounds(coords);
  if (!fit) return null;
  return {
    ...fit,
    latitudeDelta: Math.min(Math.max(fit.latitudeDelta, 0.04), 0.14),
    longitudeDelta: Math.min(Math.max(fit.longitudeDelta, 0.04), 0.14),
  };
}

export function landmarksInRegion(
  landmarks: MapLandmarkRecord[],
  region: Region,
): MapLandmarkRecord[] {
  const bbox = bboxFromRegion(region);
  return landmarks.filter((lm) => {
    const c = landmarkCentroid(lm);
    if (!c) return false;
    return (
      c.latitude >= bbox.minLat &&
      c.latitude <= bbox.maxLat &&
      c.longitude >= bbox.minLng &&
      c.longitude <= bbox.maxLng
    );
  });
}

export function landmarkMarkerImage(lm: MapLandmarkRecord): string | null {
  const primary = lm.primary_image_url;
  if (typeof primary === "string" && primary.trim()) {
    return resolveLandmarkAssetUrl(primary.trim());
  }
  return getLandmarkPrimaryImageUrl(lm);
}

export { landmarkCornerRing } from "./landmarkMapGeometry";

export function landmarkDisplayTitle(lm: MapLandmarkRecord): string {
  return String(lm.title || lm.name || "").trim() || `Land #${lm.id}`;
}

export function landmarkDisplayPrice(lm: MapLandmarkRecord): string {
  const price = Number(lm.price);
  if (!Number.isFinite(price) || price <= 0) return "";
  return `${price.toLocaleString()} MRU`;
}

export function focusMapOnLandmark(
  mapRef: HabitatMapRef | null | undefined,
  landmark: MapLandmarkRecord,
  currentRegion: Region,
): Promise<void> {
  if (!mapRef) return Promise.resolve();

  const coords = landmarkMapFitCoordinates(landmark);
  if (!coords.length) return Promise.resolve();

  if (mapRef.fitToCoordinates) {
    mapRef.fitToCoordinates(coords, {
      edgePadding: plotCalloutEdgePadding(),
      animated: true,
    });
    return new Promise((resolve) => setTimeout(resolve, 444));
  }

  const center = landmarkCentroid(landmark);
  if (!center) return Promise.resolve();

  return focusMapOnSelectedPlot(
    mapRef,
    {
      id: 0,
      plan_id: 0,
      sector_id: 0,
      plot_number: "",
      centroid_lat: center.latitude,
      centroid_lng: center.longitude,
    },
    currentRegion,
  );
}
