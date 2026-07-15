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
  TouchableOpacity,
} from "react-native";
import MapView, { Region, UrlTile, type MapPressEvent } from "react-native-maps";
import { useTranslation } from "react-i18next";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatSubSector,
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
import {
  HabitatLandMapCalloutOverlay,
  resolveLandmarkCoordinate,
} from "./HabitatLandMapCallout";
import { HabitatLandForSaleLayer } from "./HabitatLandForSaleLayer";
import type { MapLandmarkRecord } from "../../utils/landmarkMapMarkers";
import { MapToolbar } from "../map/MapToolbar";
import type { PlotShapeDescriptor } from "../../utils/habitatPlotGeometryCache";
import {
  USE_HABITAT_RASTER_OVERLAY,
  HABITAT_RASTER_TILE_SIZE,
  habitatSectorRasterTileUrl,
} from "../../utils/habitatRasterOverlay";
import { habitatApi } from "../../services/habitatApi";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import { theme } from "../../theme";

const ACCENT = theme["color-temporary-primary"];

const PLOT_LOADING_DELAY_MS = 160;

type DistrictFallback = {
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
};
type MapType = "standard" | "satellite" | "sentinel";
/** react-native-maps (legacy fallback) has no custom raster-style support — sentinel maps to satellite there. */
type LegacyMapType = "standard" | "satellite";
function toLegacyMapType(mapType: MapType): LegacyMapType {
  return mapType === "standard" ? "standard" : "satellite";
}

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
  subSectors?: HabitatSubSector[];
  selectedSubSectorId?: number | null;
  onSubSectorPress?: (subSectorId: number) => void;
  districtFallback?: DistrictFallback[];
  loadingPlots?: boolean;
  mapNavigating?: boolean;
  plotsTruncated?: boolean;
  plotsLoadedCount?: number;
  plotsDrawnCount?: number;
  sectorPlotTotal?: number;
  plotsGeometryReady?: boolean;
  plotsRevealReady?: boolean;
  plotsViewportCapped?: boolean;
  plansLoading?: boolean;
  sectorsLoading?: boolean;
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
  /** Verified land listings — always visible on map, independent of cadastre filter. */
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
  subSectors = [],
  selectedSubSectorId = null,
  onSubSectorPress,
  districtFallback = [],
  loadingPlots,
  mapNavigating = false,
  plotsTruncated = false,
  plotsLoadedCount = 0,
  plotsDrawnCount = 0,
  sectorPlotTotal = 0,
  plotsGeometryReady = true,
  plotsRevealReady = true,
  plotsViewportCapped = false,
  plansLoading,
  sectorsLoading = false,
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
  const { t } = useTranslation();
  const [localMapType, setLocalMapType] = useState<MapType>(mapTypeProp);
  const [showPlotLoading, setShowPlotLoading] = useState(false);
  const plotCalloutSyncRef = useRef<(() => void) | null>(null);
  const plotCalloutIdleSyncRef = useRef<(() => void) | null>(null);
  const landCalloutSyncRef = useRef<(() => void) | null>(null);
  const landCalloutIdleSyncRef = useRef<(() => void) | null>(null);
  const navPulse = useRef(new Animated.Value(0)).current;
  const mapType = onMapTypeChange ? mapTypeProp : localMapType;
  const setMapType = onMapTypeChange ?? setLocalMapType;
  // Native map type directly — Apple Maps (iOS) and Google Maps (Android)
  // both render this mapType prop natively (fast, no extra tile-fetch hop);
  // no MapTiler/UrlTile basemap override on either platform for this map.
  const nativeMapType = useMemo(
    () => resolveNativeMapType(toLegacyMapType(mapType)),
    [mapType],
  );
  const plotOpen = selectedPlot != null;
  const landOpen = selectedLand != null;

  const plotCoordinate = useMemo(
    () => resolveSelectedPlotCoordinate(selectedPlot),
    [selectedPlot],
  );

  const landCoordinate = useMemo(
    () => resolveLandmarkCoordinate(selectedLand),
    [selectedLand],
  );

  const resolvedMapRegion = mapRegion ?? initialRegion;

  const cadastreMapRef = mapRef;
  /** True when plot polygons are drawn externally (server raster overlay) — the hook's own geometry pipeline is unused then. */
  const plotsRenderedExternally = USE_HABITAT_RASTER_OVERLAY;

  const handleRegionChange = useCallback(() => {
    plotCalloutSyncRef.current?.();
    landCalloutSyncRef.current?.();
    onRegionChange?.();
  }, [onRegionChange]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      plotCalloutIdleSyncRef.current?.();
      landCalloutIdleSyncRef.current?.();
      plotCalloutSyncRef.current?.();
      landCalloutSyncRef.current?.();
      onRegionChangeComplete(region);
    },
    [onRegionChangeComplete],
  );

  const handlePlotPinPress = useCallback(() => {
    if (selectedPlot) onPlotPress(selectedPlot);
  }, [onPlotPress, selectedPlot]);

  const handlePlotClose = useCallback(() => {
    onPlotClose?.();
  }, [onPlotClose]);

  const handleMapPress = useCallback(() => {
    if (plotOpen) {
      handlePlotClose();
      return;
    }
    if (landOpen) {
      if (landPanelDismissRef?.current) {
        landPanelDismissRef.current();
      } else {
        onLandClose?.();
      }
      return;
    }
    onMapBackgroundPress?.();
  }, [
    plotOpen,
    landOpen,
    handlePlotClose,
    landPanelDismissRef,
    onLandClose,
    onMapBackgroundPress,
  ]);

  /**
   * Raster overlay has no per-plot press events (it's a flat image) — a tap
   * on the native map resolves to a plot via server-side point-in-polygon
   * lookup instead. Passes a minimal stub to onPlotPress; the existing
   * selectPlot flow (useHabitatCadastre.ts) already fetches full plot
   * details whenever plot.id is set, same as every other entry point.
   */
  const handleRasterMapPress = useCallback(
    (event: MapPressEvent) => {
      if (plotOpen || landOpen) {
        handleMapPress();
        return;
      }
      if (
        !USE_HABITAT_RASTER_OVERLAY ||
        selectedSectorId == null ||
        mapNavigating
      ) {
        handleMapPress();
        return;
      }
      const { latitude, longitude } = event.nativeEvent.coordinate;
      habitatApi
        .getPlotAtPoint(selectedSectorId, latitude, longitude)
        .then((plotId) => {
          if (plotId) {
            onPlotPress({
              id: plotId,
              plan_id: selectedPlanId ?? 0,
              sector_id: selectedSectorId,
              plot_number: "",
            });
          } else {
            handleMapPress();
          }
        })
        .catch(() => handleMapPress());
    },
    [
      plotOpen,
      landOpen,
      selectedSectorId,
      selectedPlanId,
      mapNavigating,
      onPlotPress,
      handleMapPress,
    ],
  );

  const levelHint = (() => {
    if (plotOpen || landOpen) return null;
    if (landsForSale.length > 0 && selectedSectorId == null) {
      return t(
        "landmark.map.landsForSaleCount",
        "{{count}} lands for sale on map",
        { count: landsForSale.length },
      );
    }
    if (selectedSectorId != null && USE_HABITAT_RASTER_OVERLAY) {
      const total = sectorPlotTotal || plotsLoadedCount;
      if (total > 0) {
        return t("habitatCadastre.levelPlotsCount", "{{count}} plots loaded", {
          count: total,
        });
      }
    }
    if (
      selectedSectorId != null &&
      !plotsRenderedExternally &&
      !plotsGeometryReady &&
      plotsLoadedCount > 0
    ) {
      return t(
        "habitatCadastre.levelPlotsViewportLoading",
        "Loading visible plots…",
      );
    }
    if (
      selectedSectorId != null &&
      loadingPlots &&
      plotsLoadedCount === 0 &&
      !plotsRenderedExternally
    ) {
      const pending = sectorPlotTotal > 0 ? sectorPlotTotal : null;
      return pending
        ? t(
            "habitatCadastre.levelPlotsMetadataLoading",
            "Loading {{count}} plot records…",
            { count: pending },
          )
        : t("habitatCadastre.levelPlotsLoadingGeneric", "Loading all plots…");
    }
    if (
      selectedSectorId != null &&
      plotsViewportCapped &&
      plotsGeometryReady &&
      plotsDrawnCount > 0
    ) {
      const total = sectorPlotTotal || plotsLoadedCount;
      return t(
        "habitatCadastre.levelPlotsRange",
        "{{drawn}} / {{total}} plots",
        { drawn: plotsDrawnCount, total },
      );
    }
    if (selectedSectorId != null && plotsGeometryReady && plotsDrawnCount > 0) {
      const total = sectorPlotTotal || plotsLoadedCount;
      if (plotsViewportCapped) {
        return t(
          "habitatCadastre.levelPlotsRange",
          "{{drawn}} / {{total}} plots",
          { drawn: plotsDrawnCount, total },
        );
      }
      return t(
        "habitatCadastre.levelPlotsViewportCount",
        "{{count}} plots in view",
        { count: plotsDrawnCount },
      );
    }
    if (selectedSectorId != null && plotsLoadedCount > 0) {
      const total = sectorPlotTotal || plotsLoadedCount;
      return t(
        "habitatCadastre.levelPlotsCount",
        "{{count}} plots loaded",
        { count: total },
      );
    }
    if (viewLevel === "sub_sectors" && subSectors.length > 0) {
      return t(
        "habitatCadastre.levelSubSectors",
        "{{count}} sub-areas — pick one",
        { count: subSectors.length },
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

  const geometryPreparing =
    selectedSectorId != null &&
    !plotsRenderedExternally &&
    !plotsGeometryReady &&
    !loadingPlots;

  const loadingPlan =
    !plotOpen &&
    !landOpen &&
    (plansLoading ||
      (mapNavigating && selectedPlanId != null && selectedSectorId == null) ||
      (sectorsLoading && selectedPlanId != null && selectedSectorId == null));

  const loadingQuartier =
    (plansLoading || loadingPlots || geometryPreparing) &&
    !plotsRenderedExternally &&
    !plotOpen &&
    !landOpen &&
    !loadingPlan;

  const loadingMessage = (() => {
    if (loadingPlan) {
      if (plansLoading) {
        return t("habitatCadastre.gettingPlan", "We're getting your plan…");
      }
      if (sectorsLoading) {
        return t(
          "habitatCadastre.loadingPlanAreas",
          "Loading quartiers for this zone…",
        );
      }
      return t("habitatCadastre.gettingPlan", "We're getting your plan…");
    }
    // One warm, consistent expression for the whole quartier fetch→draw
    // window (metadata fetch, geometry batches, first paint prep) instead
    // of cycling through technical phase messages.
    if ((geometryPreparing || loadingPlots) && selectedSectorId != null) {
      return t("habitatCadastre.gettingPlan", "We're getting your plan…");
    }
    return null;
  })();

  const loadingRequested = loadingPlan || loadingQuartier;
  const loadingDelayMs = loadingPlan ? 0 : PLOT_LOADING_DELAY_MS;

  useEffect(() => {
    if (!loadingRequested) {
      setShowPlotLoading(false);
      return;
    }
    const timer = setTimeout(
      () => setShowPlotLoading(true),
      loadingDelayMs,
    );
    return () => clearTimeout(timer);
  }, [loadingRequested, loadingDelayMs]);

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
      {(
        <MapView
          ref={mapRef as React.RefObject<MapView | null>}
          style={StyleSheet.absoluteFill}
          provider={getMapProvider()}
          initialRegion={initialRegion}
          mapType={nativeMapType}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={handleRasterMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          loadingEnabled={false}
          moveOnMarkerPress={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          // Must not exceed the raster overlay's maximumZ below (and the
          // server's habitatPrewarmMaxZoom) — past that zoom no tile exists
          // for the SDK to fetch, so it stretches the last-loaded bitmap to
          // fill the more-zoomed-in viewport instead. That overzoom stretch
          // is what reads as "plot shapes deform on pinch zoom": the plot
          // coordinates never move, the bitmap they're baked into is just
          // being scaled past its native resolution. Capping the gesture
          // here makes that state unreachable rather than just unlikely.
          maxZoomLevel={USE_HABITAT_RASTER_OVERLAY ? 20 : 21}
        >
          {USE_HABITAT_RASTER_OVERLAY && selectedSectorId != null ? (
            <UrlTile
              // Force a full remount (not just a prop update) on quartier
              // switch — react-native-maps' UrlTile wraps a native tile
              // overlay layer that isn't guaranteed to re-fetch cleanly when
              // urlTemplate changes on an already-mounted instance.
              key={`habitat-raster-${selectedSectorId}`}
              urlTemplate={habitatSectorRasterTileUrl(selectedSectorId)}
              zIndex={5}
              maximumZ={20}
              // @2x retina tiles: the server renders 512px bitmaps (scale=2 in
              // the URL) while keeping standard 256-space {z}/{x}/{y}
              // addressing, so tileSize must be 512 for the map to treat each
              // bitmap as one tile. Keeps plot edges crisp on 2x/3x screens and
              // through the live pinch-zoom scale, instead of upscaling 256px.
              tileSize={HABITAT_RASTER_TILE_SIZE}
            />
          ) : null}
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
              subSectors={subSectors}
              selectedSubSectorId={selectedSubSectorId}
              districtFallback={districtFallback}
              onPlanPress={onPlanPress}
              onSectorPress={onSectorPress}
              onSubSectorPress={onSubSectorPress}
              onPlotPress={onPlotPress}
              mapZoom={mapZoom}
              mapLongitudeDelta={mapLongitudeDelta}
              mapRegion={resolvedMapRegion}
              selectedPlot={selectedPlot}
              mapNavigating={mapNavigating}
              loadingPlots={loadingPlots}
              plotsGeometryReady={plotsGeometryReady}
              plotsRevealReady={plotsRevealReady}
              plotsRenderedExternally={USE_HABITAT_RASTER_OVERLAY}
            />
          </MapErrorBoundary>
          {landsForSale.length > 0 && onLandPress ? (
            <MapErrorBoundary fallback={null}>
              <HabitatLandForSaleLayer
                landmarks={landsForSale}
                mapRegion={resolvedMapRegion}
                mapZoom={mapZoom}
                selectedLandId={selectedLand?.id ?? null}
                showLandPanel={showLandPanel}
                pinRestoreGeneration={landPinRestoreGeneration}
                onLandPress={onLandPress}
                onClusterPress={onLandClusterPress}
              />
            </MapErrorBoundary>
          ) : null}
          {plotCoordinate ? (
            <HabitatPlotPinMarker
              coordinate={plotCoordinate}
              onPress={handlePlotPinPress}
            />
          ) : null}
        </MapView>
      )}

      {selectedPlot && plotCoordinate ? (
        <HabitatPlotCalloutOverlay
          mapRef={cadastreMapRef}
          plot={selectedPlot}
          coordinate={plotCoordinate}
          regionSyncRef={plotCalloutSyncRef}
          regionIdleSyncRef={plotCalloutIdleSyncRef}
          onClose={handlePlotClose}
          onViewAllDetails={onPlotViewAllDetails}
        />
      ) : null}

      {selectedLand && landCoordinate && !plotOpen ? (
        <MapErrorBoundary
          fallback={null}
          onError={() => {
            if (landPanelDismissRef?.current) {
              landPanelDismissRef.current();
            } else {
              onLandClose?.();
            }
          }}
        >
          <HabitatLandMapCalloutOverlay
            mapRef={cadastreMapRef}
            landmark={selectedLand}
            coordinate={landCoordinate}
            regionSyncRef={landCalloutSyncRef}
            regionIdleSyncRef={landCalloutIdleSyncRef}
            dismissRef={landPanelDismissRef}
            onClose={() => onLandClose?.()}
            onViewDetails={onLandViewDetails}
          />
        </MapErrorBoundary>
      ) : null}

      {!showPlotPanel && !showLandPanel ? (
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

      {plansLoading && plans.length === 0 ? (
        <View style={styles.mapBootOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.mapBootText}>
            {t("habitatCadastre.gettingPlan", "We're getting your plan…")}
          </Text>
        </View>
      ) : null}

      {showPlotLoading && loadingMessage ? (
        <View style={styles.loadingChip} pointerEvents="none">
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={styles.loadingChipText}>{loadingMessage}</Text>
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

/** Soft, border-free elevation shared by every floating pill on this screen — Airbnb-style shadow-only cards instead of hairline borders. */
const pillShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
});

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#EBEEF1" },
  mapBoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EBEEF1",
    alignItems: "center",
    justifyContent: "center",
  },
  mapBootOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(235, 238, 241, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    gap: 14,
    paddingHorizontal: 32,
  },
  mapBootText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    textAlign: "center",
  },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    maxWidth: "88%",
    ...pillShadow,
  },
  loadingChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    flexShrink: 1,
  },
  levelChip: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    ...pillShadow,
  },
  levelText: {
    color: "#222222",
    fontSize: 12,
    fontWeight: "600",
  },
  banner: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    ...pillShadow,
  },
  bannerText: {
    color: "#222222",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
