import type { HabitatPlan, HabitatSector, HabitatPlot } from "../../types/habitat";
import {
  formatSideLengthsM,
  sideLengthsFromRing,
} from "../../utils/habitatGeometry";
import { getPlotRings } from "../../utils/habitatPlotGeometryCache";

/** Plot number for UI — cadastre uses plain numbers (502), never #502. */
export function displayPlotNumber(
  plotNumber: string | null | undefined,
): string {
  if (plotNumber == null) return "";
  return String(plotNumber).trim().replace(/^#+/, "");
}

export function trimLabel(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function formatAppliedCadastreLabel(
  plan?: HabitatPlan,
  sector?: HabitatSector,
): string {
  if (!plan && !sector) return "";
  const zone =
    plan?.code?.trim() ||
    trimLabel(plan?.name_ar || plan?.name || "", 8);
  if (sector) {
    const quartier =
      sector.code?.trim() ||
      trimLabel(sector.name_ar || sector.name || "", 10);
    return zone ? `${zone} · ${quartier}` : quartier;
  }
  return zone;
}

export function localizedHabitatName(
  isRtl: boolean,
  name?: string | null,
  nameAr?: string | null,
): string {
  const primary = isRtl ? nameAr || name : name || nameAr;
  return (primary || "").trim();
}

/** Format cadastre side lengths — prefers sides_m, then dimensions_string, then geometry. */
export function formatPlotDimensions(
  plot: {
    dimensions_string?: string;
    sides_m?: number[] | null;
    length_m?: number | null;
    width_m?: number | null;
    geom_geojson?: unknown;
    corners?: unknown;
    id?: number;
  },
): string {
  const sides = plot.sides_m;
  if (Array.isArray(sides) && sides.length >= 3) {
    return sides
      .filter((s) => Number.isFinite(s) && s > 0)
      .map((s) => `${Number(s).toFixed(1)}m`)
      .join(" ");
  }
  const fromString = plot.dimensions_string?.trim();
  if (fromString) return fromString;
  const len = plot.length_m;
  const wid = plot.width_m;
  if (len != null && wid != null && len > 0 && wid > 0) {
    return `${Number(len).toFixed(1)}m ${Number(wid).toFixed(1)}m`;
  }
  if (plot.id != null || plot.geom_geojson || plot.corners) {
    const rings = getPlotRings(plot as HabitatPlot);
    let best = rings[0];
    let bestLen = best?.length ?? 0;
    for (let i = 1; i < rings.length; i++) {
      if (rings[i].length > bestLen) {
        best = rings[i];
        bestLen = rings[i].length;
      }
    }
    if (best?.length) {
      const fromGeom = formatSideLengthsM(sideLengthsFromRing(best));
      if (fromGeom) return fromGeom;
    }
  }
  return "—";
}
