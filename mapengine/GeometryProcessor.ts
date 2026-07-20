/**
 * GeometryProcessor — converts domain records (plans, sectors, sub-sectors,
 * lands) into GeoJSON FeatureCollections for Mapbox sources. Pure functions,
 * no native imports; heavy per-plot geometry NEVER passes through here —
 * plots render from server MVT vector tiles, not client GeoJSON.
 */
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type {
  HabitatPlan,
  HabitatSector,
  HabitatSubSector,
  LatLng,
} from "../types/habitat";
import { extractSectorPolygons } from "../utils/habitatGeometry";
import { resolvePlanBoundaryRings } from "../utils/habitatPlanBoundaries";
import { habitatPlanColor } from "../utils/habitatMapTheme";
import {
  landmarkPlotRing,
  type MapLandmarkRecord,
} from "../utils/landmarkMapMarkers";
import {
  formatLandClusterCount,
  type LandMapCluster,
} from "../utils/landmarkMapClustering";

type DistrictFallback = { name: string; coordinates: LatLng[] };

export const EMPTY_FEATURES: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function ringToPolygon(ring: LatLng[]): Polygon | null {
  if (ring.length < 3) return null;
  const coords = ring.map((c) => [c.longitude, c.latitude] as [number, number]);
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push(first);
  }
  return { type: "Polygon", coordinates: [coords] };
}

export function plansGeoJSON(
  plans: HabitatPlan[],
  districtFallback: DistrictFallback[],
  selectedPlanId: number | null,
): FeatureCollection {
  const features: Feature[] = [];
  for (const plan of plans) {
    const rings = resolvePlanBoundaryRings(plan, districtFallback);
    const color = habitatPlanColor(plan);
    rings.forEach((ring, idx) => {
      const geom = ringToPolygon(ring);
      if (!geom) return;
      features.push({
        type: "Feature",
        id: `plan-${plan.id}-${idx}`,
        properties: {
          plan_id: plan.id,
          name: plan.name_ar || plan.name,
          color,
          selected: plan.id === selectedPlanId,
        },
        geometry: geom,
      });
    });
  }
  return { type: "FeatureCollection", features };
}

export function sectorsGeoJSON(
  sectors: HabitatSector[],
  selectedSectorId: number | null,
): FeatureCollection {
  const features: Feature[] = [];
  for (const sector of sectors) {
    const rings = extractSectorPolygons(sector);
    rings.forEach((ring, idx) => {
      const geom = ringToPolygon(ring);
      if (!geom) return;
      features.push({
        type: "Feature",
        id: `sector-${sector.id}-${idx}`,
        properties: {
          sector_id: sector.id,
          plan_id: sector.plan_id,
          name: sector.name_ar || sector.name,
          selected: sector.id === selectedSectorId,
        },
        geometry: geom,
      });
    });
  }
  return { type: "FeatureCollection", features };
}

/** Ilot subdivisions have no boundary — centroid Point pins. */
export function subSectorsGeoJSON(
  subSectors: HabitatSubSector[],
): FeatureCollection {
  const features: Feature[] = [];
  for (const s of subSectors) {
    if (s.centroid_lat == null || s.centroid_lng == null) continue;
    features.push({
      type: "Feature",
      id: `sub-sector-${s.id}`,
      properties: {
        sub_sector_id: s.id,
        name: s.name,
        plot_count: s.plot_count ?? 0,
      },
      geometry: {
        type: "Point",
        coordinates: [s.centroid_lng, s.centroid_lat],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/** Selected land's parcel polygon (single feature). */
export function landPolygonGeoJSON(
  land: MapLandmarkRecord | null | undefined,
): FeatureCollection {
  if (!land) return EMPTY_FEATURES;
  const ring = landmarkPlotRing(land);
  if (!ring || ring.length < 3) return EMPTY_FEATURES;
  const geom = ringToPolygon(ring);
  if (!geom) return EMPTY_FEATURES;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: land.id,
        properties: { id: land.id },
        geometry: geom,
      },
    ],
  };
}

export type LandDisplayItem =
  | { type: "land"; landmark: MapLandmarkRecord; coordinate: LatLng }
  | (LandMapCluster & { type: "cluster" });

export function landPinsGeoJSON(
  items: LandDisplayItem[],
  hiddenLandId: number | null,
): FeatureCollection {
  const features: Feature[] = [];
  for (const item of items) {
    if (item.type !== "land") continue;
    features.push({
      type: "Feature",
      id: item.landmark.id,
      properties: {
        id: item.landmark.id,
        kind: "land",
        pin_visible: item.landmark.id === hiddenLandId ? 0 : 1,
      },
      geometry: {
        type: "Point",
        coordinates: [item.coordinate.longitude, item.coordinate.latitude],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

export function landClustersGeoJSON(items: LandDisplayItem[]): FeatureCollection {
  const features: Feature[] = [];
  for (const item of items) {
    if (item.type !== "cluster") continue;
    features.push({
      type: "Feature",
      id: `cluster-${item.clusterId}`,
      properties: {
        kind: "cluster",
        cluster_id: item.clusterId,
        count: item.count,
        label: formatLandClusterCount(item.count),
      },
      geometry: {
        type: "Point",
        coordinates: [item.coordinate.longitude, item.coordinate.latitude],
      },
    });
  }
  return { type: "FeatureCollection", features };
}
