import type { HabitatPlot, LatLng } from "../types/habitat";
import { parseGeoField } from "./habitatGeo";

const MIN_RING_POINTS = 4;
const MIN_BOUNDING_SPAN = 0.000015; // ~1.5m — ignore degenerate / placeholder squares

/** Strict validation for LatLng coordinates to prevent native map crashes */
export function isValidCoordinate(c: LatLng | null | undefined): boolean {
  if (!c) return false;
  const lat = Number(c.latitude);
  const lng = Number(c.longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -89.9 &&
    lat <= 89.9 &&
    lng >= -179.9 &&
    lng <= 179.9
  );
}

/** Nouakchott / Mauritania bounds for coordinate sanity checks */
function isMauritaniaLatLng(c: LatLng): boolean {
  return (
    c.latitude >= 14 &&
    c.latitude <= 27 &&
    c.longitude >= -17.5 &&
    c.longitude <= -4
  );
}

/** RFC 7946 GeoJSON positions are [longitude, latitude]. */
function geoJsonPairToLatLng(lng: number, lat: number): LatLng | null {
  const geoJson = { latitude: lat, longitude: lng };
  if (isValidCoordinate(geoJson) && isMauritaniaLatLng(geoJson)) {
    return geoJson;
  }
  const swapped = { latitude: lng, longitude: lat };
  if (isValidCoordinate(swapped) && isMauritaniaLatLng(swapped)) {
    return swapped;
  }
  if (isValidCoordinate(geoJson)) return geoJson;
  if (isValidCoordinate(swapped)) return swapped;
  return null;
}

/** Nouakchott: lat ~16–20, lng ~−17 to −14 — legacy [lat,lng] arrays */
function pairToLatLng(a: number, b: number): LatLng | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const aIsLat = a >= 10 && a <= 35;
  const bIsLat = b >= 10 && b <= 35;
  const aIsLng = a <= -5 && a >= -25;
  const bIsLng = b <= -5 && b >= -25;

  let pt: LatLng | null = null;
  // Stored as [lat, lng] (common in some exports)
  if (aIsLat && bIsLng) pt = { latitude: a, longitude: b };
  // Standard GeoJSON [lng, lat]
  else if (aIsLng && bIsLat) pt = { latitude: b, longitude: a };
  // Fallback GeoJSON
  else if (Math.abs(a) <= 180 && Math.abs(b) <= 90) {
    pt = { latitude: b, longitude: a };
  }
  
  if (pt && isValidCoordinate(pt)) return pt;
  return null;
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
  return [...ring, first];
}

function isValidRing(ring: LatLng[]): boolean {
  if (ring.length < MIN_RING_POINTS) return false;
  let minLat = ring[0].latitude;
  let maxLat = ring[0].latitude;
  let minLng = ring[0].longitude;
  let maxLng = ring[0].longitude;
  for (const c of ring) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }
  const span = Math.max(maxLat - minLat, maxLng - minLng);
  return span >= MIN_BOUNDING_SPAN;
}

function coordsArrayToRing(arr: unknown[], geoJson = false): LatLng[] {
  const out: LatLng[] = [];
  for (const item of arr) {
    if (Array.isArray(item) && item.length >= 2) {
      const a = Number(item[0]);
      const b = Number(item[1]);
      const pt = geoJson ? geoJsonPairToLatLng(a, b) : pairToLatLng(a, b);
      if (pt && isValidCoordinate(pt)) out.push(pt);
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const lat = Number(o.lat ?? o.latitude ?? o.Lat ?? o.y);
      const lng = Number(o.lng ?? o.longitude ?? o.Lng ?? o.lon ?? o.x);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const pt = { latitude: lat, longitude: lng };
        if (isValidCoordinate(pt)) out.push(pt);
      }
    }
  }
  return out;
}

function polygonRingToLatLng(ring: unknown, geoJson = false): LatLng[] {
  if (!Array.isArray(ring)) return [];
  const coords = coordsArrayToRing(ring, geoJson).filter(isValidCoordinate);
  return isValidRing(coords) ? closeRing(coords) : [];
}

