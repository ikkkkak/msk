/**
 * Platform map tile configuration.
 *
 * Android: MapTiler via UrlTile (mapType="none" — no Google/Apple base tiles).
 * iOS: Native Apple Maps (standard / hybrid) — no MapTiler overlay.
 */

import { Platform } from "react-native";
import { MAPTILER_API_KEY } from "../config/mapTiler";
import { resolveNativeMapType } from "./mapProvider";

export type PlatformMapStyle = "standard" | "satellite";

/**
 * Check if MapTiler API key is configured
 */
export const isMapTilerConfigured = (): boolean => {
  return (
    MAPTILER_API_KEY !== "5cYEBdqnvU5q8q6neMdP" && MAPTILER_API_KEY.length > 0
  );
};

/**
 * Get MapTiler tile URL template
 * @param style - MapTiler style (basic, streets, satellite, etc.)
 */
export const getMapTilerTileUrl = (style: string = "streets"): string => {
  if (!isMapTilerConfigured()) {
    console.warn("[MapTiler] API key not configured");
    return "";
  }
  return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
};

/** MapTiler style slug for standard vs satellite display. */
export const getMapTilerStyleForDisplay = (
  displayStyle: PlatformMapStyle,
): string => (displayStyle === "satellite" ? "satellite" : "streets");

export type PlatformMapViewConfig = {
  mapType: "none" | "standard" | "satellite" | "hybrid" | "terrain";
  mapTilerTileUrl: string | null;
  showMapTilerTiles: boolean;
};

/**
 * Android → MapTiler tiles; iOS → native Apple Maps types.
 */
export const getPlatformMapViewConfig = (
  displayStyle: PlatformMapStyle = "standard",
): PlatformMapViewConfig => {
  if (Platform.OS === "android" && isMapTilerConfigured()) {
    return {
      mapType: "none",
      mapTilerTileUrl: getMapTilerTileUrl(
        getMapTilerStyleForDisplay(displayStyle),
      ),
      showMapTilerTiles: true,
    };
  }

  return {
    mapType: resolveNativeMapType(displayStyle),
    mapTilerTileUrl: null,
    showMapTilerTiles: false,
  };
};

/**
 * Get mapType for Android (must be "none" to avoid Google Maps)
 * @param useMapTiler - Whether to use MapTiler tiles
 * @param fallbackMapType - Fallback map type if MapTiler not configured (iOS only)
 */
export const getMapTypeForPlatform = (
  useMapTiler: boolean = true,
  fallbackMapType: "standard" | "satellite" | "hybrid" | "terrain" = "standard",
): "none" | "standard" | "satellite" | "hybrid" | "terrain" => {
  // On Android, if using MapTiler, MUST use "none" to avoid Google Maps
  if (Platform.OS === "android" && useMapTiler && isMapTilerConfigured()) {
    return "none";
  }

  // iOS always uses native Apple Maps (never MapTiler overlay)
  if (Platform.OS === "ios") {
    return resolveNativeMapType(
      fallbackMapType === "hybrid" || fallbackMapType === "terrain"
        ? "satellite"
        : fallbackMapType === "satellite"
          ? "satellite"
          : "standard",
    );
  }

  // Android fallback (should not happen if MapTiler is configured)
  return fallbackMapType;
};

/**
 * Get MapTiler configuration for MapView
 * Returns props that ensure Android uses MapTiler exclusively
 */
export const getMapTilerProps = (
  options: {
    style?: string;
    forceMapTiler?: boolean; // Force MapTiler even if key not configured (for consistency)
  } = {},
) => {
  const { style = "basic", forceMapTiler = false } = options;
  const useMapTiler = isMapTilerConfigured() || forceMapTiler;

  // On Android, always require MapTiler to avoid Google Maps
  if (Platform.OS === "android") {
    if (!useMapTiler && !forceMapTiler) {
      console.warn(
        "[MapTiler] Android requires MapTiler to avoid Google Maps SDK. Configure MAPTILER_API_KEY.",
      );
    }
  }

  return {
    mapType: getMapTypeForPlatform(useMapTiler),
    useMapTiler,
    mapTilerTileUrl: useMapTiler ? getMapTilerTileUrl(style) : null,
    // Additional props to hide Google Maps features
    showsPointsOfInterest: false,
    showsBuildings: false,
    showsTraffic: false,
    showsIndoors: false,
    showsCompass: false,
    showsScale: false,
    toolbarEnabled: false,
  };
};
