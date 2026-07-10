/**
 * MapTiler Android Configuration Utilities
 * 
 * CRITICAL: On Android, react-native-maps defaults to Google Maps SDK.
 * To avoid requiring Google Maps API key, we MUST use:
 * - mapType="none" (disables native map tiles)
 * - UrlTile with MapTiler tiles (provides custom tiles)
 * 
 * This ensures Android never loads Google Maps SDK.
 */

import { Platform } from 'react-native';
import { MAPTILER_API_KEY } from '../config/mapTiler';

/**
 * Check if MapTiler API key is configured
 */
export const isMapTilerConfigured = (): boolean => {
  return MAPTILER_API_KEY !== "YOUR_MAPTILER_API_KEY_HERE" && MAPTILER_API_KEY.length > 0;
};

/**
 * Get MapTiler tile URL template
 * @param style - MapTiler style (basic, streets, satellite, etc.)
 */
export const getMapTilerTileUrl = (style: string = "basic"): string => {
  if (!isMapTilerConfigured()) {
    console.warn('[MapTiler] API key not configured');
    return '';
  }
  return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
};

/**
 * Get mapType for Android (must be "none" to avoid Google Maps)
 * @param useMapTiler - Whether to use MapTiler tiles
 * @param fallbackMapType - Fallback map type if MapTiler not configured (iOS only)
 */
export const getMapTypeForPlatform = (
  useMapTiler: boolean = true,
  fallbackMapType: "standard" | "satellite" | "hybrid" | "terrain" = "standard"
): "none" | "standard" | "satellite" | "hybrid" | "terrain" => {
  // On Android, if using MapTiler, MUST use "none" to avoid Google Maps
  if (Platform.OS === 'android' && useMapTiler && isMapTilerConfigured()) {
    return "none";
  }
  
  // On iOS, can use default map types
  if (Platform.OS === 'ios') {
    return useMapTiler && isMapTilerConfigured() ? "none" : fallbackMapType;
  }
  
  // Android fallback (should not happen if MapTiler is configured)
  return fallbackMapType;
};

/**
 * Get MapTiler configuration for MapView
 * Returns props that ensure Android uses MapTiler exclusively
 */
export const getMapTilerProps = (options: {
  style?: string;
  forceMapTiler?: boolean; // Force MapTiler even if key not configured (for consistency)
} = {}) => {
  const { style = "basic", forceMapTiler = false } = options;
  const useMapTiler = isMapTilerConfigured() || forceMapTiler;
  
  // On Android, always require MapTiler to avoid Google Maps
  if (Platform.OS === 'android') {
    if (!useMapTiler && !forceMapTiler) {
      console.warn('[MapTiler] Android requires MapTiler to avoid Google Maps SDK. Configure MAPTILER_API_KEY.');
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
