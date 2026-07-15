/**
 * Habitat cadastre — two-layer rendering:
 * Layer 1: lite plot metadata for entire quartier (no geometry)
 * Layer 2: viewport bbox geometry + progressive GPU/native draw (max ~400 polygons)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Region } from "react-native-maps";
import { habitatApi } from "../services/habitatApi";
import type {
  HabitatPlot,
  HabitatPlan,
  HabitatSector,
  HabitatSubSector,
  HabitatMapViewLevel,
} from "../types/habitat";
import {
  bboxFromRegion,
  cadastreMapTier,
  computeViewportHash,
  viewLevelFromZoom,
  zoomFromRegion,
} from "../utils/habitatGeo";
import {
  regionForHabitatPlan,
  regionForHabitatSector,
  regionForSectorAndPlots,
  regionForPlotCentroids,
  fitMapToHabitatPlots,
  focusMapOnSelectedPlot,
  animateHabitatMapToRegion,
  animateHabitatMapToRegionWithRetry,
  flyMapToQuartier,
  HABITAT_MAP_FLY_MS,
  HABITAT_MAP_ZONE_FLY_MS,
  HABITAT_MAP_ADJUST_MS,
  resolveMapInstance,
  type HabitatMapRef,
} from "../utils/habitatMapFit";
import type { LatLng as BoundaryLatLng } from "../types/habitat";
import { useDebouncedValue } from "./useDebouncedValue";
import { habitatPlanColor } from "../utils/habitatMapTheme";
import {
  buildPlotShapeDescriptors,
  getPlotRings,
  hasStoredPlotGeometry,
  ingestPlotGeometryBatch,
  enrichPlotFromGeometryCache,
} from "../utils/habitatPlotGeometryCache";
import {
  MAX_PLOTS_DRAWN,
  MAX_PLOT_NUMBER_LABELS,
} from "../utils/habitatMapLimits";
import {
  capPlotShapesForSector,
  mergePlotIntoList,
  selectPlotsToDraw,
} from "../utils/habitatViewportPlots";
import { CadastrePerfTrace } from "../utils/habitatCadastrePerf";
import { isPlotRenderingHandledExternally } from "../utils/habitatCadastreRenderer";
import {
  MAX_NATIVE_MAP_CHILDREN_SECTOR,
  MID_ZOOM_PLOT_SAMPLE,
  PLOT_FULL_DETAIL_ZOOM,
  MIN_ZOOM_SECTOR_PLOT_GEOM,
} from "../utils/habitatMapLimits";
import {
  fetchSectorViewportGeometry,
  scheduleProgressiveReveal,
  MIN_SECTOR_VIEWPORT_ZOOM,
  PLOT_SHAPE_CHUNK_SIZE,
} from "../utils/habitatSectorViewportGeometry";

import {
  CADASTRE_LOG,
  devCadastreLog as devLog,
  logCadastreQuartierFetchStart,
  logCadastreQuartierPlotsLoaded,
  logCadastreZoneSelected,
  logPlotClickDetails,
} from "./habitatCadastreLog";

export { CADASTRE_LOG };

/** Default zone shown when opening the map with no cadastre filter applied. */
export const SHOWCASE_PLAN_CODE = "TEV";

/** Filter sheet — same counts, easy to spot in Metro. */
export function logFilterCadastreApply(
  zone: { id: number; name: string } | null,
  quartier: { id: number; name: string } | null,
  plotStats?: {
    foundInDb: number;
    loaded: number;
    drawnOnMap: number;
    withGeometry: number;
  }
) {
  devLog(
    `${CADASTRE_LOG} [Filter]`,
    quartier
      ? `Quartier "${quartier.name}" (id ${quartier.id})`
      : zone
        ? `Zone "${zone.name}" (id ${zone.id})`
        : "Clear",
    {
      zone,
      quartier,
      plotCountForThisQuartier: plotStats ?? "— pick a quartier to load plots —"
    }
  );
}

function logCadastreSelection(payload: {
  event: string;
  plan?: HabitatPlan | null;
  sector?: HabitatSector | null;
  sectorCountInPlan?: number;
  plotsLoaded?: number;
  plotsTotalInDb?: number;
  plotsTruncated?: boolean;
  plotsWithGeometry?: number;
  viewportPlots?: number;
}) {
  const zone = payload.plan
    ? {
        id: payload.plan.id,
        code: payload.plan.code,
        name: payload.plan.name_ar || payload.plan.name
      }
    : null;
  const quartier = payload.sector
    ? {
        id: payload.sector.id,
        plan_id: payload.sector.plan_id,
        name: payload.sector.name_ar || payload.sector.name
      }
    : null;

  devLog(CADASTRE_LOG, payload.event, {
    zone,
    quartier,
    sectorsInZone: payload.sectorCountInPlan ?? null,
    plots: {
      loadedForQuartier: payload.plotsLoaded ?? null,
      totalInDatabase: payload.plotsTotalInDb ?? null,
      truncated: payload.plotsTruncated ?? null,
      withRenderableGeometry: payload.plotsWithGeometry ?? null,
      viewportOnly: payload.viewportPlots ?? null
    }
  });
}

/** Stable fallbacks — `data ?? []` creates a new array every render and retriggers effects. */
const EMPTY_PLANS: HabitatPlan[] = [];
const EMPTY_SECTORS: HabitatSector[] = [];
const EMPTY_SUB_SECTORS: HabitatSubSector[] = [];

const NOUAKCHOTT_REGION: Region = {
  latitude: 18.098,
  longitude: -15.978,
  latitudeDelta: 0.065,
  longitudeDelta: 0.065,
};

export function planColor(plan: HabitatPlan): string {
  return habitatPlanColor(plan);
}

/** Debounce for plot viewport fetches only. */
const VIEWPORT_DEBOUNCE_MS = 400;
const SECTOR_PLOTS_STALE_MS = 10 * 60 * 1000;

type MapRef = React.RefObject<HabitatMapRef | null>;

type DistrictFallback = { name: string; coordinates: BoundaryLatLng[] };

async function fetchSectorPlotsCached(
  sectorId: number,
  queryClient: QueryClient,
): Promise<{
  plots: HabitatPlot[];
  total: number;
  truncated: boolean;
  fetchPath: string;
}> {
  // LRU quartier cache: a recently visited quartier resolves instantly from
  // the React Query cache with zero network requests; it refetches only
  // after SECTOR_PLOTS_STALE_MS.
  return queryClient.fetchQuery({
    queryKey: ["habitatSectorPlots", sectorId],
    queryFn: () => habitatApi.getAllPlotsForSector(sectorId),
    staleTime: SECTOR_PLOTS_STALE_MS,
    gcTime: SECTOR_PLOTS_STALE_MS,
  });
}

