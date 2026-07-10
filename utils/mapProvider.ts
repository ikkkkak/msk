/**
 * Map Provider Utility
 * Platform-specific map provider selection
 * 
 * iOS: Uses PROVIDER_DEFAULT (Apple Maps) - no API key needed
 * Android: Uses PROVIDER_GOOGLE - requires API key in app.json
 */

import { Platform } from 'react-native';
import { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

/**
 * Get the appropriate map provider based on platform
 * 
 * @returns PROVIDER_DEFAULT for iOS (Apple Maps), PROVIDER_GOOGLE for Android
 */
export const getMapProvider = () => {
  if (Platform.OS === 'ios') {
    // iOS uses Apple Maps (PROVIDER_DEFAULT) - no API key needed
    return PROVIDER_DEFAULT; // undefined = PROVIDER_DEFAULT in react-native-maps
  } else {
    // Android uses Google Maps - requires API key in app.json
    return PROVIDER_GOOGLE;
  }
};

/**
 * Check if the current platform is using Google Maps
 * @returns true if Android, false if iOS
 */
export const isGoogleMapsProvider = () => {
  return Platform.OS === 'android';
};

/**
 * Check if the current platform is using Apple Maps (default)
 * @returns true if iOS, false if Android
 */
export const isAppleMapsProvider = () => {
  return Platform.OS === 'ios';
};

export type NativeMapDisplayType = 'standard' | 'satellite' | 'hybrid';

/** MapView mapType: on iOS (Apple Maps), satellite → hybrid for aerial imagery. */
export function resolveNativeMapType(
  type: 'standard' | 'satellite',
): NativeMapDisplayType {
  if (isAppleMapsProvider() && type === 'satellite') {
    return 'hybrid';
  }
  return type;
}
