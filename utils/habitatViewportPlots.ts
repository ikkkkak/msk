import type { Region } from "react-native-maps";
import type { HabitatPlot } from "../types/habitat";
import { bboxFromRegion, coordinateInViewport } from "./habitatGeo";
import {
  buildPlotShapeDescriptors,
  type PlotShapeDescriptor,
} from "./habitatPlotGeometryCache";
import {
  MAX_NATIVE_MAP_CHILDREN,
  MAX_NATIVE_MAP_CHILDREN_SECTOR,
  MAX_PLOTS_DRAWN,
} from "./habitatMapLimits";
import { isCadastreGpuMapActive } from "./habitatCadastreRenderer";

/** Pinned quartier — every plot in the quartier (geometry filter happens downstream). */
export function selectPlotsForSectorDraw(plots: HabitatPlot[]): HabitatPlot[] {
  return plots;
}

/** Browse mode — viewport sample with cap. */
export function selectPlotsToDraw(
  plots: HabitatPlot[],
  region: Region,
  max = MAX_PLOTS_DRAWN,
): HabitatPlot[] {
  if (plots.length === 0 || max <= 0) return [];

  const bbox = bboxFromRegion(region);
  const inView: HabitatPlot[] = [];
  for (const p of plots) {
    const lat = p.centroid_lat;
    const lng = p.centroid_lng;
    if (lat == null || lng == null) continue;
    if (!coordinateInViewport(lat, lng, bbox, 0.02)) continue;
    inView.push(p);
  }

  const pool = inView.length > 0 ? inView : plots;
  if (pool.length <= max) return pool;

  const stride = Math.ceil(pool.length / max);
  const out: HabitatPlot[] = [];
  for (let i = 0; i < pool.length && out.length < max; i += stride) {
    out.push(pool[i]!);
  }
  return out;
}

export function capPlotShapes(
  shapes: PlotShapeDescriptor[],
  max = MAX_NATIVE_MAP_CHILDREN,
): PlotShapeDescriptor[] {
  if (shapes.length <= max) return shapes;

  const out: PlotShapeDescriptor[] = [];
  let nativeCount = 0;
  for (const shape of shapes) {
    const cost = Math.max(1, shape.rings.length) + (shape.labelAt ? 1 : 0);
    if (nativeCount + cost > max) break;
    out.push(shape);
    nativeCount += cost;
  }
  return out;
}

/** Pinned quartier — GPU draws all plots; RN maps cap native children to avoid OOM. */
export function capPlotShapesForSector(
  shapes: PlotShapeDescriptor[],
): PlotShapeDescriptor[] {
  if (isCadastreGpuMapActive()) return shapes;
  return capPlotShapes(shapes, MAX_NATIVE_MAP_CHILDREN_SECTOR);
}

export function mergePlotIntoList(
  plots: HabitatPlot[],
  plot: HabitatPlot | null | undefined,
): HabitatPlot[] {
  if (!plot?.id) return plots;
  if (plots.some((p) => p.id === plot.id)) return plots;
  return [plot, ...plots];
}

export function buildDrawPlotShapes(
  plots: HabitatPlot[],
  region: Region,
): PlotShapeDescriptor[] {
  const picked = selectPlotsToDraw(plots, region);
  return capPlotShapes(buildPlotShapeDescriptors(picked));
}