function buildSectorPlotShapes(plots: HabitatPlot[]) {
  const shapes = buildPlotShapeDescriptors(plots);
  if (plots.length <= MAX_PLOT_NUMBER_LABELS) return shapes;
  return shapes.map((shape) => ({ ...shape, labelAt: null }));
}

async function resolveSector(
  sectorId: number,
  planId: number | null,
  sectors: HabitatSector[],
  plans: HabitatPlan[],
  queryClient?: QueryClient,
): Promise<{ sector: HabitatSector; planId: number } | null> {
  let sector =
    sectors.find((s) => s.id === sectorId) ??
    undefined;
  let pid = sector?.plan_id ?? planId;

  const pickFromList = (list: HabitatSector[] | undefined) => {
    const found = list?.find((s) => s.id === sectorId);
    if (found) {
      sector = found;
      pid = found.plan_id;
      return true;
    }
    return false;
  };

  if (!sector && pid != null) {
    pickFromList(queryClient?.getQueryData<HabitatSector[]>(["habitatSectors", pid]));
  }

  const needsFullRecord =
    sector != null &&
    (sector.bounds_geojson == null ||
      (typeof sector.bounds_geojson === "object" &&
        Object.keys(sector.bounds_geojson as object).length === 0));

  if ((!sector || needsFullRecord) && pid != null) {
    if (!pickFromList(queryClient?.getQueryData(["habitatSectors", pid]))) {
      const list = await habitatApi.getSectors(pid);
      queryClient?.setQueryData(["habitatSectors", pid], list);
      pickFromList(list);
    }
  }

  if (!sector && planId != null) {
    pickFromList(queryClient?.getQueryData(["habitatSectors", planId]));
  }

  if (!sector) {
    for (const p of plans) {
      if (pickFromList(queryClient?.getQueryData(["habitatSectors", p.id]))) {
        break;
      }
      const list = await habitatApi.getSectors(p.id);
      queryClient?.setQueryData(["habitatSectors", p.id], list);
      if (pickFromList(list)) {
        break;
      }
    }
  }

  if (!sector || pid == null) return null;
  return { sector, planId: pid };
}

function regionMovedEnough(prev: Region | null, next: Region): boolean {
  if (!prev) return true;
  const latMove = Math.abs(prev.latitude - next.latitude);
  const lngMove = Math.abs(prev.longitude - next.longitude);
  const zoomMove =
    Math.abs(prev.latitudeDelta - next.latitudeDelta) +
    Math.abs(prev.longitudeDelta - next.longitudeDelta);
  return latMove > 0.0008 || lngMove > 0.0008 || zoomMove > 0.002;
}

export type ShowcaseCadastreApi = {
  selectedPlanId: number | null;
  plans: HabitatPlan[];
  sectors: HabitatSector[];
  applyPlanFilter: (
    planId: number,
    mapRef: MapRef,
    districtFallback?: DistrictFallback[]
  ) => Promise<void>;
  applyCadastreFilter: (
    planId: number,
    sectorId: number,
    mapRef: MapRef,
    districtFallback?: DistrictFallback[]
  ) => Promise<void>;
};

/** Zoom to showcase zone + auto-load first quartier when map opens with no filter. */
export async function showcaseCadastreOnMapOpen(
  cadastre: ShowcaseCadastreApi,
  mapRef: MapRef,
  districtFallback: DistrictFallback[] = []
): Promise<void> {
  // TEMPORARY DIAGNOSTIC — crash bisection, revert once sector 123 crash is
  // root-caused. Disables auto-opening sector 123 so a different quartier
  // can be picked manually from the filter sheet to test.
  if (__DEV__) return;
  if (cadastre.selectedPlanId != null) return;

  const run = async (): Promise<boolean> => {
    if (!mapRef.current) return false;

    let planList = cadastre.plans;
    if (planList.length === 0) {
      try {
        planList = await habitatApi.getPlans();
      } catch {
        return false;
      }
    }
    if (planList.length === 0) return false;

    const plan =
      planList.find((p) => p.code === SHOWCASE_PLAN_CODE) ?? planList[0];

    devLog(CADASTRE_LOG, "auto-showcase: zone + first quartier", {
      plan: plan.code,
    });
    await cadastre.applyPlanFilter(plan.id, mapRef, districtFallback);
    return true;
  };

  for (const delayMs of [0, 180, 400]) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    if (await run()) return;
  }
}

