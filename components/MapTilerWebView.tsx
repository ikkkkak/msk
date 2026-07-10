/**
 * MapTiler WebView Component
 * 
 * CRITICAL: This component uses WebView to render MapTiler maps,
 * completely avoiding react-native-maps and Google Maps SDK on Android.
 * 
 * This is the ONLY safe way to use MapTiler without Google Maps SDK.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAPTILER_API_KEY } from '../config/mapTiler';

export interface MapTilerWebViewProps {
  /**
   * Initial center latitude
   */
  latitude: number;
  
  /**
   * Initial center longitude
   */
  longitude: number;
  
  /**
   * Initial zoom level (1-20)
   */
  zoom?: number;
  
  /**
   * Map style: 'basic', 'streets', 'satellite', 'hybrid', 'dark', 'bright'
   */
  style?: string;
  
  /**
   * Map container height
   */
  height?: number;
  
  /**
   * Map container width (default: '100%')
   */
  width?: number | string;
  
  /**
   * Show loading indicator
   */
  showLoading?: boolean;
  
  /**
   * Custom markers to display
   */
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    color?: string;
    icon?: string;
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
   * Callback when map is ready
   */
  onMapReady?: () => void;
  
  /**
   * Callback when marker is clicked
   */
  onMarkerPress?: (markerId: string) => void;
  
  /**
   * Callback when map is clicked
   */
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  
  /**
   * Disable map interaction
   */
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
}

/**
 * MapTiler WebView Component
 * 
 * Uses MapTiler JavaScript SDK via WebView to render maps without Google Maps SDK.
 * This is the ONLY safe solution for Android when avoiding Google Maps.
 */
export const MapTilerWebView: React.FC<MapTilerWebViewProps> = ({
  latitude,
  longitude,
  zoom = 13,
  style = 'basic',
  height = 250,
  width = '100%',
  showLoading = true,
  markers = [],
  polygons = [],
  polylines = [],
  onMapReady,
  onMarkerPress,
  onMapPress,
  scrollEnabled = true,
  zoomEnabled = true,
  pitchEnabled = false,
  rotateEnabled = false,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Check if MapTiler API key is configured
  const isMapTilerConfigured = MAPTILER_API_KEY !== "YOUR_MAPTILER_API_KEY_HERE" && MAPTILER_API_KEY.length > 0;

  if (!isMapTilerConfigured) {
    return (
      <View style={[styles.container, { height, width }]}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#666" />
        </View>
      </View>
    );
  }

  // Generate HTML with MapTiler JavaScript SDK
  const generateMapHTML = () => {
    const mapStyle = style === 'satellite' ? 'satellite' : 
                     style === 'hybrid' ? 'hybrid' :
                     style === 'dark' ? 'dark' :
                     style === 'bright' ? 'bright' :
                     style === 'streets' ? 'streets' : 'basic';

    const markersJSON = JSON.stringify(markers);
    const polygonsJSON = JSON.stringify(polygons);
    const polylinesJSON = JSON.stringify(polylines);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://unpkg.com/@maptiler/sdk@latest/dist/maptiler-sdk.umd.js"></script>
  <link href="https://unpkg.com/@maptiler/sdk@latest/dist/maptiler-sdk.css" rel="stylesheet" />
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #map {
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      try {
        // Initialize MapTiler
        maptilersdk.config.apiKey = '${MAPTILER_API_KEY}';
        
        const map = new maptilersdk.Map({
          container: 'map',
          style: maptilersdk.MapStyle.${mapStyle},
          center: [${longitude}, ${latitude}],
          zoom: ${zoom},
          interactive: ${scrollEnabled},
          scrollZoom: ${zoomEnabled},
          pitch: ${pitchEnabled ? 45 : 0},
          bearing: 0,
          dragRotate: ${rotateEnabled},
        });

        // Wait for map to load
        map.on('load', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
          }));
        });

        // Add markers
        const markers = ${markersJSON};
        markers.forEach(function(marker) {
          const el = document.createElement('div');
          el.className = 'marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = marker.color || '#FF0000';
          el.style.border = '2px solid white';
          el.style.cursor = 'pointer';
          
          if (marker.icon) {
            el.innerHTML = marker.icon;
          }

          el.addEventListener('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerPress',
              markerId: marker.id
            }));
          });

          new maptilersdk.Marker({ element: el })
            .setLngLat([marker.longitude, marker.latitude])
            .addTo(map);
        });

        // Add polygons
        const polygons = ${polygonsJSON};
        polygons.forEach(function(polygon) {
          const coordinates = polygon.coordinates.map(function(coord) {
            return [coord.longitude, coord.latitude];
          });
          
          map.addLayer({
            id: 'polygon-' + polygon.id,
            type: 'fill',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinates]
                }
              }
            },
            paint: {
              'fill-color': polygon.fillColor || 'rgba(0, 166, 153, 0.3)',
              'fill-opacity': 0.5
            }
          });

          map.addLayer({
            id: 'polygon-outline-' + polygon.id,
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinates]
                }
              }
            },
            paint: {
              'line-color': polygon.strokeColor || '#00A699',
              'line-width': polygon.strokeWidth || 2
            }
          });
        });

        // Add polylines
        const polylines = ${polylinesJSON};
        polylines.forEach(function(polyline) {
          const coordinates = polyline.coordinates.map(function(coord) {
            return [coord.longitude, coord.latitude];
          });
          
          map.addLayer({
            id: 'polyline-' + polyline.id,
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: coordinates
                }
              }
            },
            paint: {
              'line-color': polyline.color || '#0078FF',
              'line-width': polyline.width || 3
            }
          });
        });

        // Handle map clicks
        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress',
            coordinate: {
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng
            }
          }));
        });

      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
    })();
  </script>
</body>
</html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapReady':
          setIsLoading(false);
          setMapReady(true);
          onMapReady?.();
          break;
        case 'markerPress':
          onMarkerPress?.(data.markerId);
          break;
        case 'mapPress':
          onMapPress?.(data.coordinate);
          break;
        case 'error':
          console.error('[MapTilerWebView] Error:', data.error);
          setIsLoading(false);
          break;
      }
    } catch (error) {
      console.error('[MapTilerWebView] Failed to parse message:', error);
    }
  };

  return (
    <View style={[styles.container, { height, width }]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          showLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00A699" />
            </View>
          ) : null
        )}
      />
      {isLoading && showLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#00A699" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});
