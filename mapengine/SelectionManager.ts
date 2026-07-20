/**
 * SelectionManager — turns Mapbox feature-press payloads back into domain
 * records. Hit-testing itself happens on the GPU (Mapbox resolves which
 * rendered feature was tapped); this module only interprets the result —
 * no O(plots) scans anywhere.
 */
import type { HabitatPlot } from "../types/habitat";

/** MVT plot feature (server vector tiles) → lightweight HabitatPlot stub. */
export function plotFromMvtFeature(feature: GeoJSON.Feature): HabitatPlot | null {
  const props = feature.properties ?? {};
  const id = Number(feature.id ?? (props as any).id ?? 0);
  if (!id) return null;
  return {
    id,
    plot_number: String((props as any).plot_number ?? ""),
    sector_id: Number((props as any).sector_id ?? 0),
    plan_id: Number((props as any).plan_id ?? 0),
    is_for_sale: Boolean((props as any).is_for_sale),
    area_m2: (props as any).area_m2 != null ? Number((props as any).area_m2) : null,
    area_rounded:
      (props as any).area_rounded != null
        ? Number((props as any).area_rounded)
        : null,
  } as HabitatPlot;
}

export function subSectorIdFromFeature(
  feature: GeoJSON.Feature | undefined,
): number | null {
  const id = Number(feature?.properties?.sub_sector_id ?? 0);
  return id > 0 ? id : null;
}

export type LandPress =
  | { kind: "cluster"; clusterId: number }
  | { kind: "land"; landId: number }
  | null;

export function landPressFromFeature(
  feature: GeoJSON.Feature | undefined,
): LandPress {
  if (!feature) return null;
  const kind = String(feature.properties?.kind ?? "");
  if (kind === "cluster") {
    const clusterId = Number(feature.properties?.cluster_id ?? 0);
    return clusterId ? { kind: "cluster", clusterId } : null;
  }
  const landId = Number(feature.id ?? feature.properties?.id ?? 0);
  return landId ? { kind: "land", landId } : null;
}
