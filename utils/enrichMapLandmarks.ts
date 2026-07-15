import { habitatApi } from "../services/habitatApi";
import type { HabitatPlot } from "../types/habitat";
import { extractPlotPolygons } from "./habitatGeometry";
import {
  landmarkHasPlotGeometry,
  type MapLandmarkRecord,
} from "./landmarkMapMarkers";

function plotRingFromHabitat(plot: HabitatPlot) {
  const rings = extractPlotPolygons(plot);
  const ring = rings[0];
  return ring && ring.length >= 3 ? ring : null;
}

/** Formatted side lengths from the linked cadastre plot's own geometry. */
function plotSidesFromHabitat(plot: HabitatPlot): string[] | null {
  const sides = plot.sides_m;
  if (!Array.isArray(sides) || sides.length === 0) return null;
  const formatted = sides
    .filter((s): s is number => Number.isFinite(s) && s > 0)
    .map((s) => `${s.toFixed(1)}m`);
  return formatted.length > 0 ? formatted : null;
}

/** Fill missing parcel outlines from cadastre plot geometry (batch). */
export async function enrichMapLandmarksWithPlotGeometry(
  landmarks: MapLandmarkRecord[],
): Promise<MapLandmarkRecord[]> {
  const plotIds = [
    ...new Set(
      landmarks
        .filter((lm) => !landmarkHasPlotGeometry(lm))
        .map((lm) => Number(lm.habitat_plot_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
  if (plotIds.length === 0) return landmarks;

  const plots = await habitatApi.getPlotGeometryBatch(plotIds);
  const byId = new Map(plots.map((p) => [p.id, p]));

  return landmarks.map((lm) => {
    if (landmarkHasPlotGeometry(lm)) return lm;

    const plotId = Number(lm.habitat_plot_id);
    const plot = byId.get(plotId);
    if (!plot) return lm;

    const ring = plotRingFromHabitat(plot);
    if (!ring) return lm;

    const centroidLat = Number(lm.centroid_lat ?? plot.centroid_lat);
    const centroidLng = Number(lm.centroid_lng ?? plot.centroid_lng);
    const sidesFromPlot =
      lm.sides?.length ? lm.sides : plotSidesFromHabitat(plot);

    return {
      ...lm,
      plot_ring: ring.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      centroid_lat: Number.isFinite(centroidLat) ? centroidLat : ring[0].latitude,
      centroid_lng: Number.isFinite(centroidLng) ? centroidLng : ring[0].longitude,
      area: lm.area ?? plot.area_m2 ?? plot.area_rounded ?? undefined,
      sides: sidesFromPlot ?? lm.sides,
    };
  });
}
