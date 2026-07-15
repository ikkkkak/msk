/**
 * Shared cadastre map stack for Sell, Rent, and Land tabs on SearchScreen.
 * iOS: Apple Maps via getMapProvider() in HabitatCadastreMap.
 * Android: MapTiler tiles via PlatformMapTileLayer in HabitatCadastreMap.
 * Filter sheet is hoisted on SearchScreen — this view only renders map + chips.
 */
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
  I18nManager,
} from "react-native";
import type { RefObject } from "react";
import type { Region } from "react-native-maps";
import { CaretLeft } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { HabitatCadastreMap } from "./HabitatCadastreMap";
import { CadastreMapFilterBar } from "./CadastreMapFilterBar";
import { localizedHabitatName } from "./cadastreFilterUtils";
import type { HabitatPlot } from "../../types/habitat";
import type { useHabitatCadastre } from "../../hooks/useHabitatCadastre";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import type { MapLandmarkRecord } from "../../utils/landmarkMapMarkers";

type DistrictFallback = {
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
};

type CadastreApi = ReturnType<typeof useHabitatCadastre>;

type Props = {
  mapRef: RefObject<CadastreMapHandle | null>;
  cadastre: CadastreApi;
  districtFallback: DistrictFallback[];
  mapType: "standard" | "satellite" | "sentinel";
  onMapTypeChange?: (type: "standard" | "satellite" | "sentinel") => void;
  initialRegion?: Region;
  onPlotPress: (plot: HabitatPlot) => void;
  onMapBackgroundPress?: () => void;
  showPlotPanel: boolean;
  onPlotFound?: (plot: HabitatPlot) => void;
  onOpenZones: () => void;
  onOpenQuartiers: () => void;
  onOpenSubSectors?: () => void;
  plotNumberValue: string;
  onPlotNumberChange: (value: string) => void;
  onPlotSearch: () => void;
  plotSearching?: boolean;
  onClearFilter: () => void;
  onPlotViewAllDetails?: (plot: HabitatPlot) => void;
  onBackToList?: () => void;
  landsForSale?: MapLandmarkRecord[];
  selectedLand?: MapLandmarkRecord | null;
  onLandPress?: (landmark: MapLandmarkRecord) => void;
  onLandClusterPress?: (cluster: import("../../utils/landmarkMapClustering").LandMapCluster) => void;
  onLandClose?: () => void;
  onLandViewDetails?: (landmark: MapLandmarkRecord) => void;
  showLandPanel?: boolean;
  landPinRestoreGeneration?: number;
  landPanelDismissRef?: React.MutableRefObject<(() => void) | null>;
};

