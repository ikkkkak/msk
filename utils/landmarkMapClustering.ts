import Supercluster from "supercluster";
import type { Region } from "react-native-maps";
import type { LatLng } from "../types/habitat";
import { bboxFromRegion, regionFromBounds, zoomFromRegion } from "./habitatGeo";
import {
  dedupeLandmarksByPlot,
  dedupeMapLandmarks,
  landmarkCentroid,
  landmarkMapFitCoordinates,
  landmarkMapPinKey,
  LAND_MAP_MAX_VISIBLE,
  type MapLandmarkRecord,
} from "./landmarkMapMarkers";

/**
 * Zoom tier for land clustering (Web Mercator, see zoomFromRegion).
 * - Below this → nearby lands may cluster (moderate zoom out).
 * - At/above this → individual pins + plot outlines without extra zoom.
 */
export const LAND_CLUSTER_MAX_ZOOM = 13;

/** Supercluster merge radius (px). Higher = clusters form sooner when zooming out. */
export const LAND_CLUSTER_RADIUS_PX = 72;

/** Target longitudeDelta when opening a cluster (~zoom 13). */
export const LAND_CLUSTER_REVEAL_DELTA = 360 / 2 ** LAND_CLUSTER_MAX_ZOOM;

export type LandMapCluster = {
  type: "cluster";
  clusterId: number;
  count: number;
  coordinate: LatLng;
  landmarkIds: number[];
};

export type LandMapClusterPoint = {
  type: "land";
  landmark: MapLandmarkRecord;
  coordinate: LatLng;
};

export type LandMapDisplayItem = LandMapCluster | LandMapClusterPoint;

type LandFeatureProps = { landmarkId: number };

type LandPointEntry = {
  lm: MapLandmarkRecord;
  lat: number;
  lng: number;
};

function resolveMapZoom(mapZoom: number, region: Region): number {
  const fromProp = Number(mapZoom);
  if (Number.isFinite(fromProp) && fromProp > 0) {
    return Math.round(Math.max(0, Math.min(20, fromProp)));
  }
  return zoomFromRegion(region.longitudeDelta);
}

function allLandEntries(landmarks: MapLandmarkRecord[]): LandPointEntry[] {
  const out: LandPointEntry[] = [];
  for (const lm of dedupeLandmarksByPlot(landmarks)) {
    const c = landmarkCentroid(lm);
    if (!c) continue;
    out.push({ lm, lat: c.latitude, lng: c.longitude });
  }
  return out;
}

/** Legacy viewport filter — only for very large catalogs. */
function entriesInView(
  landmarks: MapLandmarkRecord[],
  region: Region,
): LandPointEntry[] {
  const bbox = bboxFromRegion(region);
  const padLat = region.latitudeDelta * 0.15;
  const padLng = region.longitudeDelta * 0.15;
  const out: LandPointEntry[] = [];

  for (const lm of dedupeLandmarksByPlot(landmarks)) {
    const c = landmarkCentroid(lm);
    if (!c) continue;
    if (
      c.latitude < bbox.minLat - padLat ||
      c.latitude > bbox.maxLat + padLat ||
      c.longitude < bbox.minLng - padLng ||
      c.longitude > bbox.maxLng + padLng
    ) {
      continue;
    }
    out.push({ lm, lat: c.latitude, lng: c.longitude });
  }
  return out;
}

function centerOfEntries(
  ids: number[],
  byId: Map<number, LandPointEntry>,
  fallback: LatLng,
): LatLng {
  let lat = 0;
  let lng = 0;
  let n = 0;
  for (const id of ids) {
    const e = byId.get(id);
    if (!e) continue;
    lat += e.lat;
    lng += e.lng;
    n += 1;
  }
  return n > 0
    ? { latitude: lat / n, longitude: lng / n }
    : fallback;
}

export function formatLandClusterCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n > 99) return "99+";
  return String(n);
}

/** Cluster bubble size (px radius). */
export function landClusterBubbleRadius(count: number): number {
  if (count >= 20) return 22;
  if (count >= 10) return 20;
  if (count >= 5) return 18;
  return 16;
}

