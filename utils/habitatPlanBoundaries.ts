import type { HabitatPlan, LatLng } from "../types/habitat";
import { geoJsonToPolygons, parseGeoField } from "./habitatGeo";

/** Nouakchott plan codes → names in SearchScreen DISTRICTS polygons. */
export const PLAN_CODE_TO_DISTRICT_NAME: Record<string, string> = {
  TEV: "Tevragh Zeina",
  ARF: "Arafat",
  DNM: "Dar Naim",
  MNA: "El Mina",
  RYD: "Riyadh",
  SBK: "Sebkha",
  TYR: "Teyarett",
  TJN: "Toujounine",
  KSR: "Ksar",
};

/** Arafat outline (from SearchScreen DISTRICTS — was commented out there). */
const ARAFAT_RING: LatLng[] = [
  { latitude: 18.031870178121583, longitude: -15.973218473982287 },
  { latitude: 18.030500136852005, longitude: -15.964762199094842 },
  { latitude: 18.029314317842648, longitude: -15.964371062335081 },
  { latitude: 18.03098887925344, longitude: -15.955842023308302 },
  { latitude: 18.029842868857628, longitude: -15.951761770355272 },
  { latitude: 18.064976805946085, longitude: -15.930315853258318 },
  { latitude: 18.066606152928763, longitude: -15.93036080138485 },
  { latitude: 18.068373724797727, longitude: -15.936688133061338 },
  { latitude: 18.050678438076734, longitude: -15.93234900512523 },
  { latitude: 18.07104427350708, longitude: -15.935819623694742 },
  { latitude: 18.079087056893723, longitude: -15.96531771327986 },
  { latitude: 18.03389942678162, longitude: -15.97288166785128 },
  { latitude: 18.031870178121583, longitude: -15.973218473982287 },
];

const EXTRA_RINGS_BY_CODE: Record<string, LatLng[][]> = {
  ARF: [ARAFAT_RING],
};

type DistrictFallback = { name: string; coordinates: LatLng[] };

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]/g, "");
}

function findDistrictRing(
  plan: HabitatPlan,
  districts: DistrictFallback[],
): LatLng[] | null {
  const byCode = PLAN_CODE_TO_DISTRICT_NAME[plan.code];
  if (byCode) {
    const d = districts.find(
      (x) => normalizeName(x.name) === normalizeName(byCode),
    );
    if (d?.coordinates?.length) return d.coordinates;
  }
  const key = normalizeName(plan.name);
  for (const d of districts) {
    const dn = normalizeName(d.name);
    if (
      dn.includes(key.slice(0, 4)) ||
      key.includes(dn.slice(0, 4)) ||
      (plan.name_ar && dn.includes(normalizeName(plan.name_ar).slice(0, 3)))
    ) {
      return d.coordinates;
    }
  }
  return null;
}

export function resolvePlanBoundaryRings(
  plan: HabitatPlan,
  districts: DistrictFallback[],
): LatLng[][] {
  const geom = parseGeoField(plan.bounds_geojson);
  const fromGeo = geoJsonToPolygons(geom);
  if (fromGeo.length) return fromGeo;

  const extra = EXTRA_RINGS_BY_CODE[plan.code];
  if (extra?.length) return extra;

  const district = findDistrictRing(plan, districts);
  if (district?.length) return [district];

  return [];
}

export function centroidOfRing(ring: LatLng[]): LatLng | null {
  if (!ring.length) return null;
  let lat = 0;
  let lng = 0;
  let n = 0;
  for (const c of ring) {
    if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) continue;
    lat += c.latitude;
    lng += c.longitude;
    n++;
  }
  if (!n) return null;
  return { latitude: lat / n, longitude: lng / n };
}