export function SearchCadastreMapView({
  mapRef,
  cadastre,
  districtFallback,
  mapType,
  onMapTypeChange,
  initialRegion,
  onPlotPress,
  onMapBackgroundPress,
  showPlotPanel,
  onPlotFound,
  onOpenZones,
  onOpenQuartiers,
  onOpenSubSectors,
  plotNumberValue,
  onPlotNumberChange,
  onPlotSearch,
  plotSearching,
  onClearFilter,
  onPlotViewAllDetails,
  onBackToList,
  landsForSale = [],
  selectedLand = null,
  onLandPress,
  onLandClusterPress,
  onLandClose,
  onLandViewDetails,
  showLandPanel = false,
  landPinRestoreGeneration = 0,
  landPanelDismissRef,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl =
    I18nManager.isRTL || (i18n.language || "").toLowerCase().startsWith("ar");
  const mapRegion = cadastre.region;
  const resolvedMapType = mapType;
  const selectedPlan = cadastre.plans.find(
    (p) => p.id === cadastre.selectedPlanId,
  );
  const selectedSector =
    cadastre.pinnedSector ??
    cadastre.mapSectors.find((s) => s.id === cadastre.selectedSectorId) ??
    cadastre.sectors.find((s) => s.id === cadastre.selectedSectorId);
  const zoneLabel = localizedHabitatName(
    isRtl,
    selectedPlan?.name,
    selectedPlan?.name_ar,
  );
  const baseSectorLabel = localizedHabitatName(
    isRtl,
    selectedSector?.name,
    selectedSector?.name_ar,
  );
  const subSectorLabel = cadastre.pinnedSubSector
    ? localizedHabitatName(
        isRtl,
        cadastre.pinnedSubSector.name,
        cadastre.pinnedSubSector.name_ar,
      )
    : null;
  const sectorLabel =
    subSectorLabel && baseSectorLabel
      ? `${baseSectorLabel} · ${subSectorLabel}`
      : subSectorLabel || baseSectorLabel;
  const zoneSelected = cadastre.selectedPlanId != null;
  const sectorSelected = cadastre.selectedSectorId != null;

  return (
    <View style={styles.wrap}>
      <HabitatCadastreMap
        mapRef={mapRef}
        initialRegion={initialRegion ?? cadastre.initialRegion}
        mapRegion={mapRegion}
        mapType={resolvedMapType}
        onMapTypeChange={onMapTypeChange}
        viewLevel={cadastre.viewLevel}
        plans={cadastre.plans}
        sectors={cadastre.mapSectors}
        plots={cadastre.plotsToRender}
        plotShapes={cadastre.plotShapesToRender}
        selectedPlanId={cadastre.selectedPlanId}
        selectedSectorId={cadastre.selectedSectorId}
        selectedPlotId={cadastre.selectedPlot?.id ?? null}
        subSectors={cadastre.subSectors}
        selectedSubSectorId={cadastre.selectedSubSectorId}
        onSubSectorPress={(subSectorId) =>
          cadastre.selectSubSector(subSectorId, mapRef)
        }
        plotsTruncated={cadastre.plotsTruncated}
        plotsLoadedCount={cadastre.plotsLoadedCount}
        plotsDrawnCount={cadastre.plotsDrawnCount}
        sectorPlotTotal={cadastre.sectorPlotTotal}
        plotsGeometryReady={cadastre.plotsGeometryReady}
        plotsRevealReady={cadastre.plotsRevealReady}
        plotsViewportCapped={cadastre.plotsViewportCapped}
        districtFallback={districtFallback}
        plansLoading={cadastre.plansLoading}
        sectorsLoading={cadastre.sectorsLoading}
        plansError={cadastre.plansError}
        loadingPlots={cadastre.loadingPlots}
        mapNavigating={cadastre.mapNavigating}
        onRegionChange={cadastre.onRegionChange}
        onRegionChangeComplete={cadastre.onRegionChangeComplete}
        onPlanPress={(planId) =>
          void cadastre.selectPlan(planId, mapRef, districtFallback)
        }
        onSectorPress={(sectorId) =>
          void cadastre.selectSector(sectorId, mapRef, districtFallback)
        }
        onPlotPress={onPlotPress}
        onMapBackgroundPress={onMapBackgroundPress}
        mapZoom={cadastre.zoom}
        mapLongitudeDelta={cadastre.region.longitudeDelta}
        showPlotPanel={showPlotPanel}
        onPlotClose={() => cadastre.setSelectedPlot(null)}
        onPlotViewAllDetails={onPlotViewAllDetails}
        selectedPlot={cadastre.selectedPlot}
        landsForSale={landsForSale}
        selectedLand={selectedLand}
        onLandPress={onLandPress}
        onLandClusterPress={onLandClusterPress}
        onLandClose={onLandClose}
        onLandViewDetails={onLandViewDetails}
        showLandPanel={showLandPanel}
        landPinRestoreGeneration={landPinRestoreGeneration}
        landPanelDismissRef={landPanelDismissRef}
      />

      <View style={styles.topChrome} pointerEvents="box-none">
        {onBackToList && !showPlotPanel && !showLandPanel ? (
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              isRtl && styles.backBtnRtl,
              pressed && styles.backBtnPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onBackToList();
            }}
            accessibilityRole="button"
            accessibilityLabel={t("search.backToList", "Back to list")}
          >
            <CaretLeft
              size={16}
              color="#111827"
              weight="bold"
              style={isRtl ? styles.backIconRtl : undefined}
            />
            <Text style={[styles.backLabel, isRtl && styles.backLabelRtl]}>
              {t("search.backToList", "Back to list")}
            </Text>
          </Pressable>
        ) : null}

        <CadastreMapFilterBar
          selectedZoneLabel={zoneLabel}
          selectedSectorLabel={sectorLabel}
          zoneSelected={zoneSelected}
          sectorSelected={sectorSelected}
          compact={showPlotPanel || showLandPanel}
          onOpenZone={onOpenZones}
          onOpenSector={onOpenQuartiers}
          plotNumberValue={plotNumberValue}
          onPlotNumberChange={onPlotNumberChange}
          onPlotSearch={onPlotSearch}
          plotSearching={plotSearching}
          onClear={onClearFilter}
          subSectorAvailable={
            sectorSelected && cadastre.subSectors.length > 0
          }
          selectedSubSectorLabel={subSectorLabel ?? undefined}
          onOpenSubSector={onOpenSubSectors}
          embedded
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  topChrome: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    zIndex: 10210,
    elevation: 10210,
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  backBtnRtl: {
    flexDirection: "row-reverse",
    alignSelf: "flex-end",
  },
  backBtnPressed: {
    opacity: 0.88,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  backLabelRtl: {
    writingDirection: "rtl",
  },
  backIconRtl: {
    transform: [{ scaleX: -1 }],
  },
});
