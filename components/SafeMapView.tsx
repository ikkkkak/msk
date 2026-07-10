/**
 * SafeMapView Component
 * 
 * CRITICAL: This component ensures Android NEVER loads Google Maps SDK.
 * 
 * Android: Uses MapTiler via WebView (NO react-native-maps, NO Google Maps SDK)
 * iOS: Uses react-native-maps (can optionally use WebView too)
 * 
 * This is the ONLY safe solution for Android when avoiding Google Maps.
 */

import React from 'react';
import { Platform } from 'react-native';
import { MapTilerWebView, MapTilerWebViewProps } from './MapTilerWebView';
import MapView, { Marker, Polygon, Polyline, UrlTile, Region } from 'react-native-maps';
import { MAPTILER_API_KEY } from '../config/mapTiler';

export interface SafeMapViewProps {
  /**
   * Initial region (required)
   */
  initialRegion: Region;
  
  /**
   * Map container style
   */
  style?: any;
  
  /**
   * Map height (default: 250)
   */
  height?: number;
  
  /**
   * Map width (default: '100%')
   */
  width?: number | string;
  
  /**
   * Markers to display
   */
  markers?: Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title?: string;
    color?: string;
    icon?: React.ReactNode;
  }>;
  
  /**
   * Polygons to display
   */
  polygons?: Array<{
    id: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }>;
  
  /**
   * Polylines to display
   */
  polylines?: Array<{
    id: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
    color?: string;
    width?: number;
  }>;
  
  /**
   * Map interaction settings
   */
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  
  /**
   * Callbacks
   */
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onRegionChange?: (region: Region) => void;
  
  /**
   * Map ref (iOS only, for react-native-maps)
   */
  mapRef?: React.MutableRefObject<MapView | null>;
  
  /**
   * Force WebView on iOS too (default: false, uses react-native-maps on iOS)
   */
  forceWebView?: boolean;
}

/**
 * SafeMapView - Platform-aware map component
 * 
 * Android: ALWAYS uses WebView (MapTiler) - NO Google Maps SDK
 * iOS: Uses react-native-maps by default, or WebView if forceWebView=true
 */
export const SafeMapView: React.FC<SafeMapViewProps> = ({
  initialRegion,
  style,
  height = 250,
  width = '100%',
  markers = [],
  polygons = [],
  polylines = [],
  scrollEnabled = true,
  zoomEnabled = true,
  pitchEnabled = false,
  rotateEnabled = false,
  onMarkerPress,
  onMapPress,
  onRegionChange,
  mapRef,
  forceWebView = false,
}) => {
  // CRITICAL: Android ALWAYS uses WebView to avoid Google Maps SDK
  // iOS can use react-native-maps (default) or WebView (if forceWebView=true)
  const useWebView = Platform.OS === 'android' || forceWebView;

  if (useWebView) {
    // Use WebView-based MapTiler (NO Google Maps SDK)
    const webViewProps: MapTilerWebViewProps = {
      latitude: initialRegion.latitude,
      longitude: initialRegion.longitude,
      zoom: Math.round(Math.log2(360 / initialRegion.longitudeDelta)),
      style: 'basic',
      height,
      width,
      markers: markers.map(m => ({
        id: m.id,
        latitude: m.coordinate.latitude,
        longitude: m.coordinate.longitude,
        title: m.title,
        color: m.color || '#FF0000',
      })),
      polygons: polygons.map(p => ({
        id: p.id,
        coordinates: p.coordinates,
        fillColor: p.fillColor,
        strokeColor: p.strokeColor,
        strokeWidth: p.strokeWidth,
      })),
      polylines: polylines.map(p => ({
        id: p.id,
        coordinates: p.coordinates,
        color: p.color,
        width: p.width,
      })),
      scrollEnabled,
      zoomEnabled,
      pitchEnabled,
      rotateEnabled,
      onMarkerPress,
      onMapPress,
      showLoading: true,
    };

    return <MapTilerWebView {...webViewProps} />;
  }

  // iOS: Use react-native-maps (no Google Maps SDK on iOS)
  const isMapTilerConfigured = MAPTILER_API_KEY !== "YOUR_MAPTILER_API_KEY_HERE" && MAPTILER_API_KEY.length > 0;

  return (
    <MapView
      ref={mapRef}
      style={[{ height, width }, style]}
      initialRegion={initialRegion}
      mapType={isMapTilerConfigured ? "none" : "standard"}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      pitchEnabled={pitchEnabled}
      rotateEnabled={rotateEnabled}
      showsPointsOfInterest={false}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
      showsCompass={false}
      showsScale={false}
      toolbarEnabled={false}
      onPress={(e) => {
        onMapPress?.(e.nativeEvent.coordinate);
      }}
      onRegionChange={(region) => {
        onRegionChange?.(region);
      }}
    >
      {/* MapTiler tiles for iOS (optional) */}
      {isMapTilerConfigured && (
        <UrlTile
          urlTemplate={`https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`}
          maximumZ={19}
          flipY={false}
        />
      )}
      
      {/* Markers */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          onPress={() => onMarkerPress?.(marker.id)}
        >
          {marker.icon}
        </Marker>
      ))}
      
      {/* Polygons */}
      {polygons.map((polygon) => (
        <Polygon
          key={polygon.id}
          coordinates={polygon.coordinates}
          fillColor={polygon.fillColor || 'rgba(0, 166, 153, 0.3)'}
          strokeColor={polygon.strokeColor || '#00A699'}
          strokeWidth={polygon.strokeWidth || 2}
        />
      ))}
      
      {/* Polylines */}
      {polylines.map((polyline) => (
        <Polyline
          key={polyline.id}
          coordinates={polyline.coordinates}
          strokeColor={polyline.color || '#0078FF'}
          strokeWidth={polyline.width || 3}
        />
      ))}
    </MapView>
  );
};
