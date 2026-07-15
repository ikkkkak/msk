/**
 * MapLibre cadastre map — GPU vector tiles for quartier plots (no React polygons).
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
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  VectorSource,
  type CameraRef,
  type MapRef,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatSubSector,
  HabitatMapViewLevel,
  LatLng,
} from "../../types/habitat";
import { getMapTilerStyleUrl, MAPTILER_API_KEY } from "../../config/mapTiler";
import {
  createMapLibreCadastreHandle,
  regionToMapLibreCenter,
  regionToMapLibreZoom,
  type CadastreMapHandle,
} from "../../utils/habitatCadastreMapRef";
import {
  habitatPlansGeoJSON,
  habitatSectorsGeoJSON,
  habitatSubSectorsGeoJSON,
} from "../../utils/habitatMapLibreGeo";
import { habitatSectorTileUrl } from "../../utils/habitatVectorTiles";
import { habitatApi } from "../../services/habitatApi";
import {
  regionFromTileJson,
  TILE_BOUNDS_EDGE_PADDING,
} from "../../utils/habitatTileCamera";
import { PLAN_LAYER_MAX_ZOOM } from "../../utils/habitatGeo";
import { HABITAT_FOR_SALE, HABITAT_NEUTRAL } from "../../utils/habitatMapTheme";
import {
  landmarkPlotRing,
  type MapLandmarkRecord,
} from "../../utils/landmarkMapMarkers";
import {
  clusterLandmarksForMap,
  formatLandClusterCount,
  type LandMapCluster,
} from "../../utils/landmarkMapClustering";
import { LAND_MAP_CLUSTER_THEME as LAND_THEME } from "../../utils/landMapClusterTheme";

const PLOT_SOURCE_ID = "habitat-plots-mvt";
const PLOT_FILL_LAYER = "habitat-plots-fill";
const PLOT_LINE_LAYER = "habitat-plots-line";
const PLOT_SELECTED_FILL = "habitat-plots-selected-fill";
const PLOT_SELECTED_LINE = "habitat-plots-selected-line";
const PLOT_LABEL_LAYER = "habitat-plots-label";
/** Matches PLOT_LABEL_MIN_ZOOM in utils/habitatGeo.ts — cadastre-sheet-scale only. */
const PLOT_LABEL_MIN_ZOOM = 16;

const MAPLIBRE_DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

/**
 * Apple Maps imagery via Leaflet CDN (vector tile base).
 * Used as fallback when glyph loading fails (common in dev/offline scenarios).
 */
const MAPLIBRE_APPLE_MAPS_STYLE: StyleSpecification = {
  version: 8,
  name: "Apple Maps",
  sources: {
    "apple-maps": {
      type: "raster",
      tiles: [
        "https://tiles{1,2,3}.geo.apple.com/tiles/v1/satc?z={z}&x={x}&y={y}&accessToken=",
      ],
      tileSize: 256,
      attribution: "Apple Maps",
    },
  },
  layers: [
    {
      id: "apple-maps-layer",
      type: "raster",
      source: "apple-maps",
    },
  ],
};

type DistrictFallback = { name: string; coordinates: LatLng[] };
type MapType = "standard" | "satellite" | "sentinel";

/**
 * Esri World Imagery — actively re-flown/updated aerial+satellite mosaic,
 * not a single dated dataset like MapTiler's satellite tier. Free tier via
 * the public ArcGIS Online REST endpoint (no API key). Note the {z}/{y}/{x}
 * tile order — Esri's scheme, not the usual {z}/{x}/{y}.
 */
const ESRI_WORLD_IMAGERY_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-world-imagery": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics, GIS User Community",
    },
  },
  layers: [
    {
      id: "esri-world-imagery-layer",
      type: "raster",
      source: "esri-world-imagery",
    },
  ],
};

/**
 * Sentinel-2 cloudless annual mosaic (EOX, sentinel-2.eu program) — genuinely
 * current (2025 mosaic) and free, no API key, but the sensor itself is
 * 10m/pixel: individual buildings/plots are not distinguishable, only
 * useful as a "how has this whole area changed" overview, not a
 * building-detail view like Esri. Kept as a separate opt-in toggle rather
 * than replacing satellite for that reason.
 */
const SENTINEL2_2025_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "sentinel2-2025": {
      type: "raster",
      tiles: [
        "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg",
      ],
      tileSize: 256,
      maxzoom: 14,
      attribution: "Sentinel-2 cloudless 2025 by EOX IT Services / Copernicus",
    },
  },
  layers: [
    {
      id: "sentinel2-2025-layer",
      type: "raster",
      source: "sentinel2-2025",
    },
  ],
};

