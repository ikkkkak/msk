import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import { useTranslation } from "react-i18next";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatMapViewLevel,
} from "../../types/habitat";
import { getMapProvider, resolveNativeMapType } from "../../utils/mapProvider";
import { HabitatMapLayers } from "./HabitatMapLayers";
import { MapErrorBoundary } from "./MapErrorBoundary";
import {
  HabitatPlotCalloutOverlay,
  HabitatPlotPinMarker,
  resolveSelectedPlotCoordinate,
  HABITAT_PLOT_PREVIEW_HEIGHT,
} from "./HabitatPlotMapCallout";
import { MapToolbar } from "../map/MapToolbar";
import type { PlotShapeDescriptor } from "../../utils/habitatPlotGeometryCache";
import {
  USE_HABITAT_VECTOR_TILES,
  canUseHabitatVectorTiles,
} from "../../utils/habitatVectorTiles";
import { warnIfMapLibreNativeMissing } from "../../utils/habitatMapLibreNative";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import type { ComponentType } from "react";
import type { HabitatMapLibreCadastreProps } from "./HabitatMapLibreCadastre";

const PLOT_LOADING_DELAY_MS = 160;

type DistrictFallback = {
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
};
type MapType = "standard" | "satellite";

type Props = {
  mapRef: React.RefObject<CadastreMapHandle | null>;
  initialRegion: Region;
  mapRegion?: Region;
  mapType?: MapType;
  onMapTypeChange?: (type: MapType) => void;
  viewLevel: HabitatMapViewLevel;
  plans: HabitatPlan[];
  sectors: HabitatSector[];
  plots: HabitatPlot[];
  selectedPlanId: number | null;
  selectedSectorId: number | null;
  selectedPlotId: number | null;
  districtFallback?: DistrictFallback[];
  loadingPlots?: boolean;
  mapNavigating?: boolean;
  plotsTruncated?: boolean;
  plotsLoadedCount?: number;
  plotsDrawnCount?: number;
  sectorPlotTotal?: number;
  plansLoading?: boolean;
  plansError?: boolean;
  onRegionChangeComplete: (region: Region) => void;
  onRegionChange?: () => void;
  onPlotPress: (plot: HabitatPlot) => void;
  onPlanPress?: (planId: number) => void;
  onSectorPress?: (sectorId: number) => void;
  mapZoom?: number;
  mapLongitudeDelta?: number;
  plotShapes?: PlotShapeDescriptor[];
  onMapBackgroundPress?: () => void;
  showPlotPanel?: boolean;
  onPlotClose?: () => void;
  onPlotViewAllDetails?: (plot: HabitatPlot) => void;
  selectedPlot?: HabitatPlot | null;
};

