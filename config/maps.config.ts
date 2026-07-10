/**
 * Professional Maps Configuration
 * Production-ready settings for Google Maps
 * Airbnb/Realtor level implementation
 */

import { Platform } from 'react-native';
import { Region } from 'react-native-maps';

/**
 * Google Maps API Key
 * Configured for both iOS and Android
 */
export const GOOGLE_MAPS_API_KEY = "AIzaSyDMVJYe9H8uHWPQ7toM5WBCNEuqVmGzvgE";

/**
 * Default region - Nouakchott, Mauritania
 */
export const DEFAULT_REGION: Region = {
  latitude: 18.0735,
  longitude: -15.9582,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

/**
 * Map zoom levels for different use cases
 */
export const MAP_ZOOM_LEVELS = {
  // Street level - for property details
  STREET: {
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  },
  // Neighborhood level - for nearby properties
  NEIGHBORHOOD: {
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  // City level - for city overview
  CITY: {
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  // Region level - for large area view
  REGION: {
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  },
};

/**
 * Map configuration presets
 */
export const MAP_CONFIGS = {
  // Property details - static map
  PROPERTY_DETAILS: {
    scrollEnabled: false,
    zoomEnabled: false,
    pitchEnabled: false,
    rotateEnabled: false,
    mapType: 'standard' as const,
    maxZoomLevel: 18,
    minZoomLevel: 10,
  },
  // Property search - interactive map
  PROPERTY_SEARCH: {
    scrollEnabled: true,
    zoomEnabled: true,
    pitchEnabled: false,
    rotateEnabled: false,
    mapType: 'standard' as const,
    maxZoomLevel: 20,
    minZoomLevel: 8,
  },
  // Navigation/Guidance - full interactive
  NAVIGATION: {
    scrollEnabled: true,
    zoomEnabled: true,
    pitchEnabled: false,
    rotateEnabled: false,
    mapType: 'standard' as const,
    maxZoomLevel: 20,
    minZoomLevel: 3,
  },
  // Landmark view - satellite view
  LANDMARK: {
    scrollEnabled: true,
    zoomEnabled: true,
    pitchEnabled: false,
    rotateEnabled: false,
    mapType: 'satellite' as const,
    maxZoomLevel: 20,
    minZoomLevel: 10,
  },
};

/**
 * Performance settings
 */
export const MAP_PERFORMANCE = {
  // Cache maps for better performance
  cacheEnabled: true,
  // Show loading indicator
  loadingEnabled: true,
  // Disable lite mode for full functionality
  liteMode: false,
  // Enable marker clustering for large datasets
  clusteringEnabled: true,
  // Marker optimization
  tracksViewChanges: false,
};

/**
 * UI settings
 */
export const MAP_UI = {
  // Clean professional look
  showsCompass: false,
  showsScale: false,
  showsPointsOfInterest: false,
  showsBuildings: false,
  showsTraffic: false,
  showsIndoors: false,
  toolbarEnabled: false,
  // User experience
  moveOnMarkerPress: true,
};

/**
 * Platform-specific adjustments
 */
export const PLATFORM_SPECIFIC = {
  ios: {
    // iOS specific settings
    userInterfaceStyle: 'light' as const,
  },
  android: {
    // Android specific settings
    androidRenderMode: 'LEGACY' as const,
  },
};

/**
 * Error messages
 */
export const MAP_ERROR_MESSAGES = {
  LOAD_FAILED: 'Unable to load map. Please check your internet connection.',
  API_KEY_MISSING: 'Map configuration error. Please contact support.',
  LOCATION_UNAVAILABLE: 'Location information is not available for this property.',
  COORDINATES_INVALID: 'Invalid location coordinates.',
};

/**
 * Helper function to get region with zoom level
 */
export const getRegionWithZoom = (
  latitude: number,
  longitude: number,
  zoomLevel: keyof typeof MAP_ZOOM_LEVELS = 'STREET'
): Region => {
  const zoom = MAP_ZOOM_LEVELS[zoomLevel];
  return {
    latitude,
    longitude,
    ...zoom,
  };
};

/**
 * Helper function to check if coordinates are valid
 */
export const isValidCoordinate = (latitude?: number, longitude?: number): boolean => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

/**
 * Helper function to get safe coordinates with fallback
 */
export const getSafeCoordinates = (
  latitude?: number,
  longitude?: number
): { latitude: number; longitude: number } => {
  if (isValidCoordinate(latitude, longitude)) {
    return { latitude: latitude!, longitude: longitude! };
  }
  console.warn('Invalid coordinates, using default region:', { latitude, longitude });
  return {
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  };
};