export function useHabitatCadastre() {
  const queryClient = useQueryClient();
  const [region, setRegion] = useState<Region>(NOUAKCHOTT_REGION);
  const debouncedRegion = useDebouncedValue(region, VIEWPORT_DEBOUNCE_MS);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
  const [selectedSubSectorId, setSelectedSubSectorId] = useState<number | null>(null);
  const [pinnedSubSector, setPinnedSubSector] = useState<HabitatSubSector | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<HabitatPlot | null>(null);
  const [sectorPlots, setSectorPlots] = useState<HabitatPlot[]>([]);
  const [viewportPlots, setViewportPlots] = useState<HabitatPlot[]>([]);
  const [pinnedSector, setPinnedSector] = useState<HabitatSector | null>(null);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [mapNavigating, setMapNavigating] = useState(false);
  const [plotsTruncated, setPlotsTruncated] = useState(false);
  const [sectorPlotTotal, setSectorPlotTotal] = useState(0);
  const [plotGeometryRevision, setPlotGeometryRevision] = useState(0);
  const [plotsGeometryReady, setPlotsGeometryReady] = useState(false);
  const [sectorMetadataReady, setSectorMetadataReady] = useState(false);
  const [revealedPlotShapeCount, setRevealedPlotShapeCount] = useState(0);
  const [loadingViewportGeometry, setLoadingViewportGeometry] = useState(false);

  const viewportGen = useRef(0);
  const applyGen = useRef(0);
  const plotViewportGen = useRef(0);
  const sectorViewportGen = useRef(0);
  const plotBboxAbort = useRef<AbortController | null>(null);
  const lastPlotFetchRegion = useRef<Region | null>(null);
  /** Sector id whose progressive reveal already ran once (legacy fallback only). */
  const revealedSectorRef = useRef<number | null>(null);
  /** Last count actually applied to the map — staged reveals resume from here. */
  const revealedCountRef = useRef(0);
  const lastPlotViewportHash = useRef("");
  const lastSectorViewportHash = useRef("");

  const zoom = zoomFromRegion(debouncedRegion.longitudeDelta);
  const viewLevel = viewLevelFromZoom(zoom);

  const plansQuery = useQuery({
    queryKey: ["habitatPlans"],
    queryFn: () => habitatApi.getPlans(),
    staleTime: 60 * 60 * 1000,
    retry: 2
  });

  const plans = plansQuery.data ?? EMPTY_PLANS;

  /** Filter sheet quartier list for the selected zone only. */
  const filterSectorsQuery = useQuery({
    queryKey: ["habitatSectors", selectedPlanId],
    queryFn: () => habitatApi.getSectors(selectedPlanId!),
    staleTime: 30 * 60 * 1000,
    enabled: selectedPlanId != null,
  });

  const sectors = filterSectorsQuery.data ?? EMPTY_SECTORS;
  const sectorsLoading = filterSectorsQuery.isLoading;

  /**
   * Sub-sectors ("Ilot" subdivisions) for the pinned quartier — only some
   * sectors have any (see habitat_sub_sectors backend note); when a sector
   * has none, effectiveViewLevel below falls straight through to plots.
   */
  const subSectorsQuery = useQuery({
    queryKey: ["habitatSubSectors", selectedSectorId],
    queryFn: () => habitatApi.getSubSectors(selectedSectorId!),
    staleTime: 30 * 60 * 1000,
    enabled: selectedSectorId != null,
  });
  const subSectors = subSectorsQuery.data ?? EMPTY_SUB_SECTORS;
  const subSectorsLoading = subSectorsQuery.isLoading;

  /** Sectors for map layers — pinned quartier, or zone quartier outlines when zone only. */
  const mapSectors = useMemo(() => {
    if (pinnedSector) return [pinnedSector];
    if (selectedSectorId != null) {
      const fromFilter = sectors.find((s) => s.id === selectedSectorId);
      return fromFilter ? [fromFilter] : [];
    }
    if (selectedPlanId != null) {
      return sectors.filter((s) => s.plan_id === selectedPlanId);
    }
    return [];
  }, [pinnedSector, selectedSectorId, selectedPlanId, sectors]);

  const mapTier = cadastreMapTier(zoom);

  /** Ensure pinned quartier record exists when filter restored with only an id. */
  useEffect(() => {
    if (selectedSectorId == null) return;
    if (pinnedSector?.id === selectedSectorId) return;

    let cancelled = false;
    void resolveSector(
      selectedSectorId,
      selectedPlanId,
      mapSectors,
      plans,
      queryClient,
    ).then((resolved) => {
      if (cancelled || !resolved) return;
      setPinnedSector(resolved.sector);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSectorId, selectedPlanId, pinnedSector?.id, mapSectors, plans, queryClient]);

  useEffect(() => {
    const list = plansQuery.data;
    if (!list?.length) return;
    const plan = list.find((p) => p.code === SHOWCASE_PLAN_CODE) ?? list[0];
    void queryClient.prefetchQuery({
      queryKey: ["habitatSectors", plan.id],
      queryFn: () => habitatApi.getSectors(plan.id),
      staleTime: 30 * 60 * 1000
    });
  }, [plansQuery.data, queryClient]);

  /** Drop browse-mode viewport plots when zooming out (quartier data stays in memory). */
  useEffect(() => {
    const z = zoomFromRegion(region.longitudeDelta);
    if (selectedSectorId != null) return;
    if (z >= 17) return;
    plotBboxAbort.current?.abort();
    lastPlotFetchRegion.current = null;
    lastPlotViewportHash.current = "";
    setViewportPlots((prev) => (prev.length === 0 ? prev : []));
  }, [region.longitudeDelta, region.latitudeDelta, selectedSectorId]);

  /**
   * Browse-mode viewport plots fetch when zoomed in (no quartier pinned).
   */
  useEffect(() => {
    const gen = ++plotViewportGen.current;
    plotBboxAbort.current?.abort();
    const ac = new AbortController();
    plotBboxAbort.current = ac;

    const z = zoomFromRegion(debouncedRegion.longitudeDelta);
    const bbox = bboxFromRegion(debouncedRegion);
    const canFetchPlots = z >= 17;

    if (!canFetchPlots) {
      if (selectedSectorId == null) {
        setViewportPlots((prev) => (prev.length === 0 ? prev : []));
        setPlotsTruncated(false);
      }
      return;
    }

    if (selectedSectorId != null) {
      return;
    }

    if (!regionMovedEnough(lastPlotFetchRegion.current, debouncedRegion)) {
      return;
    }

    const plotHash = computeViewportHash(debouncedRegion);
    if (plotHash === lastPlotViewportHash.current) {
      return;
    }

    devLog(CADASTRE_LOG, "[Viewport] plots bbox fetch", {
      zoom: z,
      bbox: {
        minLat: Number(bbox.minLat.toFixed(5)),
        minLng: Number(bbox.minLng.toFixed(5)),
        maxLat: Number(bbox.maxLat.toFixed(5)),
        maxLng: Number(bbox.maxLng.toFixed(5)),
      },
    });

    setLoadingPlots(true);

    habitatApi
      .getPlotsInBBox({
        minLat: bbox.minLat,
        minLng: bbox.minLng,
        maxLat: bbox.maxLat,
        maxLng: bbox.maxLng,
        zoom: z,
        planId: selectedPlanId ?? undefined,
      })
      .then(({ plots: list, truncated }) => {
        if (gen !== plotViewportGen.current) return;

        devLog(CADASTRE_LOG, "[Viewport] plots bbox response", {
          count: list.length,
          truncated,
        });

        lastPlotFetchRegion.current = debouncedRegion;
        lastPlotViewportHash.current = plotHash;
        setViewportPlots(list);
        setPlotsTruncated(!!truncated);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.warn(CADASTRE_LOG, "[Viewport] plots fetch FAILED", err);
        if (gen === plotViewportGen.current) {
          setViewportPlots([]);
        }
      })
      .finally(() => {
        if (gen === plotViewportGen.current) setLoadingPlots(false);
      });

    return () => {
      ac.abort();
    };
  }, [debouncedRegion, selectedPlanId, selectedSectorId]);

  /**
   * Pinned quartier — Layer 2: fetch geometry for visible bbox only (never entire quartier).
   */
  useEffect(() => {
    if (selectedSectorId == null || !sectorMetadataReady) return;
    if (isPlotRenderingHandledExternally()) return;

    const z = zoomFromRegion(debouncedRegion.longitudeDelta);
    if (z < MIN_SECTOR_VIEWPORT_ZOOM) {
      setPlotsGeometryReady(false);
      setRevealedPlotShapeCount(0);
      return;
    }

    if (!regionMovedEnough(lastPlotFetchRegion.current, debouncedRegion)) {
      return;
    }

    const plotHash = computeViewportHash(debouncedRegion);
    if (plotHash === lastSectorViewportHash.current) {
      return;
    }

    const gen = ++sectorViewportGen.current;
    setLoadingViewportGeometry(true);

    devLog(CADASTRE_LOG, "[Sector viewport] bbox geometry fetch", {
      sectorId: selectedSectorId,
      zoom: z,
    });

    void fetchSectorViewportGeometry({
      sectorId: selectedSectorId,
      planId: selectedPlanId,
      region: debouncedRegion,
      metadata: sectorPlots,
      maxPlots: MAX_NATIVE_MAP_CHILDREN_SECTOR,
    })
      .then((result) => {
        if (gen !== sectorViewportGen.current) return;

        lastPlotFetchRegion.current = debouncedRegion;
        lastSectorViewportHash.current = plotHash;
        setPlotGeometryRevision((n) => n + 1);
        setPlotsGeometryReady(true);

        devLog(CADASTRE_LOG, "[Sector viewport] geometry ready", {
          bboxPlots: result.bboxPlots,
          batchPlots: result.batchPlots,
          drawable: result.drawableCount,
        });
      })
      .catch((err) => {
        if (gen !== sectorViewportGen.current) return;
        console.warn(CADASTRE_LOG, "[Sector viewport] geometry fetch failed", err);
        setPlotsGeometryReady(true);
      })
      .finally(() => {
        if (gen === sectorViewportGen.current) {
          setLoadingViewportGeometry(false);
        }
      });
  }, [
    debouncedRegion,
    selectedSectorId,
    selectedPlanId,
    sectorMetadataReady,
    sectorPlots,
  ]);

  const onRegionChange = useCallback(() => {
    /* Intentionally no setState — avoids re-rendering map layers every pan frame. */
  }, []);

  const onRegionChangeComplete = useCallback((r: Region) => {
    devLog(CADASTRE_LOG, "[Map] pan/zoom complete", {
      lat: Number(r.latitude.toFixed(5)),
      lng: Number(r.longitude.toFixed(5)),
      latDelta: Number(r.latitudeDelta.toFixed(5)),
      lngDelta: Number(r.longitudeDelta.toFixed(5)),
    });
    setRegion(r);
  }, []);

  const applyCadastreFilter = useCallback(
    async (
      planId: number,
      sectorId: number,
      mapRef: MapRef,
      districtFallback: DistrictFallback[] = [],
      opts?: { skipCameraFit?: boolean; sectorHint?: HabitatSector },
    ) => {
      const gen = ++applyGen.current;
      ++viewportGen.current;
      ++plotViewportGen.current;
      plotBboxAbort.current?.abort();
      plotBboxAbort.current = null;
      // Geometry cache intentionally NOT cleared on quartier switch — its
      // 25K-entry FIFO cap bounds memory to roughly the last 3–5 quartiers,
      // so revisiting a recent quartier redraws instantly with no geometry
      // refetch (see fetchSectorViewportGeometry, which skips cached ids).
      ++sectorViewportGen.current;
      lastSectorViewportHash.current = "";
      lastPlotFetchRegion.current = null;

      setSelectedPlanId(planId);
      setSelectedSectorId(sectorId);
      setSelectedSubSectorId(null);
      setPinnedSubSector(null);
      setSelectedPlot(null);
      setSectorPlots([]);
      setSectorMetadataReady(false);
      setRevealedPlotShapeCount(0);
      setLoadingPlots(true);
      setMapNavigating(true);
      setPlotsGeometryReady(false);

      void habitatApi.getSectorPlotCount(sectorId).then((count) => {
        if (gen === applyGen.current && count > 0) {
          setSectorPlotTotal(count);
        }
      });

      const planHint = plans.find((p) => p.id === planId);
      const sectorHint =
        opts?.sectorHint ??
        sectors.find((s) => s.id === sectorId) ??
        mapSectors.find((s) => s.id === sectorId) ??
        null;

      if (sectorHint) {
        setPinnedSector(sectorHint);
      }

      const skipCamera = opts?.skipCameraFit === true;

      // Slide to quartier center immediately (don't wait for plot fetch).
      if (sectorHint && !skipCamera) {
        const quickTarget = regionForHabitatSector(
          sectorHint,
          planHint,
          districtFallback,
        );
        setRegion(quickTarget);
        void animateHabitatMapToRegionWithRetry(
          mapRef,
          quickTarget,
          HABITAT_MAP_FLY_MS,
        );
      }

      devLog(CADASTRE_LOG, "loading all plots for quartier...", {
        zone: { id: planId, name: planHint?.name_ar || planHint?.name },
        quartier: {
          id: sectorId,
          name: sectorHint?.name_ar || sectorHint?.name,
        },
      });

      logCadastreQuartierFetchStart({
        planId,
        planName: planHint?.name_ar || planHint?.name,
        sectorId,
        sectorName: sectorHint?.name_ar || sectorHint?.name,
      });

      const quartierPerf = new CadastrePerfTrace("quartier_load", "plots_api");

      try {
        const resolved = await resolveSector(
          sectorId,
          planId,
          mapSectors,
          plans,
          queryClient,
        );

        if (!resolved || gen !== applyGen.current) {
          if (!resolved) {
            console.warn(CADASTRE_LOG, "quartier not found", { planId, sectorId });
          }
          return;
        }

        const { sector, planId: pid } = resolved;
        setPinnedSector(sector);
        const plan = plans.find((p) => p.id === pid) ?? planHint;

        if (!sectorHint && !skipCamera) {
          const resolvedTarget = regionForHabitatSector(
            sector,
            plan,
            districtFallback,
          );
          setRegion(resolvedTarget);
          void animateHabitatMapToRegionWithRetry(
            mapRef,
            resolvedTarget,
            HABITAT_MAP_FLY_MS,
          );
        }

        // Unblock map — show quartier boundary immediately (like zone select).
        if (gen === applyGen.current) {
          setLoadingPlots(false);
          setMapNavigating(false);
        }

        const plotResult = await fetchSectorPlotsCached(sectorId, queryClient);
        if (gen !== applyGen.current) return;

        const { plots, total, truncated, fetchPath } = plotResult;
        quartierPerf.mark("decode");

        if (plots.length < total) {
          console.warn(CADASTRE_LOG, "quartier fetch incomplete", {
            sectorId,
            loaded: plots.length,
            total,
          });
        }

        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
        });
        if (gen !== applyGen.current) return;

        setSectorPlots(plots);
        setSectorPlotTotal(total);
        setPlotsTruncated(truncated || plots.length < total);

        const isActive = () => gen === applyGen.current;

        if (isPlotRenderingHandledExternally()) {
          setPlotsGeometryReady(true);
          setPlotGeometryRevision((n) => n + 1);
        }

        if (!skipCamera) {
          const cameraPlots = plots.length > 500 ? [] : plots;
          const target = await flyMapToQuartier(
            mapRef,
            sector,
            plan,
            cameraPlots,
            districtFallback,
            HABITAT_MAP_FLY_MS,
          );
          if (!isActive()) return;
          if (target) {
            setRegion(target);
            if (isPlotRenderingHandledExternally()) {
              void fitMapToHabitatPlots(
                resolveMapInstance(mapRef),
                plots,
                target,
                sector,
                HABITAT_MAP_ADJUST_MS,
              );
            }
          }
        }

        // Layer 2: viewport geometry fetch runs after camera + metadata are ready.
        lastSectorViewportHash.current = "";
        lastPlotFetchRegion.current = null;
        setSectorMetadataReady(true);
        quartierPerf.mark("camera");

        if (isPlotRenderingHandledExternally() && gen === applyGen.current) {
          const drawn = total;
          quartierPerf.mark("draw_prep");
          logCadastreQuartierPlotsLoaded({
            planId: pid,
            sectorId,
            sectorName: sector.name_ar || sector.name,
            plotsInDb: total,
            plotsLoaded: plots.length,
            plotsTruncated: truncated || plots.length < total,
            plotsWithGeometry: total,
            plotsDrawn: drawn,
            fetchPath,
          });
          logCadastreSelection({
            event: "quartier selected — GPU vector tiles",
            plan: plan ?? null,
            sector,
            sectorCountInPlan: sectors.filter((s) => s.plan_id === pid).length,
            plotsLoaded: plots.length,
            plotsTotalInDb: total,
            plotsTruncated: truncated || plots.length < total,
            plotsWithGeometry: total,
            viewportPlots: drawn,
          });
          logFilterCadastreApply(
            { id: pid, name: plan?.name_ar || plan?.name || String(pid) },
            { id: sectorId, name: sector.name_ar || sector.name },
            {
              foundInDb: total,
              loaded: plots.length,
              drawnOnMap: drawn,
              withGeometry: total,
            },
          );
          quartierPerf.finish({
            sector_id: sectorId,
            plots_loaded: plots.length,
            plots_drawn: drawn,
            plots_with_geometry: total,
            fetch_path: fetchPath,
            render_mode: "vector_tiles_gpu",
          });
        } else if (gen === applyGen.current) {
          logCadastreQuartierPlotsLoaded({
            planId: pid,
            sectorId,
            sectorName: sector.name_ar || sector.name,
            plotsInDb: total,
            plotsLoaded: plots.length,
            plotsTruncated: truncated || plots.length < total,
            plotsWithGeometry: 0,
            plotsDrawn: 0,
            fetchPath,
          });
          logCadastreSelection({
            event: "quartier selected — metadata only, viewport geometry next",
            plan: plan ?? null,
            sector,
            sectorCountInPlan: sectors.filter((s) => s.plan_id === pid).length,
            plotsLoaded: plots.length,
            plotsTotalInDb: total,
            plotsTruncated: truncated || plots.length < total,
            plotsWithGeometry: 0,
            viewportPlots: 0,
          });
          logFilterCadastreApply(
            { id: pid, name: plan?.name_ar || plan?.name || String(pid) },
            { id: sectorId, name: sector.name_ar || sector.name },
            {
              foundInDb: total,
              loaded: plots.length,
              drawnOnMap: 0,
              withGeometry: 0,
            },
          );
          devLog(
            `${CADASTRE_LOG} [Filter] >>> ${total} plots metadata loaded — viewport geometry on map idle`,
            { sectorId },
          );
          quartierPerf.finish({
            sector_id: sectorId,
            plots_loaded: plots.length,
            plots_drawn: 0,
            plots_with_geometry: 0,
            fetch_path: fetchPath,
            render_mode: "viewport_bbox_chunks",
          });
        }
      } catch (err) {
        console.error(CADASTRE_LOG, "failed to load quartier plots", {
          planId,
          sectorId,
          err,
        });
        if (gen === applyGen.current) {
          setSectorPlots([]);
          setSectorPlotTotal(0);
          setPlotsTruncated(false);
          setSectorMetadataReady(false);
          setPlotsGeometryReady(false);
          setRevealedPlotShapeCount(0);
        }
      } finally {
        if (gen === applyGen.current) {
          setLoadingPlots(false);
          setMapNavigating(false);
        }
      }
    },
    [plans, sectors, mapSectors, queryClient],
  );

  /** Zone only — zoom to plan, show quartier boundaries; user picks quartier next. */
  const applyZoneOnly = useCallback(
    async (
      planId: number,
      mapRef: MapRef,
      districtFallback: DistrictFallback[] = []
    ) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      ++applyGen.current;
      ++viewportGen.current;
      ++plotViewportGen.current;
      setSelectedPlanId(planId);
      setSelectedSectorId(null);
      setSelectedSubSectorId(null);
      setPinnedSubSector(null);
      setSelectedPlot(null);
      setPinnedSector(null);
      setSectorPlots([]);
      setViewportPlots([]);
      setPlotsTruncated(false);
      setSectorPlotTotal(0);
      setPlotGeometryRevision(0);
      setSectorMetadataReady(false);
      setRevealedPlotShapeCount(0);
      setPlotsGeometryReady(false);
      lastSectorViewportHash.current = "";
      setMapNavigating(true);

      const target = regionForHabitatPlan(plan, districtFallback);
      setRegion(target);

      const sectorPromise =
        sectors.filter((s) => s.plan_id === planId).length > 0
          ? Promise.resolve(sectors.filter((s) => s.plan_id === planId))
          : queryClient
              .fetchQuery({
                queryKey: ["habitatSectors", planId],
                queryFn: () => habitatApi.getSectors(planId),
                staleTime: 30 * 60 * 1000,
              })
              .catch(() => [] as HabitatSector[]);

      const [, sectorList] = await Promise.all([
        mapRef.current
          ? animateHabitatMapToRegion(
              mapRef.current,
              target,
              HABITAT_MAP_ZONE_FLY_MS,
            )
          : Promise.resolve(),
        sectorPromise,
      ]);

      logCadastreZoneSelected({
        planId: plan.id,
        planName: plan.name_ar || plan.name,
        quartiersFound: sectorList.length,
        api: `GET /habitat/plans/${planId}/sectors`,
      });
      logCadastreSelection({
        event: "zone selected (awaiting quartier)",
        plan,
        sectorCountInPlan: sectorList.length,
        plotsLoaded: 0,
      });
      logFilterCadastreApply(
        { id: plan.id, name: plan.name_ar || plan.name },
        null,
      );
      setMapNavigating(false);
    },
    [plans, sectors, queryClient],
  );

  /** Legacy: zone + auto-first-quartier (showcase fallback only). */
  const applyPlanFilter = useCallback(
    async (
      planId: number,
      mapRef: MapRef,
      districtFallback: DistrictFallback[] = []
    ) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan || !mapRef.current) return;

      let sectorList = sectors.filter((s) => s.plan_id === planId);
      if (sectorList.length === 0) {
        try {
          sectorList = await habitatApi.getSectors(planId);
          queryClient.setQueryData(["habitatSectors", planId], sectorList);
        } catch {
          sectorList = [];
        }
      }

      if (sectorList.length > 0) {
        await applyCadastreFilter(
          planId,
          sectorList[0]!.id,
          mapRef,
          districtFallback
        );
        return;
      }

      await applyZoneOnly(planId, mapRef, districtFallback);
    },
    [plans, sectors, applyCadastreFilter, applyZoneOnly, queryClient]
  );

  const selectPlan = useCallback(
    (
      planId: number,
      mapRef: MapRef,
      districtFallback: DistrictFallback[] = []
    ) => applyZoneOnly(planId, mapRef, districtFallback),
    [applyZoneOnly]
  );

  const selectSector = useCallback(
    async (
      sectorId: number,
      mapRef: MapRef,
      districtFallback: DistrictFallback[] = []
    ) => {
      try {
        const pid =
          selectedPlanId ??
          sectors.find((s) => s.id === sectorId)?.plan_id ??
          mapSectors.find((s) => s.id === sectorId)?.plan_id;
        if (pid == null) {
          const resolved = await resolveSector(
            sectorId,
            null,
            mapSectors,
            plans,
            queryClient,
          );
          if (!resolved) return;
          await applyCadastreFilter(
            resolved.planId,
            sectorId,
            mapRef,
            districtFallback,
          );
          return;
        }
        await applyCadastreFilter(pid, sectorId, mapRef, districtFallback);
      } catch (err) {
        console.error(CADASTRE_LOG, "selectSector failed", { sectorId, err });
      }
    },
    [
      applyCadastreFilter,
      selectedPlanId,
      mapSectors,
      plans,
      sectors,
      queryClient,
    ],
  );

  /**
   * Sub-sector plots are a client-side filter of the already-fully-loaded
   * sectorPlots (Layer 1 metadata for the whole pinned quartier) — no extra
   * fetch needed. Sub-sectors have no polygon boundary of their own (only a
   * centroid), so selecting one only reframes the camera onto its plots;
   * the raster/GPU tile layer still draws the whole sector as before.
   */
  const selectSubSector = useCallback(
    (subSectorId: number, mapRef: MapRef) => {
      const subSector = subSectors.find((s) => s.id === subSectorId) ?? null;
      setSelectedSubSectorId(subSectorId);
      setPinnedSubSector(subSector);
      setSelectedPlot(null);

      const plotsInSubSector = sectorPlots.filter(
        (p) => p.sub_sector_id === subSectorId,
      );
      const fitTarget = regionForPlotCentroids(plotsInSubSector);
      const target =
        fitTarget ??
        (subSector?.centroid_lat != null && subSector?.centroid_lng != null
          ? {
              latitude: subSector.centroid_lat,
              longitude: subSector.centroid_lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }
          : null);
      if (target) {
        setRegion(target);
        void animateHabitatMapToRegionWithRetry(
          mapRef,
          target,
          HABITAT_MAP_ADJUST_MS,
        );
      }
      devLog(CADASTRE_LOG, "sub-sector selected", {
        subSectorId,
        name: subSector?.name,
        plotsInSubSector: plotsInSubSector.length,
      });
    },
    [subSectors, sectorPlots],
  );

  const clearSubSectorSelection = useCallback(
    (mapRef?: MapRef) => {
      setSelectedSubSectorId(null);
      setPinnedSubSector(null);
      if (mapRef && pinnedSector) {
        const plan = plans.find((p) => p.id === pinnedSector.plan_id);
        const target = regionForHabitatSector(pinnedSector, plan, []);
        setRegion(target);
        void animateHabitatMapToRegionWithRetry(
          mapRef,
          target,
          HABITAT_MAP_ADJUST_MS,
        );
      }
    },
    [pinnedSector, plans],
  );

  const prefetchSectorPlots = useCallback(
    (sectorId: number) => {
      void queryClient.prefetchQuery({
        queryKey: ["habitatSectorPlots", sectorId],
        queryFn: () => habitatApi.getAllPlotsForSector(sectorId),
        staleTime: 0,
        gcTime: SECTOR_PLOTS_STALE_MS,
      });
    },
    [queryClient],
  );

  const clearCadastreFilter = useCallback((mapRef: MapRef) => {
    ++applyGen.current;
    ++viewportGen.current;
    ++plotViewportGen.current;
    ++sectorViewportGen.current;
    setSelectedPlanId(null);
    setSelectedSectorId(null);
    setSelectedSubSectorId(null);
    setPinnedSubSector(null);
    setSelectedPlot(null);
    setPinnedSector(null);
    setSectorPlots([]);
    setViewportPlots([]);
    setPlotsTruncated(false);
    setSectorPlotTotal(0);
    setPlotGeometryRevision(0);
    setSectorMetadataReady(false);
    setRevealedPlotShapeCount(0);
    setPlotsGeometryReady(false);
    lastSectorViewportHash.current = "";
    setLoadingPlots(false);
    setMapNavigating(true);
    void animateHabitatMapToRegion(
      mapRef.current,
      NOUAKCHOTT_REGION,
      HABITAT_MAP_ZONE_FLY_MS,
    ).finally(() => setMapNavigating(false));
    setRegion(NOUAKCHOTT_REGION);
    devLog(CADASTRE_LOG, "filter cleared");
  }, []);

  const runShowcaseCadastreOnMapOpen = useCallback(
    (mapRef: MapRef, districtFallback: DistrictFallback[] = []) =>
      showcaseCadastreOnMapOpen(
        {
          selectedPlanId,
          plans,
          sectors: mapSectors,
          applyPlanFilter,
          applyCadastreFilter
        },
        mapRef,
        districtFallback
      ),
    [selectedPlanId, plans, mapSectors, applyPlanFilter, applyCadastreFilter]
  );

  const selectPlot = useCallback(
    (plot: HabitatPlot, mapRef?: MapRef | null) => {
      const tapPerf = new CadastrePerfTrace("plot_tap");
      logPlotClickDetails("map data", plot);

      const plan =
        plot.plan ?? plans.find((p) => p.id === plot.plan_id) ?? undefined;
      const sector =
        plot.sector ??
        mapSectors.find((s) => s.id === plot.sector_id) ??
        sectors.find((s) => s.id === plot.sector_id) ??
        undefined;

      const fromSector =
        plot.id != null
          ? sectorPlots.find((p) => p.id === plot.id)
          : undefined;
      let merged = enrichPlotFromGeometryCache(
        fromSector ? { ...fromSector, ...plot } : plot,
      );
      merged = { ...merged, plan, sector };

      const map = mapRef?.current ?? null;
      const sectorId = plot.sector_id ?? sector?.id;
      const plotNumber = plot.plot_number?.trim();
      let detailPlotId = plot.id ?? null;

      setSelectedPlot(merged);
      tapPerf.mark("highlight");
      void focusMapOnSelectedPlot(map, merged, region).catch(() => undefined);

      void (async () => {
        if (sectorId && plotNumber) {
          try {
            const { plot: authoritative, meta } =
              await habitatApi.lookupPlotInSector(sectorId, plotNumber);
            tapPerf.mark("lookup");
            if (authoritative?.id) {
              if (plot.id != null && authoritative.id !== plot.id) {
                console.warn(CADASTRE_LOG, "plot id mismatch — using sector lookup", {
                  map_plot_id: plot.id,
                  authoritative_plot_id: authoritative.id,
                  sector_id: sectorId,
                  plot_number: plotNumber,
                  match_kind: meta?.match_kind,
                });
              }
              detailPlotId = authoritative.id;
              merged = enrichPlotFromGeometryCache({
                ...merged,
                ...authoritative,
                plan: authoritative.plan ?? plan,
                sector: authoritative.sector ?? sector,
              });
            }
          } catch (err) {
            tapPerf.mark("lookup");
            console.warn(CADASTRE_LOG, "sector plot lookup failed", {
              sectorId,
              plotNumber,
              error: err,
            });
          }
        } else {
          tapPerf.mark("lookup");
        }

        tapPerf.mark("merge");

        if (detailPlotId) {
          try {
            const detail = await habitatApi.getPlot(detailPlotId);
            tapPerf.mark("metadata");
            if (detail) {
              merged = enrichPlotFromGeometryCache({
                ...merged,
                ...detail,
                plan: detail.plan ?? plan,
                sector: detail.sector ?? sector,
              });
              ingestPlotGeometryBatch([merged]);
              setPlotGeometryRevision((n) => n + 1);
              setSelectedPlot(merged);
            }
          } catch (err) {
            tapPerf.mark("metadata");
            console.warn(CADASTRE_LOG, "plot detail fetch failed", {
              plotId: detailPlotId,
              error: err,
            });
          }
        } else {
          tapPerf.mark("metadata");
        }

        logPlotClickDetails("API detail", merged);
        tapPerf.mark("focus");

        InteractionManager.runAfterInteractions(() => {
          tapPerf.mark("popup");
          tapPerf.finish({
            plot_id: merged.id,
            plot_number: merged.plot_number,
            sector_id: merged.sector_id,
          });
        });
      })();
    },
    [plans, sectors, mapSectors, region, sectorPlots],
  );

  const searchAndSelectPlot = useCallback(
    async (
      query: string,
      mapRef: MapRef,
      districtFallback: DistrictFallback[] = []
    ) => {
      const q = query.trim();
      if (q.length < 2) return null;
      const { plots: results } = await habitatApi.searchCadastre(q);
      const normQ = q.toLowerCase();
      const plot =
        results.find((p) => p.plot_number.toLowerCase() === normQ) ??
        results.find((p) => p.plot_number.toLowerCase().includes(normQ)) ??
        results[0];
      if (!plot?.plan_id || !plot.sector_id) return null;
      await applyCadastreFilter(
        plot.plan_id,
        plot.sector_id,
        mapRef,
        districtFallback,
      );
      selectPlot(plot, mapRef);
      return plot;
    },
    [applyCadastreFilter, selectPlot]
  );

  const plotsSource = useMemo(() => {
    if (selectedSectorId != null) {
      const inSector = sectorPlots.filter(
        (p) => p.sector_id == null || p.sector_id === selectedSectorId,
      );
      if (selectedSubSectorId != null) {
        return inSector.filter((p) => p.sub_sector_id === selectedSubSectorId);
      }
      return inSector;
    }
    if (viewLevel === "plots" && viewportPlots.length > 0) {
      return viewportPlots;
    }
    return viewportPlots;
  }, [viewLevel, viewportPlots, selectedSectorId, selectedSubSectorId, sectorPlots]);

  const plotsToRender = useMemo(() => {
    // Pinned quartier: all data in sectorPlots; map draws via plotShapesToRender only.
    if (selectedSectorId != null) {
      return [];
    }

    const withGeom: HabitatPlot[] = [];

    if (selectedPlot && getPlotRings(selectedPlot).length > 0) {
      withGeom.push(selectedPlot);
    }

    for (const p of plotsSource) {
      if (selectedPlot && p.id === selectedPlot.id) {
        continue;
      }
      if (getPlotRings(p).length > 0) {
        withGeom.push(p);
        if (selectedSectorId == null && withGeom.length >= MAX_PLOTS_DRAWN) {
          break;
        }
      }
    }
    return withGeom;
  }, [plotsSource, selectedSectorId, selectedPlot]);

  /** All drawable plots of the pinned quartier — recomputes only when the dataset changes, never on pan/zoom. */
  const sectorDrawablePlots = useMemo(() => {
    if (isPlotRenderingHandledExternally() && selectedSectorId != null) return [];
    if (selectedSectorId == null) return [];
    if (!plotsGeometryReady || sectorPlots.length === 0) return [];

    let inSector = sectorPlots.filter(
      (p) => p.sector_id == null || p.sector_id === selectedSectorId,
    );
    if (selectedSubSectorId != null) {
      inSector = inSector.filter((p) => p.sub_sector_id === selectedSubSectorId);
    }
    return inSector.filter(
      (p) => hasStoredPlotGeometry(p) || getPlotRings(p).length > 0,
    );
  }, [
    selectedSectorId,
    selectedSubSectorId,
    sectorPlots,
    plotGeometryRevision,
    plotsGeometryReady,
  ]);

  /**
   * STATIC path — quartier fits the native budget (≤ MAX_NATIVE_MAP_CHILDREN_SECTOR,
   * e.g. all 1,800 plots): build the full shape set ONCE per quartier.
   * Deliberately independent of the camera region, so panning/zooming never
   * rebuilds, re-diffs, or churns the mounted polygons — the identity churn
   * of rebuilding ~1,800 shapes per camera move is what crashed the native
   * map, not the steady-state overlay count.
   */
  const sectorShapesStatic = useMemo(() => {
    if (sectorDrawablePlots.length === 0) return null;
    if (sectorDrawablePlots.length > MAX_NATIVE_MAP_CHILDREN_SECTOR) return null;
    return buildSectorPlotShapes(sectorDrawablePlots);
  }, [sectorDrawablePlots]);

  /** VIEWPORT path — oversized quartiers (4K–8K): spatial-index culling per camera move. */
  const plotShapesFull = useMemo(() => {
    if (sectorDrawablePlots.length === 0) return [];
    if (sectorShapesStatic != null) return sectorShapesStatic;

    let picked = selectPlotsToDraw(
      sectorDrawablePlots,
      debouncedRegion,
      MAX_NATIVE_MAP_CHILDREN_SECTOR,
    );
    if (selectedPlot) {
      picked = mergePlotIntoList(picked, selectedPlot);
    }
    return capPlotShapesForSector(buildSectorPlotShapes(picked));
  }, [sectorDrawablePlots, sectorShapesStatic, selectedPlot, debouncedRegion]);

  /**
   * LOD ordering — ONE stable array whose prefix is always a representative
   * sample of the whole quartier: stride-sampled plots first, the remainder
   * after. Every zoom tier is then just a slice length of this array, so
   * tier transitions add/remove polygons incrementally with zero identity
   * churn (the same descriptor objects stay mounted across tiers).
   */
  const orderedPlotShapes = useMemo(() => {
    const shapes = plotShapesFull;
    if (shapes.length <= MID_ZOOM_PLOT_SAMPLE) return shapes;
    const stride = Math.ceil(shapes.length / MID_ZOOM_PLOT_SAMPLE);
    const sampled: typeof shapes = [];
    const rest: typeof shapes = [];
    for (let i = 0; i < shapes.length; i++) {
      if (i % stride === 0 && sampled.length < MID_ZOOM_PLOT_SAMPLE) {
        sampled.push(shapes[i]!);
      } else {
        rest.push(shapes[i]!);
      }
    }
    return sampled.concat(rest);
  }, [plotShapesFull]);

  /**
   * Zoom-gated mount budget. All 1,800+ mounted at once is only safe while
   * zoomed in enough that the map rasterizes a small visible subset per
   * frame; zoomed out, every polygon lands in every pan frame's redraw and
   * the sustained tessellation spike kills the app (observed crash:
   * zoom-out + pan with the full quartier mounted). Below full-detail zoom
   * a sampled preview keeps the quartier visually dense; below plot zoom
   * only the quartier boundary renders — plots are sub-pixel there anyway.
   */
  const plotLodCount = useMemo(() => {
    const z = zoomFromRegion(debouncedRegion.longitudeDelta);
    if (z < MIN_ZOOM_SECTOR_PLOT_GEOM) return 0;
    if (z < PLOT_FULL_DETAIL_ZOOM) {
      return Math.min(MID_ZOOM_PLOT_SAMPLE, orderedPlotShapes.length);
    }
    return orderedPlotShapes.length;
  }, [debouncedRegion.longitudeDelta, orderedPlotShapes]);

  useEffect(() => {
    if (
      selectedSectorId == null ||
      isPlotRenderingHandledExternally() ||
      !plotsGeometryReady
    ) {
      setRevealedPlotShapeCount(0);
      revealedSectorRef.current = null;
      revealedCountRef.current = 0;
      return;
    }

    // Shrinking (zoom-out tier drop) applies immediately — removals are
    // cheap. Growing by more than a couple of chunks (initial pin, or a
    // zoom-in tier upgrade) is staged so hundreds of native polygons never
    // mount in a single frame — the one-frame bridge spike is a known iOS
    // react-native-maps crash pattern.
    setRevealedPlotShapeCount((prev) => {
      const target = plotLodCount;
      if (target <= prev) return target;
      if (target - prev <= PLOT_SHAPE_CHUNK_SIZE * 2) return target;
      return prev;
    });

    const prev = revealedCountRef.current;
    if (plotLodCount > prev + PLOT_SHAPE_CHUNK_SIZE * 2) {
      return scheduleProgressiveReveal(
        plotLodCount,
        (n) => {
          revealedCountRef.current = n;
          setRevealedPlotShapeCount(n);
        },
        undefined,
        undefined,
        prev,
      );
    }
    revealedCountRef.current = plotLodCount;
  }, [plotLodCount, plotsGeometryReady, selectedSectorId]);

  const plotShapesToRender = useMemo(() => {
    if (selectedSectorId == null) return undefined;
    if (isPlotRenderingHandledExternally()) return [];
    if (!plotsGeometryReady || orderedPlotShapes.length === 0) return [];
    return orderedPlotShapes.slice(
      0,
      Math.min(revealedPlotShapeCount, plotLodCount),
    );
  }, [
    selectedSectorId,
    orderedPlotShapes,
    plotsGeometryReady,
    revealedPlotShapeCount,
    plotLodCount,
  ]);

  const plotsRevealReady =
    selectedSectorId != null
      ? isPlotRenderingHandledExternally()
        ? !loadingPlots
        : plotsGeometryReady && !loadingPlots && !loadingViewportGeometry
      : (plotShapesToRender?.length ?? plotsToRender.length) > 0;

  const plotsDrawnCountResolved =
    isPlotRenderingHandledExternally() && selectedSectorId != null
      ? sectorPlotTotal || sectorPlots.length
      : plotShapesFull.length > 0
        ? Math.min(revealedPlotShapeCount, plotShapesFull.length)
        : plotShapesToRender?.length ?? plotsToRender.length;

  const plotsViewportCapped =
    selectedSectorId != null &&
    !isPlotRenderingHandledExternally() &&
    plotsGeometryReady &&
    sectorPlots.length > 0 &&
    plotsDrawnCountResolved < (sectorPlotTotal || sectorPlots.length);

  /**
   * While subSectorsQuery is still loading right after a sector is pinned,
   * tentatively assume it might have sub-sectors (avoids a "sub_sectors" ->
   * "plots" -> "sub_sectors" flicker for sectors that do have them) — it
   * settles to "plots" once the (fast, single-sector) query resolves empty.
   */
  const sectorMayHaveSubSectors =
    subSectors.length > 0 || (subSectorsLoading && selectedSectorId != null);

  const effectiveViewLevel: HabitatMapViewLevel =
    selectedSubSectorId != null
      ? "plots"
      : selectedSectorId != null
        ? sectorMayHaveSubSectors
          ? "sub_sectors"
          : "plots"
        : selectedPlanId != null
          ? "sectors"
          : viewLevel;

  return {
    initialRegion: NOUAKCHOTT_REGION,
    region,
    zoom,
    viewLevel: effectiveViewLevel,
    mapViewLevel: viewLevel,
    mapTier,
    mapNavigating,
    plans,
    sectors,
    mapSectors,
    plansLoading: plansQuery.isLoading,
    plansError: plansQuery.isError,
    sectorsLoading,
    pinnedSector,
    selectedPlanId,
    selectedSectorId,
    subSectors,
    subSectorsLoading,
    selectedSubSectorId,
    pinnedSubSector,
    selectSubSector,
    clearSubSectorSelection,
    selectedPlot,
    setSelectedPlot,
    plotsToRender,
    plotShapesToRender,
    plotsRevealReady,
    plotsTruncated,
    sectorPlotTotal,
    plotsDrawnCount: plotsDrawnCountResolved,
    plotsLoadedCount: plotsSource.length,
    plotsGeometryReady,
    plotsViewportCapped,
    loadingPlots: loadingPlots || loadingViewportGeometry,
    loadingViewport: loadingPlots || loadingViewportGeometry,
    prefetchSectorPlots,
    applyPlanFilter,
    applyZoneOnly,
    applyCadastreFilter,
    showcaseCadastreOnMapOpen: runShowcaseCadastreOnMapOpen,
    selectPlan,
    selectSector,
    clearCadastreFilter,
    selectPlot,
    searchAndSelectPlot,
    onRegionChange,
    onRegionChangeComplete,
  };
}
