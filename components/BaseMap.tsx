/**
 * BaseMap – Static Card-Only Markers (No Morph), Always Card, Price in MRU
 *
 * All map markers are always a card – no dot state, no morphing, always same card UI.
 * The price (if present) is shown in full with "MRU", not K/M abbreviation.
 * No marker UI state changes based on zoom or selection.
 *
 * @requires react-native-reanimated
 * @requires react-native-maps
 * @requires expo-haptics
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import MapView, { Region, Polygon, Polyline, Marker } from "react-native-maps";
import { getMapProvider } from "../utils/mapProvider";
import { getPlatformMapViewConfig } from "../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "./map/PlatformMapTileLayer";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { theme } from "../theme";
import { useTranslation } from "react-i18next";
import { recordMarkerTap } from "../utils/debugMarkerTap";
import { MapToolbar } from "./map/MapToolbar";
import {
  HabitatMapLayers,
  type HabitatMapLayersProps,
} from "./habitat/HabitatMapLayers";

/** Temporary: listing price/image marker cards on the map (re-enable when ready). */
const SHOW_LISTING_MARKER_CARDS = false;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BaseMapMarker {
  id: number | string;
  latitude: number;
  longitude: number;
  title?: string;
  image?: string;
  price?: number;
  polygonCoordinates?: Array<{ latitude: number; longitude: number }>;
  data?: any;
}

export interface DistrictBoundary {
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
}

export type MapDataType = "properties" | "propertySales" | "landmarks";

