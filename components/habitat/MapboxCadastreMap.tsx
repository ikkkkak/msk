/**
 * Mapbox cadastre map — the Meskeny GPU map engine.
 *
 * Everything heavy renders on the native GPU pipeline: the basemap, the
 * quartier's plots (server MVT vector tiles → FillLayer/LineLayer/
 * SymbolLayer — one source, zero per-plot JS objects), boundaries, land
 * pins. The JS thread only handles state and taps. 8,000-plot quartiers
 * cost the same as 100-plot ones.
 *
 * This module is ONLY loaded via dynamic import after MapProvider resolves
 * the engine to "mapbox" — importing @rnmapbox/maps in a runtime without
 * the native module (Expo Go) crashes at module evaluation.
 */
import React, {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet } from "react-native";
import type { Region } from "react-native-maps";
import Mapbox from "@rnmapbox/maps";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatSubSector,
  HabitatMapViewLevel,
  LatLng,
} from "../../types/habitat";
import { initMapboxEngine, mapboxStyleForMapType, type CadastreMapType } from "../../mapengine/MapEngine";
import {
  createMapboxCadastreHandle,
  cameraStateToRegion,
  regionToCenter,
  regionToZoom,
  regionFromTileJson,
  TILE_BOUNDS_EDGE_PADDING,
} from "../../mapengine/CameraManager";
import {
  EMPTY_FEATURES,
  plansGeoJSON,
  sectorsGeoJSON,
  subSectorsGeoJSON,
  landPolygonGeoJSON,
  landPinsGeoJSON,
  landClustersGeoJSON,
  type LandDisplayItem,
} from "../../mapengine/GeometryProcessor";
import {
  plotFromMvtFeature,
  subSectorIdFromFeature,
  landPressFromFeature,
} from "../../mapengine/SelectionManager";
import { getSectorTileJsonCached } from "../../mapengine/TileCacheManager";
import {
  markQuartierLoadStart,
  markQuartierRendered,
} from "../../mapengine/MapPerformanceMonitor";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import { habitatSectorTileUrl } from "../../utils/habitatVectorTiles";
import { PLAN_LAYER_MAX_ZOOM } from "../../utils/habitatGeo";
import { HABITAT_FOR_SALE, HABITAT_NEUTRAL } from "../../utils/habitatMapTheme";
import { clusterLandmarksForMap } from "../../utils/landmarkMapClustering";
import type { MapLandmarkRecord } from "../../utils/landmarkMapMarkers";
import { LAND_MAP_CLUSTER_THEME as LAND_THEME } from "../../utils/landMapClusterTheme";

initMapboxEngine(Mapbox);

const PLOT_SOURCE_ID = "habitat-plots-mvt";
/** Matches PLOT_LABEL_MIN_ZOOM in utils/habitatGeo.ts — cadastre-sheet-scale only. */
const PLOT_LABEL_MIN_ZOOM = 16;
/** Safety net — clear the loading chip even if render events never fire. */
const TILES_LOADING_TIMEOUT_MS = 12000;

type DistrictFallback = { name: string; coordinates: LatLng[] };

export type MapboxCadastreMapProps = {
  mapRef: React.RefObject<CadastreMapHandle | null>;
  initialRegion: Region;
  mapRegion?: Region;
  mapType?: CadastreMapType;
  viewLevel: HabitatMapViewLevel;
  plans: HabitatPlan[];
  sectors: HabitatSector[];
  selectedPlanId: number | null;
  selectedSectorId: number | null;
  selectedPlotId: number | null;
  selectedPlot?: HabitatPlot | null;
  subSectors?: HabitatSubSector[];
  selectedSubSectorId?: number | null;
  onSubSectorPress?: (subSectorId: number) => void;
  districtFallback?: DistrictFallback[];
  mapZoom?: number;
  onRegionChange?: () => void;
  onRegionChangeComplete: (region: Region) => void;
  onPlotPress: (plot: HabitatPlot) => void;
  onMapBackgroundPress?: () => void;
  landsForSale?: MapLandmarkRecord[];
  selectedLandId?: number | null;
  showLandPanel?: boolean;
  onLandPress?: (landmark: MapLandmarkRecord) => void;
  onLandClusterPress?: (
    cluster: import("../../utils/landmarkMapClustering").LandMapCluster,
  ) => void;
  loadingPlots?: boolean;
  onTilesLoadingChange?: (loading: boolean) => void;
};