export function clusterLandmarksForMap(
  landmarks: MapLandmarkRecord[],
  region: Region,
  mapZoom: number,
  selectedLandId?: number | null,
): LandMapDisplayItem[] {
  const zoom = resolveMapZoom(mapZoom, region);
  const allEntries = allLandEntries(landmarks);
  if (allEntries.length === 0) return [];

  // Small catalog: always show every pin at every zoom — no viewport culling, no clustering churn.
  const useFullCatalog = allEntries.length <= LAND_MAP_MAX_VISIBLE;
  const inView = useFullCatalog ? allEntries : entriesInView(landmarks, region);
  if (inView.length === 0) return [];

  const byId = new Map(inView.map((e) => [e.lm.id, e]));
  const items: LandMapDisplayItem[] = [];

  const selected =
    selectedLandId != null
      ? byId.get(selectedLandId) ??
        allEntries.find((e) => e.lm.id === selectedLandId) ??
        null
      : null;
  const pool = selected
    ? inView.filter((e) => e.lm.id !== selectedLandId)
    : inView;

  if (selected) {
    items.push({
      type: "land",
      landmark: selected.lm,
      coordinate: { latitude: selected.lat, longitude: selected.lng },
    });
  }

  if (pool.length === 0) return items;

  // Small catalog OR zoomed in → stable individual pins (no supercluster rebuild on pan/zoom).
  if (useFullCatalog || zoom >= LAND_CLUSTER_MAX_ZOOM) {
    for (const e of pool) {
      items.push({
        type: "land",
        landmark: e.lm,
        coordinate: { latitude: e.lat, longitude: e.lng },
      });
    }
    return items;
  }

  const index = new Supercluster<LandFeatureProps>({
    radius: LAND_CLUSTER_RADIUS_PX,
    maxZoom: LAND_CLUSTER_MAX_ZOOM - 1,
    minZoom: 0,
    minPoints: 2,
  });

  index.load(
    pool.map((e) => ({
      type: "Feature" as const,
      properties: { landmarkId: e.lm.id },
      geometry: {
        type: "Point" as const,
        coordinates: [e.lng, e.lat],
      },
    })),
  );

  const bbox = bboxFromRegion(region);
  const query: [number, number, number, number] = [
    bbox.minLng,
    bbox.minLat,
    bbox.maxLng,
    bbox.maxLat,
  ];

  for (const feat of index.getClusters(query, zoom)) {
    const [lng, lat] = feat.geometry.coordinates;
    const props = feat.properties as LandFeatureProps & {
      cluster?: boolean;
      cluster_id?: number;
      point_count?: number;
    };

    if (props.cluster && props.cluster_id != null) {
      const ids = [
        ...new Set(
          index
            .getLeaves(props.cluster_id, Infinity)
            .map((leaf) => Number(leaf.properties?.landmarkId))
            .filter((id) => id > 0),
        ),
      ];

      const pinKeys = new Set(
        ids.map((id) => {
          const entry = byId.get(id);
          return entry ? landmarkMapPinKey(entry.lm) : `id:${id}`;
        }),
      );

      items.push({
        type: "cluster",
        clusterId: props.cluster_id,
        count: pinKeys.size,
        coordinate: centerOfEntries(ids, byId, {
          latitude: lat,
          longitude: lng,
        }),
        landmarkIds: ids,
      });
      continue;
    }

    const entry = byId.get(props.landmarkId);
    if (entry) {
      items.push({
        type: "land",
        landmark: entry.lm,
        coordinate: { latitude: entry.lat, longitude: entry.lng },
      });
    }
  }

  return items;
}

export function regionForLandCluster(
  landmarks: MapLandmarkRecord[],
  landmarkIds: number[],
): Region | null {
  const ids = [...new Set(landmarkIds.filter((id) => id > 0))];
  if (ids.length === 0) return null;

  const idSet = new Set(ids);
  const coords: LatLng[] = [];

  for (const lm of dedupeLandmarksByPlot(landmarks)) {
    if (!idSet.has(lm.id)) continue;
    const fit = landmarkMapFitCoordinates(lm);
    if (fit.length) coords.push(...fit);
    else {
      const c = landmarkCentroid(lm);
      if (c) coords.push(c);
    }
  }

  const fit = regionFromBounds(coords);
  if (!fit) return null;

  // Moderate zoom-in on cluster tap: enough to split the cluster, not street-level tight.
  const pad = ids.length <= 2 ? 0.9 : ids.length <= 5 ? 1.0 : 1.1;
  const minDelta = LAND_CLUSTER_REVEAL_DELTA * 0.72;
  const maxDelta = LAND_CLUSTER_REVEAL_DELTA * 1.35;

  return {
    ...fit,
    latitudeDelta: Math.min(Math.max(fit.latitudeDelta * pad, minDelta), maxDelta),
    longitudeDelta: Math.min(Math.max(fit.longitudeDelta * pad, minDelta), maxDelta),
  };
}