export interface BaseMapProps {
  mapRef: React.MutableRefObject<MapView | null>;
  initialRegion?: Region;
  mapType?: "standard" | "satellite" | "hybrid" | "terrain";
  markers?: BaseMapMarker[];
  dataType?: MapDataType;
  selectedMarkerId?: number | string | null;
  onMarkerSelect?: (
    markerId: number | string,
    index: number,
    data?: any,
  ) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  drawingEnabled?: boolean;
  polygonPoints?: { latitude: number; longitude: number }[];
  setPolygonPoints?: (
    points: { latitude: number; longitude: number }[],
  ) => void;
  onApplyPolygon?: (polygon: { latitude: number; longitude: number }[]) => void;
  districtBoundaries?: DistrictBoundary[];
  showZones?: boolean;
  markerComponent?: (
    marker: BaseMapMarker,
    isSelected: boolean,
  ) => React.ReactNode;
  cardComponent?: (
    marker: BaseMapMarker,
    onClose: () => void,
  ) => React.ReactNode;
  /** When true, overlay card is not rendered (external card used, e.g. PropertyDetailCard). Selection styling still applied. */
  useExternalCard?: boolean;
  showZoomNotice?: boolean;
  zoomNoticeText?: string;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  style?: any;
  containerStyle?: any;
  /** When true and no markers, show a loading overlay (optimized loading UX). */
  isLoadingMarkers?: boolean;
  /** Nouakchott cadastre: plans / sectors / plots from /api/habitat */
  habitatCadastre?: HabitatMapLayersProps & {
    enabled?: boolean;
    plotShapesToRender?: HabitatMapLayersProps["plotShapes"];
    onMapBackgroundPress?: () => void;
    /** Live map region from cadastre hook (alias for mapRegion). */
    region?: Region;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_REGION: Region = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const CARD_MARKER = {
  WIDTH: 99,
  HEIGHT: 60,
  IMAGE_HEIGHT: 36,
  BORDER_RADIUS: 13,
  PRICE_HEIGHT: 20,
};

const COLORS = {
  primary: "#AB0003",
  selected: "#00A699",
  white: "#FFFFFF",
  shadow: "rgba(0,0,0,0.15)",
};

const PERF = {
  DEBOUNCE_REGION: 120,
  MAX_VISIBLE_MARKERS: 500,
};

const CARD_ANIM = {
  ENTER_MS: 220,
  EXIT_MS: 140,
  EXIT_DELAY_MS: 150,
};

// ============================================================================
// UTILS
// ============================================================================

const getVisibleMarkers = (
  markers: BaseMapMarker[],
  region: Region,
  padding: number = 0.25,
) => {
  const minLat = region.latitude - region.latitudeDelta * (1 + padding);
  const maxLat = region.latitude + region.latitudeDelta * (1 + padding);
  const minLng = region.longitude - region.longitudeDelta * (1 + padding);
  const maxLng = region.longitude + region.longitudeDelta * (1 + padding);

  const visible = markers.filter(
    (m) =>
      m.latitude >= minLat &&
      m.latitude <= maxLat &&
      m.longitude >= minLng &&
      m.longitude <= maxLng,
  );

  return visible.length > PERF.MAX_VISIBLE_MARKERS
    ? visible.slice(0, PERF.MAX_VISIBLE_MARKERS)
    : visible;
};

const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ============================================================================
// CARD MARKER - Static Card Always, MRU price, No state
// ============================================================================

const StaticCardMarker = memo<{ marker: BaseMapMarker; isSelected: boolean }>(
  ({ marker, isSelected }) => {
    const priceText =
      marker.price !== undefined && marker.price !== null
        ? `${marker.price} MRU`
        : "";

    return (
      <View
        style={[
          styles.markerCardWrapper,
          isSelected && styles.markerCardSelected,
        ]}
      >
        <View
          style={[
            styles.markerCardContainer,
            isSelected && styles.markerCardContainerSelected,
          ]}
        >
          <View style={styles.markerCardImage}>
            {marker.image ? (
              <Image
                source={{ uri: marker.image }}
                style={styles.markerCardImageImg}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.markerCardImagePlaceholder,
                  isSelected && styles.markerCardImagePlaceholderSelected,
                ]}
              >
                <MaterialIcons name="home" size={20} color={COLORS.white} />
              </View>
            )}
          </View>
          <View style={styles.markerCardPriceWrap}>
            {priceText.length > 0 ? (
              <Text
                style={[
                  styles.markerCardPrice,
                  isSelected && styles.markerCardPriceSelected,
                ]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {priceText}
              </Text>
            ) : null}
          </View>
        </View>
        <View
          style={[
            styles.markerCardArrow,
            isSelected && styles.markerCardArrowSelected,
          ]}
        />
      </View>
    );
  },
);
StaticCardMarker.displayName = "StaticCardMarker";

// ============================================================================
// ZOOM NOTICE - as original
// ============================================================================

const ZoomNotice = memo<{ visible: boolean; text: string }>(
  ({ visible, text }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-10);

    useEffect(() => {
      if (visible) {
        opacity.value = withTiming(1, {
          duration: 240,
          easing: Easing.out(Easing.ease),
        });
        translateY.value = withTiming(0, { duration: 300 });
      } else {
        opacity.value = withTiming(0, {
          duration: 180,
          easing: Easing.in(Easing.ease),
        });
        translateY.value = withTiming(-10, { duration: 180 });
      }
    }, [visible]);

    useEffect(
      () => () => {
        cancelAnimation(opacity);
        cancelAnimation(translateY);
      },
      [],
    );

    const animStyle = useAnimatedStyle(() => {
      "worklet";
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    });

    if (!visible) return null;

    return (
      <Animated.View style={[styles.notice, animStyle]} pointerEvents="none">
        <MaterialIcons name="zoom-in" size={18} color="#666" />
        <Text style={styles.noticeText}>{text}</Text>
      </Animated.View>
    );
  },
);
ZoomNotice.displayName = "ZoomNotice";

// ============================================================================
// CONTROL BUTTON - as before
// ============================================================================

const ControlButton = memo<{
  icon: string;
  onPress: () => void;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
}>(({ icon, onPress, active = false, primary = false, disabled = false }) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      scale.value = withTiming(0.88, { duration: 80 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, []);

  useEffect(
    () => () => {
      cancelAnimation(scale);
    },
    [],
  );

  const animStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.button,
          animStyle,
          primary && { backgroundColor: theme["color-temporary-primary"] },
          active && { backgroundColor: COLORS.primary },
          disabled && styles.buttonDisabled,
        ]}
      >
        <MaterialIcons
          name={icon as any}
          size={18}
          color={primary || active ? COLORS.white : "#222"}
        />
      </Animated.View>
    </Pressable>
  );
});
ControlButton.displayName = "ControlButton";

// ============================================================================
// MAIN MAP COMPONENT
// ============================================================================