function MapboxCadastreMapInner({
  mapRef,
  initialRegion,
  mapRegion,
  mapType = "standard",
  viewLevel,
  plans,
  sectors,
  selectedPlanId,
  selectedSectorId,
  selectedPlotId,
  selectedPlot = null,
  subSectors = [],
  selectedSubSectorId = null,
  onSubSectorPress,
  districtFallback = [],
  mapZoom = 10,
  onRegionChange,
  onRegionChangeComplete,
  onPlotPress,
  onMapBackgroundPress,
  landsForSale = [],
  selectedLandId = null,
  showLandPanel = false,
  onLandPress,
  onLandClusterPress,
  loadingPlots = false,
  onTilesLoadingChange,
}: MapboxCadastreMapProps) {
  const mbMapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const lastRegionKey = useRef("");
  const lastSectorFitId = useRef<number | null>(null);

  const styleURL = useMemo(() => mapboxStyleForMapType(mapType), [mapType]);

  const quartierPinned = selectedSectorId != null;
  const showPlanLayer =
    !quartierPinned && selectedPlanId == null && mapZoom <= PLAN_LAYER_MAX_ZOOM;

  const plansGeo = useMemo(
    () =>
      showPlanLayer
        ? plansGeoJSON(plans, districtFallback, selectedPlanId)
        : EMPTY_FEATURES,
    [showPlanLayer, plans, districtFallback, selectedPlanId],
  );

  const sectorsGeo = useMemo(
    () =>
      !quartierPinned && viewLevel !== "plots"
        ? sectorsGeoJSON(sectors, selectedSectorId)
        : EMPTY_FEATURES,
    [quartierPinned, viewLevel, sectors, selectedSectorId],
  );

  const showSubSectors =
    quartierPinned && selectedSubSectorId == null && subSectors.length > 0;

  const subSectorsGeo = useMemo(
    () => (showSubSectors ? subSectorsGeoJSON(subSectors) : EMPTY_FEATURES),
    [showSubSectors, subSectors],
  );

  const handleSubSectorPress = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const id = subSectorIdFromFeature(e.features?.[0]);
      if (id) onSubSectorPress?.(id);
    },
    [onSubSectorPress],
  );

  const plotTileUrl = useMemo(
    () => (selectedSectorId != null ? habitatSectorTileUrl(selectedSectorId) : null),
    [selectedSectorId],
  );

  // "Getting your plan" chip while quartier tiles stream in.
  useEffect(() => {
    if (!plotTileUrl) {
      onTilesLoadingChange?.(false);
      return;
    }
    if (selectedSectorId != null) markQuartierLoadStart(selectedSectorId);
    onTilesLoadingChange?.(true);
    const timeout = setTimeout(() => {
      onTilesLoadingChange?.(false);
    }, TILES_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [plotTileUrl, selectedSectorId, onTilesLoadingChange]);

  const handleMapFullyRendered = useCallback(() => {
    onTilesLoadingChange?.(false);
    if (selectedSectorId != null) markQuartierRendered(selectedSectorId);
  }, [onTilesLoadingChange, selectedSectorId]);

  /* ---------------- lands for sale (clustered pins) ---------------- */

  const landDisplayItems = useMemo<LandDisplayItem[]>(() => {
    if (!mapRegion || landsForSale.length === 0) return [];
    return clusterLandmarksForMap(
      landsForSale,
      mapRegion,
      mapZoom,
      selectedLandId,
    ) as LandDisplayItem[];
  }, [landsForSale, mapRegion, mapZoom, selectedLandId]);

  const selectedLand = useMemo(
    () =>
      selectedLandId != null
        ? landsForSale.find((l) => l.id === selectedLandId) ?? null
        : null,
    [landsForSale, selectedLandId],
  );

  const landsPolygonGeo = useMemo(
    () => landPolygonGeoJSON(selectedLand),
    [selectedLand],
  );

  const landsPinsGeo = useMemo(
    () =>
      landPinsGeoJSON(
        landDisplayItems,
        showLandPanel && selectedLandId != null ? selectedLandId : null,
      ),
    [landDisplayItems, showLandPanel, selectedLandId],
  );

  const landsClustersGeo = useMemo(
    () => landClustersGeoJSON(landDisplayItems),
    [landDisplayItems],
  );

  const clusterById = useMemo(() => {
    const map = new Map<number, LandDisplayItem>();
    for (const item of landDisplayItems) {
      if (item.type === "cluster") map.set(item.clusterId, item);
    }
    return map;
  }, [landDisplayItems]);

  const handleLandLayerPress = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const press = landPressFromFeature(e.features?.[0]);
      if (!press) return;
      if (press.kind === "cluster") {
        const cluster = clusterById.get(press.clusterId);
        if (cluster && cluster.type === "cluster") onLandClusterPress?.(cluster);
        return;
      }
      const lm = landsForSale.find((l) => l.id === press.landId);
      if (lm) onLandPress?.(lm);
    },
    [clusterById, landsForSale, onLandClusterPress, onLandPress],
  );

  /* ---------------- camera ---------------- */

  useImperativeHandle(
    mapRef,
    () => createMapboxCadastreHandle(mbMapRef, cameraRef),
    [],
  );

  const flyToRegion = useCallback((region: Region, animated = true) => {
    cameraRef.current?.setCamera({
      centerCoordinate: regionToCenter(region),
      zoomLevel: regionToZoom(region),
      animationDuration: animated ? 620 : 0,
      animationMode: "easeTo",
    });
  }, []);

  useEffect(() => {
    if (!mapRegion) return;
    const key = `${mapRegion.latitude.toFixed(5)}:${mapRegion.longitude.toFixed(5)}:${mapRegion.latitudeDelta.toFixed(5)}`;
    if (key === lastRegionKey.current) return;
    lastRegionKey.current = key;
    flyToRegion(mapRegion);
  }, [mapRegion, flyToRegion]);

  const latestRegionRef = useRef(mapRegion ?? initialRegion);
  latestRegionRef.current = mapRegion ?? initialRegion;

  const mapReadyAppliedRef = useRef(false);
  const handleMapReady = useCallback(() => {
    if (mapReadyAppliedRef.current) return;
    mapReadyAppliedRef.current = true;
    flyToRegion(latestRegionRef.current, false);
  }, [flyToRegion]);

  // Quartier pinned: fit camera to MVT TileJSON bounds (authoritative extent).
  useEffect(() => {
    if (selectedSectorId == null) {
      lastSectorFitId.current = null;
      return;
    }
    if (lastSectorFitId.current === selectedSectorId) return;
    lastSectorFitId.current = selectedSectorId;

    let cancelled = false;
    void getSectorTileJsonCached(selectedSectorId).then((tileJson) => {
      if (cancelled || !tileJson?.bounds) return;
      const [west, south, east, north] = tileJson.bounds;
      cameraRef.current?.fitBounds(
        [east, north],
        [west, south],
        [...TILE_BOUNDS_EDGE_PADDING],
        620,
      );
      const region = regionFromTileJson(tileJson);
      if (region) {
        lastRegionKey.current = `${region.latitude.toFixed(5)}:${region.longitude.toFixed(5)}:${region.latitudeDelta.toFixed(5)}`;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSectorId]);

  /* ---------------- region events ---------------- */

  const handleCameraChanged = useCallback(() => {
    onRegionChange?.();
  }, [onRegionChange]);

  const handleMapIdle = useCallback(
    (state: { properties?: { center?: number[]; zoom?: number } }) => {
      const center = state?.properties?.center;
      const zoom = state?.properties?.zoom;
      if (!center || center.length < 2 || zoom == null) return;
      const region = cameraStateToRegion([center[0]!, center[1]!], zoom);
      // Self-reported region — mark BEFORE it round-trips as mapRegion prop,
      // so the sync effect doesn't fight the user's own gesture.
      lastRegionKey.current = `${region.latitude.toFixed(5)}:${region.longitude.toFixed(5)}:${region.latitudeDelta.toFixed(5)}`;
      onRegionChangeComplete(region);
    },
    [onRegionChangeComplete],
  );

  const handlePlotPress = useCallback(
    (e: { features: GeoJSON.Feature[] }) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const plot = plotFromMvtFeature(feature);
      if (plot) onPlotPress(plot);
    },
    [onPlotPress],
  );

  const handleBackgroundPress = useCallback(() => {
    onMapBackgroundPress?.();
  }, [onMapBackgroundPress]);

  return (
    <Mapbox.MapView
      ref={mbMapRef}
      style={StyleSheet.absoluteFill}
      styleURL={styleURL}
      // Mapbox wordmark + attribution (bottom-left) — required by Mapbox's
      // terms of service, and the professional signal that this is the real
      // Mapbox engine.
      logoEnabled
      attributionEnabled
      attributionPosition={{ bottom: 8, left: 96 }}
      logoPosition={{ bottom: 8, left: 8 }}
      compassEnabled={false}
      scaleBarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={handleBackgroundPress}
      onCameraChanged={handleCameraChanged}
      onMapIdle={handleMapIdle}
      onDidFinishRenderingMapFully={handleMapFullyRendered}
      onDidFinishLoadingMap={handleMapReady}
    >
      <Mapbox.Camera
        ref={cameraRef}
        defaultSettings={{
          centerCoordinate: regionToCenter(initialRegion),
          zoomLevel: regionToZoom(initialRegion),
        }}
        minZoomLevel={2}
        maxZoomLevel={20}
      />

      {plansGeo.features.length > 0 ? (
        <Mapbox.ShapeSource id="habitat-plans" shape={plansGeo}>
          <Mapbox.FillLayer
            id="habitat-plans-fill"
            style={{
              fillColor: ["get", "color"],
              fillOpacity: ["case", ["get", "selected"], 0.14, 0.1],
            }}
          />
          <Mapbox.LineLayer
            id="habitat-plans-line"
            style={{
              lineColor: ["get", "color"],
              lineWidth: ["case", ["get", "selected"], 1.8, 1.2],
            }}
          />
        </Mapbox.ShapeSource>
      ) : null}

      {sectorsGeo.features.length > 0 ? (
        <Mapbox.ShapeSource id="habitat-sectors" shape={sectorsGeo}>
          <Mapbox.FillLayer
            id="habitat-sectors-fill"
            style={{
              fillColor: "#3D5A80",
              fillOpacity: ["case", ["get", "selected"], 0.11, 0.08],
            }}
          />
          <Mapbox.LineLayer
            id="habitat-sectors-line"
            style={{
              lineColor: "#3D5A80",
              lineWidth: ["case", ["get", "selected"], 1.5, 0.95],
            }}
          />
        </Mapbox.ShapeSource>
      ) : null}

      {subSectorsGeo.features.length > 0 ? (
        <Mapbox.ShapeSource
          id="habitat-sub-sectors"
          shape={subSectorsGeo}
          onPress={handleSubSectorPress}
        >
          <Mapbox.CircleLayer
            id="habitat-sub-sectors-dot"
            style={{
              circleRadius: 16,
              circleColor: HABITAT_NEUTRAL.plotStroke,
              circleStrokeWidth: 2,
              circleStrokeColor: "#FFFFFF",
            }}
          />
          <Mapbox.SymbolLayer
            id="habitat-sub-sectors-label"
            style={{
              textField: ["get", "name"],
              textSize: 11,
              textAllowOverlap: true,
              textIgnorePlacement: true,
              textColor: "#FFFFFF",
            }}
          />
        </Mapbox.ShapeSource>
      ) : null}

      {plotTileUrl && !loadingPlots ? (
        <Mapbox.VectorSource
          id={PLOT_SOURCE_ID}
          tileUrlTemplates={[plotTileUrl]}
          minZoomLevel={12}
          maxZoomLevel={20}
          onPress={handlePlotPress}
        >
          <Mapbox.FillLayer
            id="habitat-plots-fill"
            sourceLayerID="plots"
            style={{
              fillColor: [
                "case",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotFill,
                HABITAT_NEUTRAL.plotFill,
              ],
              fillOpacity: [
                "interpolate",
                ["linear"],
                ["zoom"],
                12,
                0.22,
                15,
                0.35,
                18,
                0.42,
              ],
            }}
          />
          <Mapbox.LineLayer
            id="habitat-plots-line"
            sourceLayerID="plots"
            minZoomLevel={13}
            style={{
              lineColor: [
                "case",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotStroke,
                HABITAT_NEUTRAL.plotStroke,
              ],
              lineWidth: [
                "interpolate",
                ["linear"],
                ["zoom"],
                13,
                0.6,
                16,
                1.2,
                18,
                1.6,
              ],
            }}
          />
          {/* Selected-plot spotlight — always mounted with a -1 sentinel
              filter so selection changes update ONE filter value on the GPU
              instead of adding/removing layers. */}
          <Mapbox.FillLayer
            id="habitat-plots-selected-fill"
            sourceLayerID="plots"
            filter={["==", ["get", "id"], selectedPlotId ?? -1]}
            style={{
              fillColor: "rgba(255, 45, 139, 0.38)",
              fillOpacity: 0.5,
            }}
          />
          <Mapbox.LineLayer
            id="habitat-plots-selected-line"
            sourceLayerID="plots"
            filter={["==", ["get", "id"], selectedPlotId ?? -1]}
            style={{ lineColor: "#FF2D8B", lineWidth: 2 }}
          />
          <Mapbox.SymbolLayer
            id="habitat-plots-label"
            sourceLayerID="plots"
            minZoomLevel={PLOT_LABEL_MIN_ZOOM}
            style={{
              textField: [
                "case",
                [">", ["to-number", ["get", "area_rounded"]], 0],
                ["concat", ["get", "plot_number"], "\n", ["get", "area_rounded"]],
                ["get", "plot_number"],
              ],
              textSize: [
                "interpolate",
                ["linear"],
                ["zoom"],
                PLOT_LABEL_MIN_ZOOM,
                10,
                18,
                12,
                20,
                14,
              ],
              textLineHeight: 1.05,
              textAllowOverlap: false,
              textIgnorePlacement: false,
              textColor: [
                "case",
                ["==", ["get", "id"], selectedPlotId ?? -1],
                "#FFFFFF",
                ["boolean", ["get", "is_for_sale"], false],
                "#FFFFFF",
                "#374151",
              ],
              textHaloColor: [
                "case",
                ["==", ["get", "id"], selectedPlotId ?? -1],
                "#FF2D8B",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotStroke,
                "rgba(255,255,255,0.92)",
              ],
              textHaloWidth: 1.6,
            }}
          />
        </Mapbox.VectorSource>
      ) : null}

      {onLandPress ? (
        <Mapbox.ShapeSource id="habitat-lands-polygons" shape={landsPolygonGeo}>
          <Mapbox.FillLayer
            id="habitat-lands-fill"
            style={{ fillColor: LAND_THEME.pin, fillOpacity: 0.24 }}
          />
          <Mapbox.LineLayer
            id="habitat-lands-line"
            style={{ lineColor: LAND_THEME.pin, lineWidth: 2.5 }}
          />
        </Mapbox.ShapeSource>
      ) : null}

      {onLandPress ? (
        <Mapbox.ShapeSource
          id="habitat-lands-clusters"
          shape={landsClustersGeo}
          onPress={handleLandLayerPress}
        >
          <Mapbox.CircleLayer
            id="habitat-lands-cluster-dot"
            filter={["==", ["get", "kind"], "cluster"]}
            style={{
              circleRadius: ["step", ["get", "count"], 16, 5, 18, 10, 20, 20, 22],
              circleColor: LAND_THEME.bubble,
              circleStrokeWidth: 2,
              circleStrokeColor: LAND_THEME.bubbleBorder,
            }}
          />
          <Mapbox.SymbolLayer
            id="habitat-lands-cluster-count"
            filter={["==", ["get", "kind"], "cluster"]}
            style={{
              textField: ["get", "label"],
              textSize: 13,
              textAllowOverlap: true,
              textIgnorePlacement: true,
              textColor: LAND_THEME.label,
            }}
          />
        </Mapbox.ShapeSource>
      ) : null}

      {onLandPress ? (
        <Mapbox.ShapeSource
          id="habitat-lands-pins"
          shape={landsPinsGeo}
          onPress={handleLandLayerPress}
        >
          <Mapbox.CircleLayer
            id="habitat-lands-pin-stem"
            filter={["==", ["get", "pin_visible"], 1]}
            style={{
              circleRadius: [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                3,
                2.5,
              ],
              circleColor: [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                LAND_THEME.pinSelected,
                LAND_THEME.pinStem,
              ],
              circleTranslate: [0, 6],
              circleOpacity: 0.95,
            }}
          />
          <Mapbox.CircleLayer
            id="habitat-lands-pin-dot"
            filter={["==", ["get", "pin_visible"], 1]}
            style={{
              circleRadius: [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                8,
                7,
              ],
              circleColor: [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                LAND_THEME.pinSelected,
                LAND_THEME.pin,
              ],
              circleStrokeWidth: 2,
              circleStrokeColor: LAND_THEME.pinBorder,
            }}
          />
        </Mapbox.ShapeSource>
      ) : null}
    </Mapbox.MapView>
  );
}

export const MapboxCadastreMap = memo(MapboxCadastreMapInner);