function ringsFromGeometry(geom: unknown): LatLng[][] {
  const parsed = parseGeoField(geom);
  if (!parsed || typeof parsed !== "object") return [];

  const g = parsed as { type?: string; coordinates?: unknown; geometries?: unknown[]; features?: unknown[]; geometry?: unknown };

  if (g.type === "Feature" && g.geometry) {
    return ringsFromGeometry(g.geometry);
  }

  if (g.type === "FeatureCollection" && Array.isArray(g.features)) {
    const out: LatLng[][] = [];
    for (const f of g.features) {
      out.push(...ringsFromGeometry(f));
    }
    return out;
  }

  if (g.type === "GeometryCollection" && Array.isArray(g.geometries)) {
    const out: LatLng[][] = [];
    for (const sub of g.geometries) {
      out.push(...ringsFromGeometry(sub));
    }
    return out;
  }

  if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
    const ring = polygonRingToLatLng((g.coordinates as unknown[])[0], true);
    return ring.length ? [ring] : [];
  }

  if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
    const out: LatLng[][] = [];
    for (const poly of g.coordinates as unknown[]) {
      if (!Array.isArray(poly) || !poly[0]) continue;
      const ring = polygonRingToLatLng(poly[0], true);
      if (ring.length) out.push(ring);
    }
    return out;
  }

  // Bare coordinates array (missing type) — treat as GeoJSON polygon outer ring
  if (Array.isArray(g.coordinates) && Array.isArray((g.coordinates as unknown[])[0])) {
    const first = (g.coordinates as unknown[])[0];
    if (Array.isArray(first) && Array.isArray(first[0])) {
      const out: LatLng[][] = [];
      for (const poly of g.coordinates as unknown[]) {
        if (!Array.isArray(poly) || !poly[0]) continue;
        const ring = polygonRingToLatLng(poly[0], true);
        if (ring.length) out.push(ring);
      }
      return out;
    }
    const ring = polygonRingToLatLng((g.coordinates as unknown[])[0], true);
    return ring.length ? [ring] : [];
  }

  return [];
}

/** Public: any GeoJSON-like value → polygon rings */
export function geoJsonToPolygons(geom: unknown): LatLng[][] {
  return ringsFromGeometry(geom)
    .map(ring => ring.filter(isValidCoordinate))
    .filter(isValidRing);
}

/** Parse plot `corners` JSONB (arrays, landmark-style points, etc.) */
export function cornersToPolygons(corners: unknown): LatLng[][] {
  const c = parseGeoField(corners);
  if (!c) return [];

  if (Array.isArray(c)) {
    const ring = closeRing(coordsArrayToRing(c).filter(isValidCoordinate));
    return isValidRing(ring) ? [ring] : [];
  }

  if (typeof c === "object") {
    const obj = c as Record<string, unknown>;
    const points: LatLng[] = [];

    for (let i = 1; i <= 12; i++) {
      const lat = obj[`point${i}_lat`] ?? obj[`p${i}_lat`];
      const lng = obj[`point${i}_lng`] ?? obj[`p${i}_lng`];
      if (lat != null && lng != null) {
        const la = Number(lat);
        const ln = Number(lng);
        if (Number.isFinite(la) && Number.isFinite(ln)) {
          const pt = { latitude: la, longitude: ln };
          if (isValidCoordinate(pt)) {
            points.push(pt);
          }
        }
      }
    }

    if (points.length >= 3) {
      const ring = closeRing(points);
      return isValidRing(ring) ? [ring] : [];
    }

    if (Array.isArray(obj.coordinates)) {
      return geoJsonToPolygons({ type: "Polygon", coordinates: obj.coordinates });
    }
  }

  return [];
}

