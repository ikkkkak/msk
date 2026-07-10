import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { HabitatPlan, HabitatSector, LatLng } from "../types/habitat";
import { extractSectorPolygons } from "./habitatGeometry";
import { resolvePlanBoundaryRings } from "./habitatPlanBoundaries";
import { habitatPlanColor } from "./habitatMapTheme";

type DistrictFallback = { name: string; coordinates: LatLng[] };

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

export function habitatPlansGeoJSON(
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

export function habitatSectorsGeoJSON(
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