export const BaseMap = memo<BaseMapProps>(
  ({
    mapRef,
    initialRegion,
    mapType: mapTypeProp = "standard",
    markers = [],
    dataType = "properties",
    selectedMarkerId,
    onMarkerSelect,
    onMapPress,
    drawingEnabled = false,
    polygonPoints = [],
    setPolygonPoints,
    onApplyPolygon,
    districtBoundaries = [],
    showZones: showZonesProp = true,
    markerComponent,
    cardComponent,
    useExternalCard = false,
    showZoomNotice = true,
    zoomNoticeText,
    onRegionChange,
    onRegionChangeComplete,
    style,
    containerStyle,
    isLoadingMarkers = false,
    habitatCadastre,
  }) => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    // Refs for performance
    const regionRef = useRef<Region>(initialRegion || INITIAL_REGION);
    const initialRegionRef = useRef<Region>(regionRef.current);
    const isAnimatingRef = useRef(false);
    const lastRegionUpdateRef = useRef(0);

    // State
    const [currentRegion, setCurrentRegion] = useState<Region>(
      regionRef.current,
    );
    const [regionKey, setRegionKey] = useState(0);
    const [zonesVisible, setZonesVisible] = useState(showZonesProp);
    const [isDrawing, setIsDrawing] = useState(drawingEnabled);
    const [mapType, setMapType] = useState<"standard" | "satellite">(
      mapTypeProp === "standard" || mapTypeProp === "satellite"
        ? mapTypeProp
        : "standard",
    );
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isExiting, setIsExiting] = useState(false);
    const [drawingPath, setDrawingPath] = useState<
      { latitude: number; longitude: number }[]
    >([]);
    const animatingToIndexRef = useRef<number>(-1);

    // Computed values
    const visibleMarkers = useMemo(
      () => getVisibleMarkers(markers, regionRef.current, 0.25),
      [markers, regionKey],
    );

    const selectedIndex = useMemo(() => {
      if (selectedMarkerId != null) {
        const idx = markers.findIndex((m) => m.id === selectedMarkerId);
        return idx >= 0 ? idx : -1;
      }
      return activeIndex >= 0 && activeIndex < markers.length
        ? activeIndex
        : -1;
    }, [selectedMarkerId, activeIndex, markers]);

    // Card show animation for cardComponent (skip when useExternalCard)
    const cardProgress = useSharedValue(0);
    const prevShowRef = useRef<boolean>(false);

    useEffect(() => {
      if (useExternalCard) return;
      const show = selectedIndex >= 0 && !!cardComponent;
      if (show === prevShowRef.current) return;
      prevShowRef.current = show;
      cancelAnimation(cardProgress);
      if (show) {
        cardProgress.value = withTiming(1, {
          duration: CARD_ANIM.ENTER_MS,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        cardProgress.value = withTiming(0, {
          duration: CARD_ANIM.EXIT_MS,
          easing: Easing.in(Easing.cubic),
        });
      }
    }, [selectedIndex, cardComponent, useExternalCard]);
    useEffect(() => () => cancelAnimation(cardProgress), []);
    const cardAnimStyle = useAnimatedStyle(() => {
      "worklet";
      const p = cardProgress.value;
      return {
        opacity: p,
        transform: [
          { translateY: interpolate(p, [0, 1], [20, 0]) },
          { scale: interpolate(p, [0, 1], [0.97, 1]) },
        ],
      };
    });

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const dismissCard = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      prevShowRef.current = false;
      setIsExiting(true);
      cancelAnimation(cardProgress);
      cardProgress.value = withTiming(0, {
        duration: CARD_ANIM.EXIT_MS,
        easing: Easing.in(Easing.cubic),
      });
      setTimeout(() => {
        setIsExiting(false);
        setActiveIndex(-1);
        animatingToIndexRef.current = -1;
        onMapPress?.({ latitude: 0, longitude: 0 });
        navigation?.setOptions({ tabBarStyle: { display: "flex" } });
      }, CARD_ANIM.EXIT_DELAY_MS);
    }, [onMapPress, navigation, cardProgress]);

    const handleMarkerPress = useCallback(
      (idx: number) => {
        recordMarkerTap();
        const marker = markers[idx];
        if (!marker) return;
        const sameTarget =
          isAnimatingRef.current && animatingToIndexRef.current === idx;
        if (sameTarget) return;

        animatingToIndexRef.current = idx;
        isAnimatingRef.current = true;

        if (onMarkerSelect) {
          onMarkerSelect(marker.id, idx, marker.data);
        } else {
          setActiveIndex(idx);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        navigation?.setOptions({ tabBarStyle: { display: "none" } });

        requestAnimationFrame(() => {
          const offset = currentRegion.latitudeDelta * 0.12;
          mapRef.current?.animateToRegion(
            {
              latitude: marker.latitude - offset,
              longitude: marker.longitude,
              latitudeDelta: currentRegion.latitudeDelta,
              longitudeDelta: currentRegion.longitudeDelta,
            },
            180,
          );
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 220);
        });
      },
      [markers, onMarkerSelect, navigation, mapRef, currentRegion],
    );

    const handleMapPress = useCallback(() => {
      if (isDrawing) return;
      if (habitatCadastre?.enabled !== false) {
        habitatCadastre?.onMapBackgroundPress?.();
      }
      if (useExternalCard) {
        onMapPress?.({ latitude: 0, longitude: 0 });
      } else {
        dismissCard();
      }
    }, [
      isDrawing,
      dismissCard,
      useExternalCard,
      onMapPress,
      habitatCadastre?.enabled,
      habitatCadastre?.onMapBackgroundPress,
    ]);

    const handleRegionChange = useCallback(
      (newRegion: Region) => {
        regionRef.current = newRegion;
        setCurrentRegion(newRegion);
        onRegionChange?.(newRegion);
      },
      [onRegionChange],
    );

    const debouncedRegionUpdate = useCallback(
      debounce((newRegion: Region) => {
        const now = Date.now();
        if (now - lastRegionUpdateRef.current < PERF.DEBOUNCE_REGION) return;

        lastRegionUpdateRef.current = now;
        regionRef.current = newRegion;
        setRegionKey((prev) => prev + 1);
        onRegionChangeComplete?.(newRegion);
      }, PERF.DEBOUNCE_REGION),
      [onRegionChangeComplete],
    );

    const handleRegionChangeComplete = useCallback(
      (newRegion: Region) => {
        debouncedRegionUpdate(newRegion);
      },
      [debouncedRegionUpdate],
    );

    const toggleZones = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setZonesVisible((prev) => !prev);
    }, []);

    const toggleMapType = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setMapType((prev) => (prev === "standard" ? "satellite" : "standard"));
    }, []);

    const handleClearDrawing = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setDrawingPath([]);
      setPolygonPoints?.([]);
    }, [setPolygonPoints]);

    const handleApplyDrawing = useCallback(() => {
      const path = drawingPath.length >= 3 ? drawingPath : polygonPoints;
      if (path.length >= 3) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        const closedPath = [...path, path[0]];
        setPolygonPoints?.(closedPath);
        onApplyPolygon?.(closedPath);
        setIsDrawing(false);
        setDrawingPath([]);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {},
        );
      }
    }, [drawingPath, polygonPoints, onApplyPolygon, setPolygonPoints]);

    useEffect(() => {
      if (showZonesProp !== undefined) setZonesVisible(showZonesProp);
    }, [showZonesProp]);
    useEffect(() => {
      if (typeof drawingEnabled === "boolean") setIsDrawing(drawingEnabled);
    }, [drawingEnabled]);
    useEffect(() => {
      if (mapTypeProp === "standard" || mapTypeProp === "satellite")
        setMapType(mapTypeProp);
    }, [mapTypeProp]);

    const noticeText = useMemo(() => {
      if (zoomNoticeText) return zoomNoticeText;
      switch (dataType) {
        case "properties":
          return t("map.zoomNotice", "Zoom in to see property details");
        case "propertySales":
          return t(
            "map.zoomNoticeSales",
            "Zoom in to see property sale details",
          );
        case "landmarks":
          return t(
            "map.zoomNoticeLandmarks",
            "Zoom in to see landmark details",
          );
        default:
          return t("map.zoomNotice", "Zoom in to see details");
      }
    }, [dataType, zoomNoticeText, t]);

    const platformMapConfig = useMemo(
      () => getPlatformMapViewConfig(mapType),
      [mapType],
    );

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
      <View style={[styles.container, containerStyle]}>
        <MapView
          ref={mapRef}
          style={[styles.map, style]}
          provider={getMapProvider()}
          mapType={platformMapConfig.mapType}
          initialRegion={initialRegionRef.current}
          onPress={handleMapPress}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          scrollEnabled={!isDrawing}
          zoomEnabled={!isDrawing}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          toolbarEnabled={false}
          loadingEnabled
          loadingIndicatorColor={theme["color-temporary-primary"]}
          loadingBackgroundColor={COLORS.white}
          cacheEnabled
          moveOnMarkerPress={false}
          maxZoomLevel={20}
          minZoomLevel={3}
          compassOffset={{ x: -10, y: 60 }}
          zoomTapEnabled
          zoomControlEnabled={false}
        >
          <PlatformMapTileLayer mapStyle={mapType} />
          {/* Habitat cadastre (plans / sectors) — below listing markers */}
          {habitatCadastre != null &&
            habitatCadastre.enabled !== false &&
            (habitatCadastre.plans?.length ?? 0) > 0 && (
              <HabitatMapLayers
                key="habitat-cadastre-layers"
                plans={habitatCadastre.plans}
                sectors={habitatCadastre.sectors ?? []}
                plots={habitatCadastre.plots}
                plotShapes={habitatCadastre.plotShapesToRender}
                viewLevel={habitatCadastre.viewLevel ?? "plans"}
                selectedPlanId={habitatCadastre.selectedPlanId}
                selectedSectorId={habitatCadastre.selectedSectorId}
                selectedPlotId={habitatCadastre.selectedPlotId}
                districtFallback={habitatCadastre.districtFallback}
                onPlanPress={habitatCadastre.onPlanPress}
                onSectorPress={habitatCadastre.onSectorPress}
                onPlotPress={habitatCadastre.onPlotPress}
                mapZoom={habitatCadastre.mapZoom}
                mapLongitudeDelta={habitatCadastre.mapLongitudeDelta}
              />
            )}

          {/* Legacy district outlines — hidden when habitat plans are shown */}
          {!(
            habitatCadastre?.enabled !== false &&
            (habitatCadastre?.plans?.length ?? 0) > 0
          ) &&
            districtBoundaries?.map((district, idx) => (
              <Polygon
                key={`zone-${district.name}-${idx}`}
                coordinates={district.coordinates}
                strokeColor={
                  zonesVisible ? "rgba(209, 96, 36, 0.8)" : "transparent"
                }
                fillColor={
                  zonesVisible ? "rgba(209, 96, 36, 0.2)" : "transparent"
                }
                strokeWidth={zonesVisible ? 1.5 : 0}
                lineCap="round"
                lineJoin="round"
                tappable={false}
              />
            ))}

          {/* Drawing Polygon */}
          {isDrawing && drawingPath.length >= 2 && (
            <Polyline
              coordinates={drawingPath}
              strokeColor={COLORS.selected}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Applied Polygon */}
          {!isDrawing && polygonPoints.length >= 3 && (
            <>
              <Polygon
                coordinates={polygonPoints}
                strokeWidth={0}
                fillColor="rgba(0, 166, 153, 0.18)"
              />
              <Polyline
                coordinates={polygonPoints}
                strokeColor={COLORS.selected}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}

          {/* Landmark Polygons */}
          {dataType === "landmarks" &&
            !isDrawing &&
            visibleMarkers.map((marker) => {
              if (
                !marker.polygonCoordinates ||
                marker.polygonCoordinates.length < 3
              )
                return null;
              const idx = markers.findIndex((m) => m.id === marker.id);
              const selected = selectedIndex === idx;
              return (
                <Polygon
                  key={`landmark-${marker.id}`}
                  coordinates={marker.polygonCoordinates}
                  fillColor={
                    selected
                      ? "rgba(0, 166, 153, 0.35)"
                      : "rgba(0, 166, 153, 0.22)"
                  }
                  strokeColor={
                    selected ? COLORS.selected : "rgba(0, 166, 153, 0.95)"
                  }
                  strokeWidth={selected ? 4 : 3}
                  lineCap="round"
                  lineJoin="round"
                  tappable
                  onPress={() => handleMarkerPress(idx)}
                />
              );
            })}

          {/* Property Markers — hidden during cadastre parcel view (keeps map clean) */}
          {SHOW_LISTING_MARKER_CARDS &&
            dataType !== "landmarks" &&
            !isDrawing &&
            !(
              habitatCadastre?.viewLevel === "plots" &&
              habitatCadastre?.selectedSectorId != null
            ) &&
            visibleMarkers.map((marker) => {
              if (!marker.latitude || !marker.longitude) return null;
              const idx = markers.findIndex((m) => m.id === marker.id);
              const selected = selectedIndex === idx;
              return (
                <Marker
                  key={`marker-${marker.id}`}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 1 }}
                  zIndex={selected ? 1000 : 100}
                  onPress={() => handleMarkerPress(idx)}
                  stopPropagation
                >
                  <StaticCardMarker marker={marker} isSelected={selected} />
                </Marker>
              );
            })}
        </MapView>

        {/* Zoom Notice */}
        {/* {showZoomNotice && (
        <ZoomNotice
          visible={!isDrawing && selectedIndex < 0}
          text={noticeText}
        />
      )} */}

        {!isDrawing ? (
          <MapToolbar
            mapRef={mapRef}
            region={currentRegion}
            mapType={mapType}
            onMapTypeChange={(type) =>
              setMapType(type === "standard" ? "standard" : "satellite")
            }
            mapTypeCycle={["standard", "satellite"]}
            topOffset={52}
            showLayers={(districtBoundaries?.length ?? 0) > 0}
            layersActive={zonesVisible}
            onLayersPress={toggleZones}
          />
        ) : (
          <View style={styles.drawControls}>
            <ControlButton icon="delete-outline" onPress={handleClearDrawing} />
            <ControlButton
              icon="check"
              onPress={handleApplyDrawing}
              primary
              disabled={drawingPath.length < 3 && polygonPoints.length < 3}
            />
            <ControlButton
              icon="close"
              onPress={() => {
                setIsDrawing(false);
                setDrawingPath([]);
              }}
            />
          </View>
        )}

        {/* Custom Card – shown instantly on marker tap (skip when useExternalCard) */}
        {!useExternalCard &&
          selectedIndex >= 0 &&
          selectedIndex < markers.length &&
          cardComponent && (
            <Animated.View
              key={`card-${markers[selectedIndex].id}`}
              style={[styles.cardContainer, cardAnimStyle]}
              pointerEvents={isExiting ? "none" : "box-none"}
            >
              {cardComponent(markers[selectedIndex], dismissCard)}
            </Animated.View>
          )}

        {/* Loading overlay – optimized UX when markers are being fetched */}
        {isLoadingMarkers && markers.length === 0 && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator
              size="small"
              color={theme["color-temporary-primary"] ?? COLORS.primary}
            />
            <Text style={styles.loadingOverlayText}>
              {t("propertySaleList.loading", "Loading…")}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

BaseMap.displayName = "BaseMap";

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 84,
    gap: 8,
  },
  loadingOverlayText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Marker Card
  markerCardWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  markerCardContainer: {
    width: CARD_MARKER.WIDTH,
    height: CARD_MARKER.HEIGHT,
    borderRadius: CARD_MARKER.BORDER_RADIUS,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderColor: COLORS.white,
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  markerCardSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  markerCardContainerSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  markerCardImagePlaceholderSelected: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  markerCardPriceSelected: {
    color: "#FFFFFF",
  },
  markerCardArrowSelected: {
    borderTopColor: "#000000",
  },
  markerCardImage: {
    width: "100%",
    height: CARD_MARKER.IMAGE_HEIGHT,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.13)",
    borderTopLeftRadius: CARD_MARKER.BORDER_RADIUS,
    borderTopRightRadius: CARD_MARKER.BORDER_RADIUS,
  },
  markerCardImageImg: {
    width: "100%",
    height: "100%",
  },
  markerCardImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  markerCardPriceWrap: {
    width: "100%",
    height: CARD_MARKER.PRICE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0)",
  },
  markerCardPrice: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  markerCardArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.primary,
    marginTop: -1,
  },
  // UI Elements
  notice: {
    position: "absolute",
    top: Platform.OS === "ios" ? 16 : 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  noticeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    letterSpacing: -0.2,
  },
  drawControls: {
    position: "absolute",
    right: 14,
    top: Platform.OS === "ios" ? 108 : 96,
    gap: 10,
    zIndex: 200,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  cardContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
});