/** Rectangle from centroid + length/width in meters (better than fixed-degree square). */
function rectangleFromCentroid(
  lat: number,
  lng: number,
  lengthM: number,
  widthM: number,
): LatLng[] {
  if (lengthM <= 0 || widthM <= 0) return [];
  const dLat = lengthM / 2 / 111_320;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  if (Math.abs(cosLat) < 1e-6) return []; // Avoid division by zero at poles
  const dLng = widthM / 2 / (111_320 * cosLat);
  const ring = closeRing([
    { latitude: lat - dLat, longitude: lng - dLng },
    { latitude: lat - dLat, longitude: lng + dLng },
    { latitude: lat + dLat, longitude: lng + dLng },
    { latitude: lat + dLat, longitude: lng - dLng },
  ]);
  return ring.filter(isValidCoordinate);
}

export type PlotPolygonOptions = {
  /** When false, skip centroid-derived placeholder rectangles (bulk map draw). */
  allowCentroidFallback?: boolean;
};

/** All renderable rings for a plot. */
export function extractPlotPolygons(
  plot: HabitatPlot,
  opts: PlotPolygonOptions = {},
): LatLng[][] {
  const allowCentroidFallback = opts.allowCentroidFallback !== false;
  let result: LatLng[][] = [];

  const fromGeom = geoJsonToPolygons(parseGeoField(plot.geom_geojson));
  if (fromGeom.length) {
    result = fromGeom;
  } else {
    const fromCorners = cornersToPolygons(plot.corners);
    if (fromCorners.length) {
      result = fromCorners;
    } else if (allowCentroidFallback) {
      const lat = plot.centroid_lat;
      const lng = plot.centroid_lng;
      if (
        lat != null &&
        lng != null &&
        plot.length_m != null &&
        plot.width_m != null &&
        plot.length_m > 0 &&
        plot.width_m > 0
      ) {
        const ring = rectangleFromCentroid(lat, lng, plot.length_m, plot.width_m);
        result = isValidRing(ring) ? [ring] : [];
      } else if (lat != null && lng != null) {
        const area = plot.area_m2 ?? plot.area_rounded;
        if (area != null && area > 0) {
          const side = Math.sqrt(area);
          const ring = rectangleFromCentroid(lat, lng, side, side);
          result = isValidRing(ring) ? [ring] : [];
        } else {
          const ring = rectangleFromCentroid(lat, lng, 45, 45);
          result = isValidRing(ring) ? [ring] : [];
        }
      }
    }
  }

  // Filter rings to guarantee every coordinate is strictly valid
  return result
    .map(ring => ring.filter(isValidCoordinate))
    .filter(ring => ring.length >= 4);
}

export function extractSectorPolygons(sector: {
  bounds_geojson?: unknown;
}): LatLng[][] {
  return geoJsonToPolygons(parseGeoField(sector.bounds_geojson))
    .map(ring => ring.filter(isValidCoordinate))
    .filter(ring => ring.length >= 4);
}

const MAX_SECTOR_MAP_POINTS = 320;
const MAX_SECTOR_MAP_RINGS = 6;

function boundingBoxRing(points: LatLng[]): LatLng[] {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const c of points) {
    if (!isValidCoordinate(c)) continue;
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }
  if (!Number.isFinite(minLat)) return [];
  return [
    { latitude: minLat, longitude: minLng },
    { latitude: minLat, longitude: maxLng },
    { latitude: maxLat, longitude: maxLng },
    { latitude: maxLat, longitude: minLng },
  ];
}

function decimateRing(ring: LatLng[], maxPoints: number): LatLng[] {
  if (ring.length <= maxPoints) return ring;
  const step = Math.max(1, Math.ceil(ring.length / maxPoints));
  const out: LatLng[] = [];
  for (let i = 0; i < ring.length; i += step) {
    out.push(ring[i]!);
  }
  return out.length >= 4 ? out : ring.slice(0, maxPoints);
}