export function HabitatCadastreMap({
  mapRef,
  initialRegion,
  mapRegion,
  mapType: mapTypeProp = "satellite",
  onMapTypeChange,
  viewLevel,
  plans,
  sectors,
  plots,
  selectedPlanId,
  selectedSectorId,
  selectedPlotId,
  districtFallback = [],
  loadingPlots,
  mapNavigating = false,
  plotsTruncated = false,
  plotsLoadedCount = 0,
  plotsDrawnCount = 0,
  sectorPlotTotal = 0,
  plansLoading,
  plansError,
  onRegionChange,
  onRegionChangeComplete,
  onPlotPress,
  onPlanPress,
  onSectorPress,
  mapZoom = 10,
  mapLongitudeDelta,
  plotShapes,
  onMapBackgroundPress,
  showPlotPanel,
  onPlotClose,
  onPlotViewAllDetails,
  selectedPlot = null,
}: Props) {
  const { t } = useTranslation();
  const [localMapType, setLocalMapType] = useState<MapType>(mapTypeProp);
  const [showPlotLoading, setShowPlotLoading] = useState(false);
  const plotCalloutSyncRef = useRef<(() => void) | null>(null);
  const navPulse = useRef(new Animated.Value(0)).current;
  const mapType = onMapTypeChange ? mapTypeProp : localMapType;
  const setMapType = onMapTypeChange ?? setLocalMapType;
  const displayMapType = resolveNativeMapType(mapType);
  const plotOpen = selectedPlot != null;

  const plotCoordinate = useMemo(
    () => resolveSelectedPlotCoordinate(selectedPlot),
    [selectedPlot],
  );

  const cadastreMapRef = mapRef;
  const useMapLibre = canUseHabitatVectorTiles();
  const [MapLibreCadastre, setMapLibreCadastre] = useState<
    ComponentType<HabitatMapLibreCadastreProps> | null
  >(null);

  useEffect(() => {
    warnIfMapLibreNativeMissing(USE_HABITAT_VECTOR_TILES);
  }, []);

  useEffect(() => {
    if (!useMapLibre) {
      setMapLibreCadastre(null);
      return;
    }
    let cancelled = false;
    void Promise.resolve()
      .then(() => require("./HabitatMapLibreCadastre") as typeof import("./HabitatMapLibreCadastre"))
      .then((mod) => {
        if (!cancelled) setMapLibreCadastre(() => mod.HabitatMapLibreCadastre);
      });
    return () => {
      cancelled = true;
    };
  }, [useMapLibre]);

  const handleRegionChange = useCallback(() => {
    plotCalloutSyncRef.current?.();
    onRegionChange?.();
  }, [onRegionChange]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      plotCalloutSyncRef.current?.();
      onRegionChangeComplete(region);
    },
    [onRegionChangeComplete],
  );

  const handlePlotClose = useCallback(() => {
    onPlotClose?.();
  }, [onPlotClose]);

  const handleMapPress = useCallback(() => {
    if (plotOpen) {
      handlePlotClose();
      return;
    }
    onMapBackgroundPress?.();
  }, [plotOpen, onMapBackgroundPress, handlePlotClose]);

  const levelHint = (() => {
    if (plotOpen) return null;
    if (selectedSectorId != null && loadingPlots && plotsLoadedCount === 0) {
      const pending = sectorPlotTotal > 0 ? sectorPlotTotal : null;
      return pending
        ? t(
            "habitatCadastre.levelPlotsLoading",
            "Loading all {{count}} plots…",
            { count: pending },
          )
        : t("habitatCadastre.levelPlotsLoadingGeneric", "Loading all plots…");
    }
    if (selectedSectorId != null && plotsLoadedCount > 0) {
      const total = sectorPlotTotal || plotsLoadedCount;
      if (USE_HABITAT_VECTOR_TILES && useMapLibre) {
        return t(
          "habitatCadastre.levelPlotsVectorTiles",
          "{{count}} plots — GPU vector tiles",
          { count: total },
        );
      }
      return t(
        "habitatCadastre.levelPlotsCount",
        "{{count}} plots loaded",
        { count: total },
      );
    }
    if (viewLevel === "sectors") {
      return t("habitatCadastre.levelSectors", "{{count}} areas", {
        count: sectors.length,
      });
    }
    if (viewLevel === "plans") {
      return t("habitatCadastre.levelPlans", "{{count}} zones", {
        count: plans.length,
      });
    }
    return null;
  })();

  const emptyMessage = (() => {
    if (plotOpen || plansLoading) return null;
    if (plansError) {
      return t(
        "habitatCadastre.errorLoadSubdivision",
        "Failed to load cadastre boundaries",
      );
    }
    if (!plans.length && plansLoading === false && selectedSectorId != null) {
      return t("habitatCadastre.emptyPlotsForArea", "No plots for this area");
    }
    if (selectedPlanId != null && !sectors.length && !loadingPlots) {
      return t("habitatCadastre.emptyAreasForZone", "No areas for this zone");
    }
    return null;
  })();

  const loadingRequested = (plansLoading || loadingPlots) && !plotOpen;

  useEffect(() => {
    if (!loadingRequested) {
      setShowPlotLoading(false);
      return;
    }
    const timer = setTimeout(
      () => setShowPlotLoading(true),
      PLOT_LOADING_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [loadingRequested]);

  useEffect(() => {
    if (!mapNavigating) {
      navPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(navPulse, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(navPulse, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mapNavigating, navPulse]);

  const navBarOpacity = navPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <View style={styles.wrap}>
      {useMapLibre && MapLibreCadastre ? (
        <MapLibreCadastre
          mapRef={cadastreMapRef}
          initialRegion={initialRegion}
          mapRegion={mapRegion}
          mapType={mapType}
          viewLevel={viewLevel}
          plans={plans}
          sectors={sectors}
          selectedPlanId={selectedPlanId}
          selectedSectorId={selectedSectorId}
          selectedPlotId={selectedPlotId}
          selectedPlot={selectedPlot}
          districtFallback={districtFallback}
          mapZoom={mapZoom}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPlotPress={onPlotPress}
          onMapBackgroundPress={handleMapPress}
        />
      ) : (
        <MapView
          ref={mapRef as React.RefObject<MapView | null>}
          style={StyleSheet.absoluteFill}
          provider={getMapProvider()}
          initialRegion={initialRegion}
          mapType={displayMapType}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          loadingEnabled={false}
          moveOnMarkerPress={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          <MapErrorBoundary>
            <HabitatMapLayers
              plans={plans}
              sectors={sectors}
              plots={plots}
              plotShapes={plotShapes}
              viewLevel={viewLevel}
              selectedPlanId={selectedPlanId}
              selectedSectorId={selectedSectorId}
              selectedPlotId={selectedPlotId}
              districtFallback={districtFallback}
              onPlanPress={onPlanPress}
              onSectorPress={onSectorPress}
              onPlotPress={onPlotPress}
              mapZoom={mapZoom}
              mapLongitudeDelta={mapLongitudeDelta}
              selectedPlot={selectedPlot}
            />
          </MapErrorBoundary>
          {plotCoordinate ? (
            <HabitatPlotPinMarker coordinate={plotCoordinate} />
          ) : null}
        </MapView>
      )}

      {selectedPlot && plotCoordinate ? (
        <HabitatPlotCalloutOverlay
          mapRef={cadastreMapRef}
          plot={selectedPlot}
          coordinate={plotCoordinate}
          regionSyncRef={plotCalloutSyncRef}
          onClose={handlePlotClose}
          onViewAllDetails={onPlotViewAllDetails}
        />
      ) : null}

      {!showPlotPanel ? (
        <MapToolbar
          mapRef={cadastreMapRef}
          region={mapRegion ?? initialRegion}
          mapType={mapType}
          onMapTypeChange={setMapType}
          topOffset={Math.round(Dimensions.get("window").height * 0.5)}
        />
      ) : null}

      {mapNavigating ? (
        <View style={styles.navTrack} pointerEvents="none">
          <Animated.View style={[styles.navBar, { opacity: navBarOpacity }]} />
        </View>
      ) : null}

      {showPlotLoading ? (
        <View style={styles.loadingChip} pointerEvents="none">
          <ActivityIndicator size="small" color="#717171" />
        </View>
      ) : null}

      {emptyMessage ? (
        <View
          style={[
            styles.banner,
            plotOpen && { bottom: HABITAT_PLOT_PREVIEW_HEIGHT + 16 },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.bannerText}>{emptyMessage}</Text>
        </View>
      ) : levelHint ? (
        <View
          style={[
            styles.levelChip,
            plotOpen && { bottom: HABITAT_PLOT_PREVIEW_HEIGHT + 12 },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.levelText}>{levelHint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#E8ECF0" },
  navTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    zIndex: 20,
  },
  navBar: {
    flex: 1,
    backgroundColor: "#222222",
  },
  loadingChip: {
    position: "absolute",
    top: 72,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  levelChip: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  levelText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "500",
  },
  banner: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  bannerText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
