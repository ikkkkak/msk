/**
 * Cadastre filter sheet state — single instance hoisted on SearchScreen.
 */
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { CadastreMapHandle } from "../utils/habitatCadastreMapRef";
import { habitatApi } from "../services/habitatApi";
import type { HabitatPlan, HabitatPlot, HabitatSector } from "../types/habitat";
import type { useHabitatCadastre } from "./useHabitatCadastre";
import { useDebouncedValue } from "./useDebouncedValue";
import { matchesPlan, matchesSector } from "../utils/habitatSearch";
import { logFilterCadastreApply } from "./useHabitatCadastre";
import { ingestPlotGeometryBatch } from "../utils/habitatPlotGeometryCache";
import {
  formatAppliedCadastreLabel,
  trimLabel,
} from "../components/habitat/cadastreFilterUtils";

const SEARCH_DEBOUNCE_MS = 320;
const SEARCH_MIN_LEN = 2;
const MAX_SEARCH_ROWS = 40;

type SheetStep = "main" | "zones" | "quartiers";

type DistrictFallback = {
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
};

type CadastreApi = ReturnType<typeof useHabitatCadastre>;

export type UnifiedRow =
  | { kind: "plan"; plan: HabitatPlan }
  | { kind: "sector"; sector: HabitatSector; plan?: HabitatPlan }
  | { kind: "plot"; plot: HabitatPlot };

export type CadastreFilterSheetRef = {
  open: () => void;
  openWithPlan: (planId: number) => void;
  openZones: () => void;
  openQuartiers: () => void;
  openPlotSearch: () => void;
};

export type CadastreFilterSheetParams = {
  cadastre: CadastreApi;
  getMapRef: () => React.RefObject<CadastreMapHandle | null>;
  districtFallback?: DistrictFallback[];
  onPlotFound?: (plot: HabitatPlot) => void;
  /** Forwarded ref from parent */
  imperativeRef?: React.Ref<CadastreFilterSheetRef | null>;
};