function resolveMapLibreStyle(mapType: MapType): string | StyleSpecification {
  if (mapType === "satellite") return ESRI_WORLD_IMAGERY_STYLE;
  if (mapType === "sentinel") return SENTINEL2_2025_STYLE;
  // Use Apple Maps by default (glyph-free, native platform imagery)
  return MAPLIBRE_APPLE_MAPS_STYLE;
}

export type HabitatMapLibreCadastreProps = {
  mapRef: React.RefObject<CadastreMapHandle | null>;
  initialRegion: Region;
  mapRegion?: Region;
  mapType?: MapType;
  viewLevel: HabitatMapViewLevel;
  plans: HabitatPlan[];
  sectors: HabitatSector[];
  selectedPlanId: number | null;
  selectedSectorId: number | null;
  selectedPlotId: number | null;
  selectedPlot?: HabitatPlot | null;
  /** Ilot subdivisions of the pinned quartier — only rendered when non-empty and none selected yet. */
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
  onLandClusterPress?: (cluster: import("../../utils/landmarkMapClustering").LandMapCluster) => void;
  loadingPlots?: boolean;
  /** True while the GPU map is still fetching/rendering vector tiles for the pinned quartier. */
  onTilesLoadingChange?: (loading: boolean) => void;
};

/** Safety net — clear the loading state even if the render-fully event never fires (e.g. no network). */
const TILES_LOADING_TIMEOUT_MS = 12000;

function viewStateToRegion(v: ViewStateChangeEvent): Region {
  const [lng, lat] = v.center;
  const zoom = v.zoom;
  const longitudeDelta = 360 / Math.pow(2, zoom);
  const latitudeDelta = longitudeDelta;
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta,
    longitudeDelta,
  };
}

function plotFromMvtFeature(feature: GeoJSON.Feature): HabitatPlot | null {
  const props = feature.properties ?? {};
  const id = Number(feature.id ?? props.id ?? 0);
  if (!id) return null;
  return {
    id,
    plot_number: String(props.plot_number ?? ""),
    sector_id: Number(props.sector_id ?? 0),
    plan_id: Number(props.plan_id ?? 0),
    is_for_sale: Boolean(props.is_for_sale),
    area_m2: props.area_m2 != null ? Number(props.area_m2) : null,
    area_rounded: props.area_rounded != null ? Number(props.area_rounded) : null,
  } as HabitatPlot;
}

