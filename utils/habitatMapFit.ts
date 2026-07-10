import type { Region } from "react-native-maps";
import { Dimensions } from "react-native";
import type { HabitatPlan, HabitatPlot, HabitatSector, LatLng } from "../types/habitat";
import {
  extractPlotPolygons,
  extractSectorPolygons,
  plotLabelCoordinate,
  plotAnchorCoordinate,
  normalizeMauritaniaLatLng,
} from "./habitatGeometry";
import { regionFromBounds, regionWithPlotFriendlyZoom } from "./habitatGeo";
import { resolvePlanBoundaryRings } from "./habitatPlanBoundaries";

/** Helper to validate coordinates and prevent native map crashes */
function isValidLatLng(c: LatLng | null | undefined): boolean {
  if (!c) return false;
  const lat = Number(c.latitude);
  const lng = Number(c.longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Quartier view: show whole neighborhood without over-zooming parcels. */
const SECTOR_PARCEL_ZOOM = { minDelta: 0.02, maxDelta: 0.07 };

/** Full-sector camera: entire quartier visible with margin. */
const SECTOR_FULL_VIEW_ZOOM = { minDelta: 0.03, maxDelta: 0.1 };

/** Airbnb-style map motion — smooth fly-in, short refine. */
export const HABITAT_MAP_ZONE_FLY_MS = 560;
export const HABITAT_MAP_FLY_MS = 620;
export const HABITAT_MAP_ADJUST_MS = 280;
/** Visible glide when jumping between selected parcels. */
export const HABITAT_PLOT_FOCUS_MS = 420;

const SECTOR_FIT_EDGE_PADDING = {
  top: 72,
  right: 48,
  bottom: 148,
  left: 48,
};

type DistrictFallback = { name: string; coordinates: LatLng[] };

export function regionForHabitatSector(
  sector: HabitatSector,
  plan: HabitatPlan | undefined,
  districtFallback: DistrictFallback[],
  opts?: { parcelLevel?: boolean },
): Region {
  const parcel = opts?.parcelLevel === true;
  const zoomOpts = parcel ? SECTOR_PARCEL_ZOOM : { minDelta: 0.025, maxDelta: 0.1 };

  let coords = extractSectorPolygons(sector).flat().filter(isValidLatLng);
  // Never zoom to whole district when targeting a quartier — that hides the sector.
  if (!coords.length && !parcel && plan) {
    coords = resolvePlanBoundaryRings(plan, districtFallback).flat().filter(isValidLatLng);
  }
  if (!coords.length) {
    const lat = sector.centroid_lat ?? sector.original_lat;
    const lng = sector.centroid_lng ?? sector.original_lng;
    const normalized = normalizeMauritaniaLatLng(lat, lng);
    if (normalized) {
      return regionWithPlotFriendlyZoom(
        {
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          latitudeDelta: parcel ? 0.018 : 0.022,
          longitudeDelta: parcel ? 0.018 : 0.022,
        },
        zoomOpts,
      );
    }
  }
  const fit = regionFromBounds(coords);
  if (!fit) {
    return regionWithPlotFriendlyZoom(
      {
        latitude: 18.098,
        longitude: -15.978,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      },
      zoomOpts,
    );
  }
  return regionWithPlotFriendlyZoom(fit, zoomOpts);
}

/** Fit map to plot centroids when sector has no boundary polygon. */
export function regionForPlotCentroids(plots: HabitatPlot[]): Region | null {
  const coords: LatLng[] = [];
  for (const p of plots) {
    const normalized = normalizeMauritaniaLatLng(p.centroid_lat, p.centroid_lng);
    if (normalized && isValidLatLng(normalized)) {
      coords.push(normalized);
    }
  }
  const fit = regionFromBounds(coords);
  if (!fit) return null;
  return regionWithPlotFriendlyZoom(fit, SECTOR_PARCEL_ZOOM);
}

/** Fit map to loaded plot geometries — allow wide enough to see whole quartier. */
export function regionForHabitatPlots(plots: HabitatPlot[]): Region | null {
  const coords = collectPlotMapCoordinates(plots, 2000).filter(isValidLatLng);
  const fit = regionFromBounds(coords);
  if (!fit) return null;
  return regionWithPlotFriendlyZoom(fit, SECTOR_FULL_VIEW_ZOOM);
}

/** Bounds that include sector outline + all plot geometry (full quartier in view). */
export function regionForSectorAndPlots(
  sector: HabitatSector,
  plan: HabitatPlan | undefined,
  plots: HabitatPlot[],
  districtFallback: DistrictFallback[] = [],
): Region {
  const coords: LatLng[] = [];
  for (const c of extractSectorPolygons(sector).flat()) {
    if (isValidLatLng(c)) coords.push(c);
  }
  for (const c of collectPlotMapCoordinates(plots, 1200)) {
    if (isValidLatLng(c)) coords.push(c);
  }
  const fromBounds = coords.length ? regionFromBounds(coords) : null;
  if (fromBounds) {
    return regionWithPlotFriendlyZoom(fromBounds, SECTOR_FULL_VIEW_ZOOM);
  }
  return regionForHabitatSector(sector, plan, districtFallback, {
    parcelLevel: false,
  });
}

/** Skip a redundant camera animation when the map is already near the target. */
export function habitatRegionsSimilar(a: Region, b: Region): boolean {
  const latSpan = Math.max(a.latitudeDelta, 0.001);
  const lngSpan = Math.max(a.longitudeDelta, 0.001);
  const latShift = Math.abs(a.latitude - b.latitude) / latSpan;
  const lngShift = Math.abs(a.longitude - b.longitude) / lngSpan;
  const latDeltaShift = Math.abs(a.latitudeDelta - b.latitudeDelta) / latSpan;
  const lngDeltaShift = Math.abs(a.longitudeDelta - b.longitudeDelta) / lngSpan;
  return (
    latShift < 0.12 &&
    lngShift < 0.12 &&
    latDeltaShift < 0.18 &&
    lngDeltaShift < 0.18
  );
}

/** Coordinates for fitToCoordinates (parcel corners + centroids). */
export function collectPlotMapCoordinates(
  plots: HabitatPlot[],
  maxPoints = 800,
): LatLng[] {
  const out: LatLng[] = [];
  for (const p of plots) {
    const rings = extractPlotPolygons(p);
    if (rings.length) {
      for (const ring of rings) {
        for (const c of ring) {
          if (isValidLatLng(c)) {
            out.push(c);
            if (out.length >= maxPoints) return out;
          }
        }
      }
    } else if (p.centroid_lat != null && p.centroid_lng != null) {
      const c = normalizeMauritaniaLatLng(p.centroid_lat, p.centroid_lng);
      if (c && isValidLatLng(c)) {
        out.push(c);
        if (out.length >= maxPoints) return out;
      }
    }
  }
  return out;
}

const MAP_EDGE_PADDING = { top: 100, right: 56, bottom: 120, left: 56 };

/** Room for the bottom plot preview sheet. */
export const PLOT_CARD_EDGE_PADDING = {
  top: 56,
  right: 36,
  bottom: 290,
  left: 36,
} as const;

/** On-map callout — reserve top for filter + card; plot sits in lower map area. */
export const PLOT_CALLOUT_EDGE_PADDING = {
  top: 420,
  right: 40,
  bottom: 120,
  left: 40,
} as const;

/** Screen-aware padding so parcel + floating card both stay in view. */
export function plotCalloutEdgePadding(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const h = Dimensions.get("window").height;
  return {
    // Reserve upper half for filter bar + floating detail card
    top: Math.round(Math.min(540, Math.max(420, h * 0.52))),
    right: 36,
    // Keep parcel in the lower third of the map
    bottom: Math.round(Math.min(220, Math.max(128, h * 0.18))),
    left: 36,
  };
}

/** Card headroom (deg lat) — included in fit bounds so the parcel sits lower on screen. */
const PLOT_CALLOUT_NORTH_OFFSET_DEG = 0.00115;

function plotFocusCoordinates(plot: HabitatPlot): LatLng[] {
  const out: LatLng[] = [];
  for (const ring of extractPlotPolygons(plot)) {
    for (const c of ring) {
      if (isValidLatLng(c)) out.push(c);
    }
  }
  const center = plotAnchorCoordinate(plot) ?? plotLabelCoordinate(plot);
  if (center && isValidLatLng(center)) {
    out.push(center);
    out.push({
      latitude: center.latitude + PLOT_CALLOUT_NORTH_OFFSET_DEG,
      longitude: center.longitude,
    });
  }
  if (out.length) return out;
  return center ? [center] : [];
}

export type HabitatMapRef = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates?: (
    coordinates: LatLng[],
    options?: {
      edgePadding?: typeof MAP_EDGE_PADDING;
      animated?: boolean;
    },
  ) => void;
};

/** Smooth camera fly — resolves when native animation should be complete. */
export function animateHabitatMapToRegion(
  mapRef: HabitatMapRef | null | undefined,
  region: Region,
  duration = HABITAT_MAP_FLY_MS,
): Promise<void> {
  if (!mapRef?.animateToRegion) {
    return Promise.resolve();
  }
  mapRef.animateToRegion(region, duration);
  return new Promise((resolve) => {
    setTimeout(resolve, duration + 24);
  });
}

type MapRefLike =
  | HabitatMapRef
  | null
  | undefined
  | { current: HabitatMapRef | null | undefined };

function resolveMapInstance(mapRef: MapRefLike): HabitatMapRef | null {
  if (!mapRef) return null;
  if ("current" in mapRef) return mapRef.current ?? null;
  return mapRef;
}

export { resolveMapInstance };

/** Wait for MapView ref, then animate — quartier select must not silently no-op. */
export async function animateHabitatMapToRegionWithRetry(
  mapRef: MapRefLike,
  region: Region,
  duration = HABITAT_MAP_FLY_MS,
  maxWaitMs = 1200,
): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    const map = resolveMapInstance(mapRef);
    if (map?.animateToRegion) {
      map.animateToRegion(region, duration);
      await new Promise((resolve) => setTimeout(resolve, duration + 24));
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 48));
  }
  return false;
}