/** Safe sector rings for native map layers — dense bounds_geojson can crash MKMapView. */
export function safeSectorDisplayPolygons(sector: {
  bounds_geojson?: unknown;
}): LatLng[][] {
  const rings = extractSectorPolygons(sector);
  if (!rings.length) return [];

  const totalPoints = rings.reduce((n, r) => n + r.length, 0);
  if (
    totalPoints > MAX_SECTOR_MAP_POINTS ||
    rings.length > MAX_SECTOR_MAP_RINGS
  ) {
    const flat = rings.flat().filter(isValidCoordinate);
    const box = boundingBoxRing(flat);
    return box.length >= 4 ? [box] : rings.slice(0, 1);
  }

  const perRingMax = Math.max(
    8,
    Math.floor(MAX_SECTOR_MAP_POINTS / Math.max(1, rings.length)),
  );
  return rings
    .slice(0, MAX_SECTOR_MAP_RINGS)
    .map((ring) => decimateRing(ring, perRingMax))
    .filter((ring) => ring.length >= 4);
}

/** Geographic center of a sector polygon (largest ring, area-weighted). */
export function sectorCenterCoordinate(sector: {
  bounds_geojson?: unknown;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  original_lat?: number | null;
  original_lng?: number | null;
}): LatLng | null {
  const rings = extractSectorPolygons(sector);
  if (rings.length) {
    let bestRing = rings[0];
    let bestArea = ringAreaAbs(bestRing);
    for (let i = 1; i < rings.length; i++) {
      const area = ringAreaAbs(rings[i]);
      if (area > bestArea) {
        bestArea = area;
        bestRing = rings[i];
      }
    }
    const c = polygonCentroid(bestRing) ?? ringCentroid(bestRing);
    if (c && isValidCoordinate(c)) return c;
  }
  if (
    sector.centroid_lat != null &&
    sector.centroid_lng != null &&
    Number.isFinite(sector.centroid_lat) &&
    Number.isFinite(sector.centroid_lng)
  ) {
    const c = { latitude: sector.centroid_lat, longitude: sector.centroid_lng };
    if (isValidCoordinate(c)) return c;
  }
  if (
    sector.original_lat != null &&
    sector.original_lng != null &&
    Number.isFinite(sector.original_lat) &&
    Number.isFinite(sector.original_lng)
  ) {
    const c = { latitude: sector.original_lat, longitude: sector.original_lng };
    if (isValidCoordinate(c)) return c;
  }
  return null;
}

/** Center of a closed ring (for plot labels). */
export function ringCentroid(ring: LatLng[]): LatLng | null {
  if (ring.length < 3) return null;
  let lat = 0;
  let lng = 0;
  let n = 0;
  for (const c of ring) {
    if (!isValidCoordinate(c)) continue;
    lat += c.latitude;
    lng += c.longitude;
    n += 1;
  }
  if (!n) return null;
  return { latitude: lat / n, longitude: lng / n };
}

/** Haversine distance in meters between two coordinates. */
function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6378137 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Edge lengths along a closed polygon ring (meters). */
export function sideLengthsFromRing(ring: LatLng[]): number[] {
  if (ring.length < 2) return [];
  let pts = ring;
  if (
    ring.length > 3 &&
    Math.abs(ring[0].latitude - ring[ring.length - 1].latitude) < 1e-9 &&
    Math.abs(ring[0].longitude - ring[ring.length - 1].longitude) < 1e-9
  ) {
    pts = ring.slice(0, -1);
  }
  if (pts.length < 2) return [];
  const sides: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const d = haversineMeters(pts[i], pts[j]);
    if (d > 0.01) sides.push(d);
  }
  return sides;
}

export function formatSideLengthsM(sides: number[]): string {
  return sides
    .filter((s) => Number.isFinite(s) && s > 0)
    .map((s) => `${Number(s).toFixed(1)}m`)
    .join(" ");
}