function HabitatMapLibreCadastreInner({
  mapRef,
  initialRegion,
  mapRegion,
  mapType = "satellite",
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
}: HabitatMapLibreCadastreProps) {
  const mlMapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const lastRegionKey = useRef("");
  const lastSectorFitId = useRef<number | null>(null);

  const mapStyle = useMemo(() => resolveMapLibreStyle(mapType), [mapType]);

  const quartierPinned = selectedSectorId != null;
  const showPlanLayer =
    !quartierPinned && selectedPlanId == null && mapZoom <= PLAN_LAYER_MAX_ZOOM;

  const plansGeo = useMemo(
    () =>
      showPlanLayer
        ? habitatPlansGeoJSON(plans, districtFallback, selectedPlanId)
        : { type: "FeatureCollection" as const, features: [] },
    [showPlanLayer, plans, districtFallback, selectedPlanId],
  );

  const sectorsGeo = useMemo(
    () =>
      !quartierPinned && viewLevel !== "plots"
        ? habitatSectorsGeoJSON(sectors, selectedSectorId)
        : { type: "FeatureCollection" as const, features: [] },
    [quartierPinned, viewLevel, sectors, selectedSectorId],
  );

  const showSubSectors =
    quartierPinned && selectedSubSectorId == null && subSectors.length > 0;

  const subSectorsGeo = useMemo(
    () =>
      showSubSectors
        ? habitatSubSectorsGeoJSON(subSectors)
        : { type: "FeatureCollection" as const, features: [] },
    [showSubSectors, subSectors],
  );

  const handleSubSectorPress = useCallback(
    (e: NativeSyntheticEvent<{ features: GeoJSON.Feature[] }>) => {
      const feature = e.nativeEvent.features?.[0];
      const id = Number(feature?.properties?.sub_sector_id ?? 0);
      if (id) onSubSectorPress?.(id);
    },
    [onSubSectorPress],
  );

  const plotTileUrl = useMemo(
    () =>
      selectedSectorId != null
        ? habitatSectorTileUrl(selectedSectorId)
        : null,
    [selectedSectorId],
  );

  // Show "getting your plan" while the pinned quartier's vector tiles are
  // still downloading/rendering — MapLibre fetches tiles silently otherwise,
  // so a large quartier (7-8K+ plots, many tiles) would look like nothing is
  // happening. onDidFinishRenderingMapFully fires once the map has no more
  // pending tile loads for the current viewport; a timeout is a safety net
  // in case it never fires (e.g. no network).
  useEffect(() => {
    if (!plotTileUrl) {
      onTilesLoadingChange?.(false);
      return;
    }
    onTilesLoadingChange?.(true);
    const timeout = setTimeout(() => {
      onTilesLoadingChange?.(false);
    }, TILES_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [plotTileUrl, onTilesLoadingChange]);

  const handleMapFullyRendered = useCallback(() => {
    onTilesLoadingChange?.(false);
  }, [onTilesLoadingChange]);

  const landDisplayItems = useMemo(() => {
    if (!mapRegion || landsForSale.length === 0) return [];
    return clusterLandmarksForMap(
      landsForSale,
      mapRegion,
      mapZoom,
      selectedLandId,
    );
  }, [landsForSale, mapRegion, mapZoom, selectedLandId]);

  const visibleLands = useMemo(() => {
    return landDisplayItems
      .filter((item) => item.type === "land")
      .map((item) => (item.type === "land" ? item.landmark : null))
      .filter((lm): lm is MapLandmarkRecord => lm != null);
  }, [landDisplayItems]);

  const visibleLandById = useMemo(() => {
    const map = new Map<number, MapLandmarkRecord>();
    for (const lm of visibleLands) map.set(lm.id, lm);
    for (const lm of landsForSale) map.set(lm.id, lm);
    return map;
  }, [visibleLands, landsForSale]);

  const clusterById = useMemo(() => {
    const map = new Map<number, LandMapCluster>();
    for (const item of landDisplayItems) {
      if (item.type === "cluster") map.set(item.clusterId, item);
    }
    return map;
  }, [landDisplayItems]);

  const landsPolygonGeo = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    if (!selectedLandId) {
      return { type: "FeatureCollection" as const, features };
    }
    const lm =
      visibleLandById.get(selectedLandId) ??
      landsForSale.find((l) => l.id === selectedLandId);
    if (!lm) {
      return { type: "FeatureCollection" as const, features };
    }
    const ring = landmarkPlotRing(lm);
    if (!ring || ring.length < 3) {
      return { type: "FeatureCollection" as const, features };
    }
    features.push({
      type: "Feature",
      id: lm.id,
      properties: { id: lm.id },
      geometry: {
        type: "Polygon",
        coordinates: [ring.map((p) => [p.longitude, p.latitude])],
      },
    });
    return { type: "FeatureCollection" as const, features };
  }, [visibleLandById, landsForSale, selectedLandId]);

  const landsPinsGeo = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    for (const item of landDisplayItems) {
      if (item.type !== "land") continue;
      const hidden = showLandPanel && selectedLandId === item.landmark.id;
      features.push({
        type: "Feature",
        id: item.landmark.id,
        properties: {
          id: item.landmark.id,
          kind: "land",
          pin_visible: hidden ? 0 : 1,
        },
        geometry: {
          type: "Point",
          coordinates: [item.coordinate.longitude, item.coordinate.latitude],
        },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [landDisplayItems, showLandPanel, selectedLandId]);

  const landsClustersGeo = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    for (const item of landDisplayItems) {
      if (item.type !== "cluster") continue;
      features.push({
        type: "Feature",
        id: `cluster-${item.clusterId}`,
        properties: {
          kind: "cluster",
          cluster_id: item.clusterId,
          count: item.count,
          label: formatLandClusterCount(item.count),
        },
        geometry: {
          type: "Point",
          coordinates: [item.coordinate.longitude, item.coordinate.latitude],
        },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [landDisplayItems]);

  useImperativeHandle(
    mapRef,
    () => createMapLibreCadastreHandle(mlMapRef, cameraRef),
    [],
  );

  const flyToRegion = useCallback((region: Region, animated = true) => {
    cameraRef.current?.easeTo({
      center: regionToMapLibreCenter(region),
      zoom: regionToMapLibreZoom(region),
      duration: animated ? 620 : 0,
      easing: "ease",
    });
  }, []);

  useEffect(() => {
    if (!mapRegion) return;
    const key = `${mapRegion.latitude.toFixed(5)}:${mapRegion.longitude.toFixed(5)}:${mapRegion.latitudeDelta.toFixed(5)}`;
    if (key === lastRegionKey.current) return;
    lastRegionKey.current = key;
    flyToRegion(mapRegion);
  }, [mapRegion, flyToRegion]);

  // Always-current region for handleMapReady (fires once, async — a plain
  // closure captured at mount time could read a stale mapRegion).
  const latestRegionRef = useRef(mapRegion ?? initialRegion);
  latestRegionRef.current = mapRegion ?? initialRegion;

  /**
   * <Camera>'s declarative "stop" prop is always sent — even when this
   * component only passes initialViewState — because Camera.js spreads every
   * unrecognized prop into a `stop` object; with none of the stop fields set
   * that object is `{}`, still a real, distinct prop value React sends to
   * native every update. Verified in MLRNCameraComponentView.mm: initialViewState
   * is applied once on first updateProps, immediately followed in the same
   * pass by a stop-diff check that (on mount) sees stop change from unset to
   * `{}` and calls setStop with only defaulted padding/easing — no
   * center/zoom — which the native camera update path doesn't treat as a
   * no-op, landing the camera at (0,0)/minZoom instead of initialViewState's
   * position. Rather than fight that internal timing, force the correct
   * position explicitly once the map confirms it's actually ready — this is
   * guaranteed to be the last camera command applied at startup.
   */
  const mapReadyAppliedRef = useRef(false);
  const handleMapReady = useCallback(() => {
    if (mapReadyAppliedRef.current) return;
    mapReadyAppliedRef.current = true;
    flyToRegion(latestRegionRef.current, false);
  }, [flyToRegion]);

  // GPU quartier: fit camera to MVT TileJSON bounds once per sector (authoritative extent).
  useEffect(() => {
    if (selectedSectorId == null) {
      lastSectorFitId.current = null;
      return;
    }
    if (lastSectorFitId.current === selectedSectorId) return;
    lastSectorFitId.current = selectedSectorId;

    let cancelled = false;
    void habitatApi.getSectorTileJson(selectedSectorId).then((tileJson) => {
      if (cancelled || !tileJson?.bounds) return;
      const [west, south, east, north] = tileJson.bounds;
      cameraRef.current?.fitBounds(
        [west, south, east, north],
        {
          padding: TILE_BOUNDS_EDGE_PADDING,
          duration: 620,
          easing: "ease",
        },
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

  const handleRegionIsChanging = useCallback(() => {
    onRegionChange?.();
  }, [onRegionChange]);

  const handleRegionDidChange = useCallback(
    (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      onRegionChange?.();
      const region = viewStateToRegion(e.nativeEvent);
      // Mark this region as self-reported *before* it round-trips back down
      // as the mapRegion prop. Without this, the mapRegion-sync effect below
      // would see "new" coordinates (parent state update always creates a
      // new object) and call flyToRegion/easeTo again for a region the
      // camera is already at — fighting the user's own pan/zoom gesture on
      // every single frame. This is very likely the "confuses"/janky
      // behavior reported while panning inside a pinned quartier.
      lastRegionKey.current = `${region.latitude.toFixed(5)}:${region.longitude.toFixed(5)}:${region.latitudeDelta.toFixed(5)}`;
      onRegionChangeComplete(region);
    },
    [onRegionChange, onRegionChangeComplete],
  );

  const handlePlotPress = useCallback(
    (e: NativeSyntheticEvent<{ features: GeoJSON.Feature[] }>) => {
      const feature = e.nativeEvent.features?.[0];
      if (!feature) return;
      const plot = plotFromMvtFeature(feature);
      if (plot) onPlotPress(plot);
    },
    [onPlotPress],
  );

  const handleLandLayerPress = useCallback(
    (e: NativeSyntheticEvent<{ features: GeoJSON.Feature[] }>) => {
      const feature = e.nativeEvent.features?.[0];
      if (!feature) return;
      const kind = String(feature.properties?.kind ?? "");

      if (kind === "cluster") {
        const clusterId = Number(feature.properties?.cluster_id ?? 0);
        const cluster = clusterById.get(clusterId);
        if (cluster) onLandClusterPress?.(cluster);
        return;
      }

      if (!onLandPress) return;
      const id = Number(feature.id ?? feature.properties?.id ?? 0);
      if (!id) return;
      const lm = visibleLandById.get(id) ?? landsForSale.find((l) => l.id === id);
      if (lm) onLandPress(lm);
    },
    [
      onLandPress,
      onLandClusterPress,
      visibleLandById,
      landsForSale,
      clusterById,
    ],
  );

  const initialCenter = regionToMapLibreCenter(initialRegion);
  const initialZoom = regionToMapLibreZoom(initialRegion);

  return (
    <MapLibreMap
      ref={mlMapRef}
      style={StyleSheet.absoluteFill}
      mapStyle={mapStyle}
      attribution={false}
      logo={false}
      compass={false}
      scaleBar={false}
      touchRotate={false}
      touchPitch={false}
      onPress={onMapBackgroundPress}
      onRegionIsChanging={handleRegionIsChanging}
      onRegionDidChange={handleRegionDidChange}
      onDidFinishRenderingMapFully={handleMapFullyRendered}
      onDidFinishLoadingMap={handleMapReady}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: initialCenter,
          zoom: initialZoom,
        }}
        minZoom={2}
        maxZoom={20}
      />

      {plansGeo.features.length > 0 ? (
        <GeoJSONSource id="habitat-plans" data={plansGeo}>
          <Layer
            id="habitat-plans-fill"
            type="fill"
            paint={{
              "fill-color": ["get", "color"],
              "fill-opacity": [
                "case",
                ["get", "selected"],
                0.14,
                0.1,
              ],
            }}
          />
          <Layer
            id="habitat-plans-line"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": [
                "case",
                ["get", "selected"],
                1.8,
                1.2,
              ],
            }}
          />
        </GeoJSONSource>
      ) : null}

      {sectorsGeo.features.length > 0 ? (
        <GeoJSONSource id="habitat-sectors" data={sectorsGeo}>
          <Layer
            id="habitat-sectors-fill"
            type="fill"
            paint={{
              "fill-color": "#3D5A80",
              "fill-opacity": [
                "case",
                ["get", "selected"],
                0.11,
                0.08,
              ],
            }}
          />
          <Layer
            id="habitat-sectors-line"
            type="line"
            paint={{
              "line-color": "#3D5A80",
              "line-width": [
                "case",
                ["get", "selected"],
                1.5,
                0.95,
              ],
            }}
          />
        </GeoJSONSource>
      ) : null}

      {subSectorsGeo.features.length > 0 ? (
        <GeoJSONSource
          id="habitat-sub-sectors"
          data={subSectorsGeo}
          onPress={handleSubSectorPress}
        >
          <Layer
            id="habitat-sub-sectors-dot"
            type="circle"
            paint={{
              "circle-radius": 16,
              "circle-color": HABITAT_NEUTRAL.plotStroke,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            }}
          />
          <Layer
            id="habitat-sub-sectors-label"
            type="symbol"
            layout={{
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": "#FFFFFF",
            }}
          />
        </GeoJSONSource>
      ) : null}

      {plotTileUrl && !loadingPlots ? (
        <VectorSource
          id={PLOT_SOURCE_ID}
          tiles={[plotTileUrl]}
          minzoom={12}
          maxzoom={20}
          onPress={handlePlotPress}
        >
          <Layer
            id={PLOT_FILL_LAYER}
            type="fill"
            source={PLOT_SOURCE_ID}
            source-layer="plots"
            minzoom={12}
            maxzoom={20}
            paint={{
              "fill-color": [
                "case",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotFill,
                HABITAT_NEUTRAL.plotFill,
              ],
              "fill-opacity": [
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
          <Layer
            id={PLOT_LINE_LAYER}
            type="line"
            source={PLOT_SOURCE_ID}
            source-layer="plots"
            minzoom={13}
            maxzoom={20}
            paint={{
              "line-color": [
                "case",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotStroke,
                HABITAT_NEUTRAL.plotStroke,
              ],
              "line-width": [
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
          {selectedPlotId != null ? (
            <>
              <Layer
                id={PLOT_SELECTED_FILL}
                type="fill"
                source={PLOT_SOURCE_ID}
                source-layer="plots"
                filter={["==", ["get", "id"], selectedPlotId]}
                paint={{
                  "fill-color": "rgba(255, 45, 139, 0.38)",
                  "fill-opacity": 0.5,
                }}
              />
              <Layer
                id={PLOT_SELECTED_LINE}
                type="line"
                source={PLOT_SOURCE_ID}
                source-layer="plots"
                filter={["==", ["get", "id"], selectedPlotId]}
                paint={{
                  "line-color": "#FF2D8B",
                  "line-width": 2,
                }}
              />
            </>
          ) : null}
          {/*
            Plot number + area label — the legacy react-native-maps path shows
            this via a <PlotLabel> native Marker per plot, capped at a
            handful of plots (each Marker is a real native view). A MapLibre
            symbol layer draws thousands of these as GPU text with built-in
            collision/decluttering, so no such cap is needed here — this was
            missing entirely from the GPU path, leaving plots as bare color
            blocks with no identifying text once zoomed in.
          */}
          <Layer
            id={PLOT_LABEL_LAYER}
            type="symbol"
            source={PLOT_SOURCE_ID}
            source-layer="plots"
            minzoom={PLOT_LABEL_MIN_ZOOM}
            maxzoom={20}
            layout={{
              "text-field": [
                "case",
                [">", ["to-number", ["get", "area_rounded"]], 0],
                ["concat", ["get", "plot_number"], "\n", ["get", "area_rounded"]],
                ["get", "plot_number"],
              ],
              "text-size": [
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
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-line-height": 1.05,
              "text-allow-overlap": false,
              "text-ignore-placement": false,
            }}
            paint={{
              "text-color": [
                "case",
                ["==", ["get", "id"], selectedPlotId ?? -1],
                "#FFFFFF",
                ["boolean", ["get", "is_for_sale"], false],
                "#FFFFFF",
                "#374151",
              ],
              "text-halo-color": [
                "case",
                ["==", ["get", "id"], selectedPlotId ?? -1],
                "#FF2D8B",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotStroke,
                "rgba(255,255,255,0.92)",
              ],
              "text-halo-width": 1.6,
            }}
          />
        </VectorSource>
      ) : null}

      {onLandPress ? (
        <GeoJSONSource id="habitat-lands-polygons" data={landsPolygonGeo}>
          <Layer
            id="habitat-lands-fill"
            type="fill"
            paint={{
              "fill-color": LAND_THEME.pin,
              "fill-opacity": 0.24,
            }}
          />
          <Layer
            id="habitat-lands-line"
            type="line"
            paint={{
              "line-color": LAND_THEME.pin,
              "line-width": 2.5,
              "line-opacity": 1,
            }}
          />
        </GeoJSONSource>
      ) : null}

      {onLandPress ? (
        <GeoJSONSource
          id="habitat-lands-clusters"
          data={landsClustersGeo}
          onPress={handleLandLayerPress}
        >
          <Layer
            id="habitat-lands-cluster-dot"
            type="circle"
            filter={["==", ["get", "kind"], "cluster"]}
            paint={{
              "circle-radius": [
                "step",
                ["get", "count"],
                16,
                5,
                18,
                10,
                20,
                20,
                22,
              ],
              "circle-color": LAND_THEME.bubble,
              "circle-stroke-width": 2,
              "circle-stroke-color": LAND_THEME.bubbleBorder,
            }}
          />
          <Layer
            id="habitat-lands-cluster-count"
            type="symbol"
            filter={["==", ["get", "kind"], "cluster"]}
            layout={{
              "text-field": ["get", "label"],
              "text-size": 13,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": LAND_THEME.label,
            }}
          />
        </GeoJSONSource>
      ) : null}

      {onLandPress ? (
        <GeoJSONSource
          id="habitat-lands-pins"
          data={landsPinsGeo}
          onPress={handleLandLayerPress}
        >
          <Layer
            id="habitat-lands-pin-stem"
            type="circle"
            filter={["==", ["get", "pin_visible"], 1]}
            paint={{
              "circle-radius": [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                3,
                2.5,
              ],
              "circle-color": [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                LAND_THEME.pinSelected,
                LAND_THEME.pinStem,
              ],
              "circle-translate": [0, 6],
              "circle-opacity": 0.95,
            }}
          />
          <Layer
            id="habitat-lands-pin-dot"
            type="circle"
            filter={["==", ["get", "pin_visible"], 1]}
            paint={{
              "circle-radius": [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                8,
                7,
              ],
              "circle-color": [
                "case",
                ["==", ["get", "id"], selectedLandId ?? -1],
                LAND_THEME.pinSelected,
                LAND_THEME.pin,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": LAND_THEME.pinBorder,
            }}
          />
        </GeoJSONSource>
      ) : null}
    </MapLibreMap>
  );
}

export const HabitatMapLibreCadastre = memo(HabitatMapLibreCadastreInner);