/** Slide map to quartier center (sector polygon, centroid, or plot centroids). */
export async function flyMapToQuartier(
  mapRef: MapRefLike,
  sector: HabitatSector,
  plan: HabitatPlan | undefined,
  plots: HabitatPlot[],
  districtFallback: DistrictFallback[] = [],
  duration = HABITAT_MAP_FLY_MS,
): Promise<Region> {
  let target = regionForHabitatSector(sector, plan, districtFallback);
  if (plots.length > 0) {
    const fromPlots =
      regionForSectorAndPlots(sector, plan, plots, districtFallback) ??
      regionForPlotCentroids(plots);
    if (fromPlots) target = fromPlots;
  }
  await animateHabitatMapToRegionWithRetry(mapRef, target, duration);
  return target;
}

/** Fit camera so the full sector boundary + plots stay in view. */
export function fitMapToHabitatPlots(
  mapRef: HabitatMapRef | null | undefined,
  plots: HabitatPlot[],
  fallbackRegion: Region,
  sector?: HabitatSector,
  duration = HABITAT_MAP_ADJUST_MS,
): Promise<void> {
  if (!mapRef) return Promise.resolve();

  const fitCoords: LatLng[] = [];
  if (sector) {
    for (const c of extractSectorPolygons(sector).flat()) {
      if (isValidLatLng(c)) fitCoords.push(c);
    }
  }
  for (const c of collectPlotMapCoordinates(plots, 800)) {
    if (isValidLatLng(c)) fitCoords.push(c);
  }

  const looseRegion = regionWithPlotFriendlyZoom(
    regionFromBounds(fitCoords) ??
      regionForHabitatPlots(plots) ??
      fallbackRegion,
    SECTOR_FULL_VIEW_ZOOM,
  );

  return animateHabitatMapToRegion(mapRef, looseRegion, duration);
}

