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
  Map,
  VectorSource,
  type CameraRef,
  type MapRef,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
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
} from "../../utils/habitatMapLibreGeo";
import { habitatSectorTileUrl } from "../../utils/habitatVectorTiles";
import { PLAN_LAYER_MAX_ZOOM } from "../../utils/habitatGeo";
import { HABITAT_FOR_SALE, HABITAT_NEUTRAL } from "../../utils/habitatMapTheme";

const PLOT_SOURCE_ID = "habitat-plots-mvt";
const PLOT_FILL_LAYER = "habitat-plots-fill";
const PLOT_LINE_LAYER = "habitat-plots-line";
const PLOT_SELECTED_FILL = "habitat-plots-selected-fill";
const PLOT_SELECTED_LINE = "habitat-plots-selected-line";

const MAPLIBRE_DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

type DistrictFallback = { name: string; coordinates: LatLng[] };
type MapType = "standard" | "satellite";

function resolveMapLibreStyle(mapType: MapType): string {
  const configured =
    MAPTILER_API_KEY !== "YOUR_MAPTILER_API_KEY_HERE" &&
    MAPTILER_API_KEY.length > 0;
  if (!configured) return MAPLIBRE_DEMO_STYLE;
  return getMapTilerStyleUrl(mapType === "satellite" ? "satellite" : "standard");
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
  districtFallback?: DistrictFallback[];
  mapZoom?: number;
  onRegionChange?: () => void;
  onRegionChangeComplete: (region: Region) => void;
  onPlotPress: (plot: HabitatPlot) => void;
  onMapBackgroundPress?: () => void;
};

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
  districtFallback = [],
  mapZoom = 10,
  onRegionChange,
  onRegionChangeComplete,
  onPlotPress,
  onMapBackgroundPress,
}: HabitatMapLibreCadastreProps) {
  const mlMapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const lastRegionKey = useRef("");

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

  const plotTileUrl = useMemo(
    () =>
      selectedSectorId != null
        ? habitatSectorTileUrl(selectedSectorId)
        : null,
    [selectedSectorId],
  );

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

  const handleRegionDidChange = useCallback(
    (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      onRegionChange?.();
      onRegionChangeComplete(viewStateToRegion(e.nativeEvent));
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

  const initialCenter = regionToMapLibreCenter(initialRegion);
  const initialZoom = regionToMapLibreZoom(initialRegion);

  return (
    <Map
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
      onRegionDidChange={handleRegionDidChange}
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

      {plotTileUrl ? (
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
            paint={{
              "fill-color": [
                "case",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotFill,
                HABITAT_NEUTRAL.plotFill,
              ],
              "fill-opacity": 0.35,
            }}
          />
          <Layer
            id={PLOT_LINE_LAYER}
            type="line"
            source={PLOT_SOURCE_ID}
            source-layer="plots"
            paint={{
              "line-color": [
                "case",
                ["boolean", ["get", "is_for_sale"], false],
                HABITAT_FOR_SALE.plotStroke,
                HABITAT_NEUTRAL.plotStroke,
              ],
              "line-width": 1.35,
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
        </VectorSource>
      ) : null}
    </Map>
  );
}

export const HabitatMapLibreCadastre = memo(HabitatMapLibreCadastreInner);