export function useCadastreFilterSheet({
  cadastre,
  getMapRef,
  districtFallback = [],
  onPlotFound,
  imperativeRef,
}: CadastreFilterSheetParams) {
  const sheetRef = useRef<BottomSheetModal>(null);

  const [step, setStep] = useState<SheetStep>("main");
  const [draftPlanId, setDraftPlanId] = useState<number | null>(null);
  const [draftSectorId, setDraftSectorId] = useState<number | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sectorPlotNumber, setSectorPlotNumber] = useState("");
  const [sectorPlotSearching, setSectorPlotSearching] = useState(false);
  const [sectorPlotError, setSectorPlotError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (draftSectorId != null) {
      cadastre.prefetchSectorPlots(draftSectorId);
    }
  }, [draftSectorId, cadastre.prefetchSectorPlots]);

  const snapPoints = useMemo(() => ["72%"], []);

  const draftSectorsQuery = useQuery({
    queryKey: ["habitatSectors", draftPlanId],
    queryFn: () => habitatApi.getSectors(draftPlanId!),
    enabled: draftPlanId != null && draftPlanId !== cadastre.selectedPlanId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const draftSectors = useMemo(() => {
    if (draftPlanId == null) return [];
    if (draftPlanId === cadastre.selectedPlanId && cadastre.sectors.length) {
      return cadastre.sectors;
    }
    return draftSectorsQuery.data ?? [];
  }, [
    draftPlanId,
    cadastre.selectedPlanId,
    cadastre.sectors,
    draftSectorsQuery.data,
  ]);

  const sectorsLoading =
    (draftPlanId != null &&
      draftPlanId !== cadastre.selectedPlanId &&
      draftSectorsQuery.isLoading) ||
    (draftPlanId != null &&
      draftPlanId === cadastre.selectedPlanId &&
      cadastre.sectorsLoading);

  const searchQuery = useQuery({
    queryKey: ["habitatCadastreSearch", debouncedQuery],
    queryFn: () => habitatApi.searchCadastre(debouncedQuery.trim()),
    enabled: debouncedQuery.trim().length >= SEARCH_MIN_LEN,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  const searchRows = useMemo((): UnifiedRow[] => {
    const q = debouncedQuery.trim();
    if (q.length < SEARCH_MIN_LEN) return [];
    const data = searchQuery.data;
    if (!data) return [];
    const rows: UnifiedRow[] = [];
    for (const plan of data.plans.slice(0, 12)) {
      rows.push({ kind: "plan", plan });
    }
    for (const sector of data.sectors.slice(0, 16)) {
      rows.push({
        kind: "sector",
        sector,
        plan: cadastre.plans.find((p) => p.id === sector.plan_id),
      });
    }
    for (const plot of data.plots.slice(0, 12)) {
      rows.push({ kind: "plot", plot });
    }
    return rows.slice(0, MAX_SEARCH_ROWS);
  }, [debouncedQuery, searchQuery.data, cadastre.plans]);

  const isSearchMode = debouncedQuery.trim().length >= SEARCH_MIN_LEN;
  const useFlatList = step !== "main" || isSearchMode;

  const selectedPlan = cadastre.plans.find((p) => p.id === draftPlanId);
  const selectedSector = draftSectors.find((s) => s.id === draftSectorId);
  const appliedPlan = cadastre.plans.find((p) => p.id === cadastre.selectedPlanId);
  const appliedSector = cadastre.sectors.find(
    (s) => s.id === cadastre.selectedSectorId,
  );

  const appliedLabel = formatAppliedCadastreLabel(appliedPlan, appliedSector);

  const resetSheetState = useCallback(() => {
    setStep("main");
    setListSearch("");
    setQuery("");
    setSectorPlotNumber("");
    setSectorPlotSearching(false);
    setSectorPlotError(null);
  }, []);

  const presentSheet = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      sheetRef.current?.present();
    });
  }, []);

  const openFilter = useCallback(() => {
    setDraftPlanId(cadastre.selectedPlanId);
    setDraftSectorId(cadastre.selectedSectorId);
    resetSheetState();
    presentSheet();
  }, [
    cadastre.selectedPlanId,
    cadastre.selectedSectorId,
    resetSheetState,
    presentSheet,
  ]);

  const openWithPlan = useCallback(
    (planId: number) => {
      setDraftPlanId(planId);
      setDraftSectorId(null);
      resetSheetState();
      presentSheet();
    },
    [resetSheetState, presentSheet],
  );

  const openZones = useCallback(() => {
    setDraftPlanId(cadastre.selectedPlanId);
    setDraftSectorId(cadastre.selectedSectorId);
    setListSearch("");
    setStep("zones");
    presentSheet();
  }, [cadastre.selectedPlanId, cadastre.selectedSectorId, presentSheet]);

  const openQuartiers = useCallback(() => {
    setDraftPlanId(cadastre.selectedPlanId);
    setDraftSectorId(cadastre.selectedSectorId);
    setListSearch("");
    setStep(cadastre.selectedPlanId != null ? "quartiers" : "zones");
    presentSheet();
  }, [cadastre.selectedPlanId, cadastre.selectedSectorId, presentSheet]);

  const openPlotSearch = useCallback(() => {
    setDraftPlanId(cadastre.selectedPlanId);
    setDraftSectorId(cadastre.selectedSectorId);
    setStep("main");
    setQuery("");
    presentSheet();
  }, [cadastre.selectedPlanId, cadastre.selectedSectorId, presentSheet]);

  useImperativeHandle(
    imperativeRef,
    () => ({
      open: openFilter,
      openWithPlan,
      openZones,
      openQuartiers,
      openPlotSearch,
    }),
    [openFilter, openWithPlan, openZones, openQuartiers, openPlotSearch],
  );

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const dismissSheet = useCallback(() => {
    closeSheet();
    resetSheetState();
  }, [closeSheet, resetSheetState]);

  const handleSheetDismiss = useCallback(() => {
    resetSheetState();
  }, [resetSheetState]);

  const handleClear = useCallback(() => {
    setDraftPlanId(null);
    setDraftSectorId(null);
    dismissSheet();
    cadastre.clearCadastreFilter(getMapRef());
  }, [cadastre, getMapRef, dismissSheet]);

  const applySelection = useCallback(
    async (planId: number, sectorId: number | null) => {
      dismissSheet();
      const mapRef = getMapRef();
      const plan = cadastre.plans.find((p) => p.id === planId);
      if (sectorId != null) {
        cadastre.prefetchSectorPlots(sectorId);
        const sector = draftSectors.find((s) => s.id === sectorId);
        logFilterCadastreApply(
          plan
            ? { id: plan.id, name: plan.name_ar || plan.name }
            : { id: planId, name: String(planId) },
          sector
            ? { id: sector.id, name: sector.name_ar || sector.name }
            : { id: sectorId, name: String(sectorId) },
        );
        await cadastre.applyCadastreFilter(
          planId,
          sectorId,
          mapRef,
          districtFallback,
          { sectorHint: sector ?? undefined },
        );
      } else {
        logFilterCadastreApply(
          plan
            ? { id: plan.id, name: plan.name_ar || plan.name }
            : { id: planId, name: String(planId) },
          null,
        );
        await cadastre.applyZoneOnly(planId, mapRef, districtFallback);
      }
    },
    [cadastre, getMapRef, districtFallback, draftSectors, dismissSheet],
  );

  const pickZone = useCallback(
    (planId: number) => {
      setDraftPlanId(planId);
      setDraftSectorId(null);
      setListSearch("");
      setStep("quartiers");
      void cadastre.applyZoneOnly(planId, getMapRef(), districtFallback);
    },
    [cadastre, getMapRef, districtFallback],
  );

  const handleApplyMain = useCallback(() => {
    if (draftPlanId == null) return;
    if (draftSectorId == null) {
      setListSearch("");
      setStep("quartiers");
      return;
    }
    void applySelection(draftPlanId, draftSectorId);
  }, [draftPlanId, draftSectorId, applySelection]);

  const applyPlotResult = useCallback(
    async (plot: HabitatPlot) => {
      if (!plot.plan_id || !plot.sector_id) return;
      dismissSheet();
      const mapRef = getMapRef();
      await cadastre.applyCadastreFilter(
        plot.plan_id,
        plot.sector_id,
        mapRef,
        districtFallback,
      );
      let full = plot;
      if (!plot.geom_geojson && plot.id) {
        const detail = await habitatApi.getPlot(plot.id);
        if (detail) full = detail;
      }
      ingestPlotGeometryBatch([full]);
      cadastre.setSelectedPlot(full);
      onPlotFound?.(full);
    },
    [cadastre, getMapRef, districtFallback, onPlotFound, dismissSheet],
  );

  const searchPlotInSelectedSector = useCallback(async () => {
    const plotNumber = sectorPlotNumber.trim();
    if (!plotNumber) return;
    if (draftSectorId == null) {
      setSectorPlotError("select_sector_first");
      return;
    }
    setSectorPlotSearching(true);
    setSectorPlotError(null);
    try {
      const res = await habitatApi.lookupPlotInSector(draftSectorId, plotNumber);
      if (!res.plot) {
        setSectorPlotError("not_found");
        return;
      }
      await applyPlotResult(res.plot);
    } finally {
      setSectorPlotSearching(false);
    }
  }, [sectorPlotNumber, draftSectorId, applyPlotResult]);

  const onSearchRowPress = useCallback(
    (row: UnifiedRow) => {
      if (row.kind === "plan") {
        setDraftPlanId(row.plan.id);
        setDraftSectorId(null);
        setQuery("");
        setListSearch("");
        setStep("quartiers");
        return;
      }
      if (row.kind === "sector") {
        void applySelection(row.sector.plan_id, row.sector.id);
        return;
      }
      void applyPlotResult(row.plot);
    },
    [applySelection, applyPlotResult],
  );

  const zoneListData = useMemo(
    () => cadastre.plans.filter((p) => matchesPlan(p, listSearch)),
    [cadastre.plans, listSearch],
  );

  const quartierListData = useMemo(
    () => draftSectors.filter((s) => matchesSector(s, listSearch)),
    [draftSectors, listSearch],
  );

  const sheetListData = useMemo((): Array<
    HabitatPlan | HabitatSector | UnifiedRow
  > => {
    if (step === "zones") return zoneListData;
    if (step === "quartiers") return sectorsLoading ? [] : quartierListData;
    if (step === "main" && isSearchMode) return searchRows;
    return [];
  }, [
    step,
    zoneListData,
    quartierListData,
    sectorsLoading,
    isSearchMode,
    searchRows,
  ]);

  const canApply = draftPlanId != null;
  const goBackToMain = useCallback(() => {
    setListSearch("");
    setStep("main");
  }, []);

  return {
    sheetRef,
    snapPoints,
    step,
    setStep,
    draftPlanId,
    setDraftPlanId,
    draftSectorId,
    setDraftSectorId,
    listSearch,
    setListSearch,
    query,
    setQuery,
    sectorPlotNumber,
    setSectorPlotNumber,
    sectorPlotSearching,
    sectorPlotError,
    searchPlotInSelectedSector,
    isSearchMode,
    useFlatList,
    selectedPlan,
    selectedSector,
    appliedLabel,
    sectorsLoading,
    searchQuery,
    searchRows,
    sheetListData,
    zoneListData,
    quartierListData,
    canApply,
    cadastre,
    openFilter,
    openWithPlan,
    handleClear,
    handleApplyMain,
    handleSheetDismiss,
    closeSheet,
    goBackToMain,
    pickZone,
    applySelection,
    onSearchRowPress,
    setListSearchForStep: setListSearch,
  };
}

export { trimLabel };