/**
 * Fallback region — center north of parcel so the plot sits lower on screen
 * and the floating card can sit above it in the reserved top area.
 */
export function regionForFocusedPlot(plot: HabitatPlot): Region | null {
  const center = plotAnchorCoordinate(plot) ?? plotLabelCoordinate(plot);
  if (!center || !isValidLatLng(center)) return null;

  const delta = 0.00165;
  const latShift = delta * 0.42;

  return {
    latitude: center.latitude + latShift,
    longitude: center.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function plotFocusNeedsCameraMove(
  plot: HabitatPlot,
  currentRegion: Region,
): boolean {
  const target = regionForFocusedPlot(plot);
  if (!target) return false;
  if (!habitatRegionsSimilar(currentRegion, target)) return true;

  const latSpan = Math.max(currentRegion.latitudeDelta, 0.0004);
  const lngSpan = Math.max(currentRegion.longitudeDelta, 0.0004);
  const latShift =
    Math.abs(currentRegion.latitude - target.latitude) / latSpan;
  const lngShift =
    Math.abs(currentRegion.longitude - target.longitude) / lngSpan;
  return latShift > 0.04 || lngShift > 0.04;
}

export function focusMapOnSelectedPlot(
  mapRef: HabitatMapRef | null | undefined,
  plot: HabitatPlot,
  currentRegion: Region,
): Promise<void> {
  if (!mapRef) return Promise.resolve();

  const coords = plotFocusCoordinates(plot);
  if (!coords.length) return Promise.resolve();

  const duration = HABITAT_PLOT_FOCUS_MS;

  if (mapRef.fitToCoordinates) {
    mapRef.fitToCoordinates(coords, {
      edgePadding: plotCalloutEdgePadding(),
      animated: true,
    });
    return new Promise((resolve) => {
      setTimeout(resolve, duration + 24);
    });
  }

  const target = regionForFocusedPlot(plot);
  if (!target) return Promise.resolve();

  if (!plotFocusNeedsCameraMove(plot, currentRegion)) {
    return Promise.resolve();
  }

  const animDuration = habitatRegionsSimilar(currentRegion, target)
    ? HABITAT_MAP_ADJUST_MS
    : duration;

  return animateHabitatMapToRegion(mapRef, target, animDuration);
}

export function regionForHabitatPlan(
  plan: HabitatPlan,
  districtFallback: DistrictFallback[],
): Region {
  const coords = resolvePlanBoundaryRings(plan, districtFallback).flat().filter(isValidLatLng);
  const fit = regionFromBounds(coords);
  if (!fit) {
    if (plan.centroid_lat != null && plan.centroid_lng != null) {
      const c = { latitude: plan.centroid_lat, longitude: plan.centroid_lng };
      if (isValidLatLng(c)) {
        return {
          latitude: plan.centroid_lat,
          longitude: plan.centroid_lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
      }
    }
    return {
      latitude: 18.098,
      longitude: -15.978,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    };
  }
  return {
    ...fit,
    latitudeDelta: Math.min(Math.max(fit.latitudeDelta, 0.055), 0.08),
    longitudeDelta: Math.min(Math.max(fit.longitudeDelta, 0.055), 0.08),
  };
}
