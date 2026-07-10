import type { HabitatPlot, LatLng } from "../types/habitat";
import { extractPlotPolygons } from "./habitatGeometry";

export function coerceCoord(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function closeRing(ring: LatLng[]): LatLng[] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    Math.abs(first.latitude - last.latitude) < 1e-9 &&
    Math.abs(first.longitude - last.longitude) < 1e-9
  ) {
    return ring;
  }
  return [...ring, { ...first }];
}

function rectangleFromCentroid(
  lat: number,
  lng: number,
  lengthM: number,
  widthM: number,
): LatLng[] {
  if (lengthM <= 0 || widthM <= 0) return [];
  const dLat = lengthM / 2 / 111_320;
  const dLng = widthM / 2 / (111_320 * Math.cos((lat * Math.PI) / 180));
  return closeRing([
    { latitude: lat - dLat, longitude: lng - dLng },
    { latitude: lat - dLat, longitude: lng + dLng },
    { latitude: lat + dLat, longitude: lng + dLng },
    { latitude: lat + dLat, longitude: lng - dLng },
  ]);
}

export function parseSideMeters(sides: unknown): number[] {
  if (!Array.isArray(sides)) return [];
  return sides
    .map((s) => {
      const m = String(s).match(/([\d.]+)/);
      return m ? parseFloat(m[1]) : 0;
    })
    .filter((n) => n > 0);
}

/** Four corner points saved on the landmark listing. */
export function landmarkCornerRing(
  landmark: Record<string, unknown>,
): LatLng[] | null {
  const ring: LatLng[] = [];
  for (let i = 1; i <= 4; i++) {
    const lat = coerceCoord(landmark[`point${i}_lat`]);
    const lng = coerceCoord(landmark[`point${i}_lng`]);
    if (lat != null && lng != null) {
      ring.push({ latitude: lat, longitude: lng });
    }
  }
  if (ring.length < 3) return null;
  return closeRing(ring);
}

/**
 * Tight crop on the parcel for LandmarkDetails embed map (~260px).
 * Uses the lot bounds directly with a small margin (not the cadastre 2.6× zoom-out).
 */
export function regionForLandmarkDetailMap(coords: LatLng[]) {
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

  const latSpan = Math.max(maxLat - minLat, 0.00004);
  const lngSpan = Math.max(maxLng - minLng, 0.00004);
  /** ~30% breathing room so the outline fills the map card */
  const margin = 0.8;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latSpan * (1 + margin), 0.001),
    longitudeDelta: Math.max(lngSpan * (1 + margin), 0.001),
  };
}

function buildRingFromHabitatPlot(plot: HabitatPlot): LatLng[][] {
  const fromExtract = extractPlotPolygons(plot);
  if (fromExtract.length) return fromExtract;

  const lat = coerceCoord(plot.centroid_lat);
  const lng = coerceCoord(plot.centroid_lng);
  if (lat == null || lng == null) return [];

  if (
    plot.length_m != null &&
    plot.width_m != null &&
    plot.length_m > 0 &&
    plot.width_m > 0
  ) {
    const ring = rectangleFromCentroid(lat, lng, plot.length_m, plot.width_m);
    return ring.length ? [ring] : [];
  }

  const dims = plot.dimensions_string?.trim();
  if (dims) {
    const nums =
      dims
        .match(/[\d.]+/g)
        ?.map(Number)
        .filter((n) => n > 0) ?? [];
    if (nums.length >= 2) {
      const ring = rectangleFromCentroid(lat, lng, nums[0], nums[1]);
      if (ring.length) return [ring];
    }
  }

  const area = plot.area_m2 ?? plot.area_rounded;
  if (area != null && area > 0) {
    const side = Math.sqrt(area);
    const ring = rectangleFromCentroid(lat, lng, side, side);
    if (ring.length) return [ring];
  }

  return [];
}

function buildRingFromLandmarkSides(
  landmark: Record<string, unknown>,
  center: LatLng,
): LatLng[] | null {
  const sides = parseSideMeters(landmark.sides);
  if (sides.length >= 2) {
    const ring = rectangleFromCentroid(
      center.latitude,
      center.longitude,
      sides[0],
      sides[1],
    );
    return ring.length ? ring : null;
  }
  const area = coerceCoord(landmark.area);
  if (area != null && area > 0) {
    const side = Math.sqrt(area);
    const ring = rectangleFromCentroid(
      center.latitude,
      center.longitude,
      side,
      side,
    );
    return ring.length ? ring : null;
  }
  return null;
}

export type ResolvedLandmarkMap = {
  polygonRings: LatLng[][];
  mapCenter: LatLng | null;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  hasMapGeometry: boolean;
  dimensionsLine: string | null;
};

export function resolveLandmarkMapGeometry(
  landmark: Record<string, unknown>,
  habitatPlot?: HabitatPlot | null,
): ResolvedLandmarkMap {
  let polygonRings: LatLng[][] = [];

  if (habitatPlot) {
    polygonRings = buildRingFromHabitatPlot(habitatPlot);
  }

  const corner = landmarkCornerRing(landmark);
  if (!polygonRings.length && corner) {
    polygonRings = [corner];
  }

  let mapCenter: LatLng | null = null;
  if (polygonRings.length) {
    const flat = polygonRings.flat();
    mapCenter = {
      latitude: flat.reduce((s, p) => s + p.latitude, 0) / flat.length,
      longitude: flat.reduce((s, p) => s + p.longitude, 0) / flat.length,
    };
  } else if (
    habitatPlot?.centroid_lat != null &&
    habitatPlot?.centroid_lng != null
  ) {
    const lat = coerceCoord(habitatPlot.centroid_lat);
    const lng = coerceCoord(habitatPlot.centroid_lng);
    if (lat != null && lng != null) {
      mapCenter = { latitude: lat, longitude: lng };
    }
  }

  if (!polygonRings.length && mapCenter) {
    const fromSides = buildRingFromLandmarkSides(landmark, mapCenter);
    if (fromSides) polygonRings = [fromSides];
  }

  const sideStrings = Array.isArray(landmark.sides)
    ? (landmark.sides as string[])
    : undefined;

  let mapRegion: ResolvedLandmarkMap["mapRegion"] = null;
  const all = polygonRings.flat();
  if (all.length) {
    mapRegion = regionForLandmarkDetailMap(all);
  }

  const dimensionsLine =
    habitatPlot?.dimensions_string?.trim() ||
    (sideStrings?.length ? sideStrings.join(" × ") : null);

  const hasMapGeometry = polygonRings.length > 0 && mapRegion != null;

  return {
    polygonRings,
    mapCenter,
    mapRegion,
    hasMapGeometry,
    dimensionsLine,
  };
}