/** Best-effort side lengths from plot polygon geometry. */
export function plotSideLengthsFromGeometry(plot: HabitatPlot): number[] {
  const rings = extractPlotPolygons(plot);
  if (!rings.length) return [];
  let bestRing = rings[0];
  let bestArea = ringAreaAbs(bestRing);
  for (let i = 1; i < rings.length; i++) {
    const area = ringAreaAbs(rings[i]);
    if (area > bestArea) {
      bestArea = area;
      bestRing = rings[i];
    }
  }
  return sideLengthsFromRing(bestRing);
}

/** Signed ring area in degree-space (fine for comparing rings). */
function ringAreaAbs(ring: LatLng[]): number {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area +=
      ring[i].longitude * ring[j].latitude -
      ring[j].longitude * ring[i].latitude;
  }
  return Math.abs(area / 2);
}

/** Area-weighted polygon centroid — accurate for irregular parcels. */
export function polygonCentroid(ring: LatLng[]): LatLng | null {
  if (ring.length < 3) return null;

  let twiceArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const x0 = ring[i].longitude;
    const y0 = ring[i].latitude;
    const x1 = ring[j].longitude;
    const y1 = ring[j].latitude;
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  if (Math.abs(twiceArea) < 1e-14) {
    return ringCentroid(ring);
  }

  const c = {
    latitude: cy / (3 * twiceArea),
    longitude: cx / (3 * twiceArea),
  };
  if (isValidCoordinate(c)) return c;
  return null;
}

/** Fix swapped or mis-typed Nouakchott coordinates (lat ~16–21, lng ~−17 to −14). */
export function normalizeMauritaniaLatLng(
  lat: number | null | undefined,
  lng: number | null | undefined,
): LatLng | null {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const latOk = lat >= 10 && lat <= 35;
  const lngOk = lng <= -5 && lng >= -25;
  if (latOk && lngOk) {
    const c = { latitude: lat, longitude: lng };
    return isValidCoordinate(c) ? c : null;
  }
  if (lng >= 10 && lng <= 35 && lat <= -5 && lat >= -25) {
    const c = { latitude: lng, longitude: lat };
    return isValidCoordinate(c) ? c : null;
  }
  const c = { latitude: lat, longitude: lng };
  return isValidCoordinate(c) ? c : null;
}

/** Best anchor from polygon geometry — geometry wins over DB centroid columns. */
export function plotGeometryAnchor(plot: HabitatPlot): LatLng | null {
  const rings = extractPlotPolygons(plot, { allowCentroidFallback: true });
  if (!rings.length) return null;

  let bestRing = rings[0];
  let bestArea = ringAreaAbs(bestRing);
  for (let i = 1; i < rings.length; i++) {
    const area = ringAreaAbs(rings[i]);
    if (area > bestArea) {
      bestArea = area;
      bestRing = rings[i];
    }
  }

  const c = polygonCentroid(bestRing) ?? ringCentroid(bestRing);
  if (c && isValidCoordinate(c)) return c;
  return null;
}

/** Anchor for pin + callout — polygon center first, then normalized DB centroid. */
export function plotAnchorCoordinate(plot: HabitatPlot): LatLng | null {
  const fromGeom = plotGeometryAnchor(plot);
  if (fromGeom) return fromGeom;

  const fromDb = normalizeMauritaniaLatLng(plot.centroid_lat, plot.centroid_lng);
  if (fromDb) return fromDb;
  return null;
}

export function plotLabelCoordinate(plot: HabitatPlot): LatLng | null {
  const anchor = plotAnchorCoordinate(plot);
  if (anchor && isValidCoordinate(anchor)) return anchor;

  const rings = extractPlotPolygons(plot, { allowCentroidFallback: true });
  if (rings[0]) {
    const c = ringCentroid(rings[0]);
    if (c && isValidCoordinate(c)) return c;
  }
  if (plot.centroid_lat != null && plot.centroid_lng != null) {
    const c = normalizeMauritaniaLatLng(plot.centroid_lat, plot.centroid_lng);
    if (c && isValidCoordinate(c)) return c;
  }
  return null;
}
