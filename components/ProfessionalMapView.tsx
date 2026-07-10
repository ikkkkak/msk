/**
 * Professional MapView Wrapper
 * Production-ready Google Maps implementation with error handling
 * Airbnb/Realtor level quality and reliability
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, ViewStyle } from 'react-native';
import MapView, { Region, MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapErrorBoundary } from './MapErrorBoundary';
import { theme } from '../theme';

interface ProfessionalMapViewProps extends MapViewProps {
  onMapReady?: () => void;
  loadingColor?: string;
  containerStyle?: ViewStyle;
}

/**
 * Professional MapView with:
 * - Error boundary for graceful failures
 * - Loading state
 * - Production-ready Google Maps configuration
 * - Performance optimizations
 * - Consistent styling
 */
export const ProfessionalMapView = React.forwardRef<MapView, ProfessionalMapViewProps>(
  ({ 
    onMapReady, 
    loadingColor = theme['color-temporary-primary'],
    containerStyle,
    children,
    ...mapProps 
  }, ref) => {
    const [isMapReady, setIsMapReady] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleMapReady = () => {
      setIsMapReady(true);
      onMapReady?.();
    };

    const handleError = (error: any) => {
      console.error('Map error:', error);
      setHasError(true);
    };

    const handleRetry = () => {
      setHasError(false);
      setIsMapReady(false);
    };

    return (
      <MapErrorBoundary onRetry={handleRetry}>
        <View style={[styles.container, containerStyle]}>
          {!isMapReady && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={loadingColor} />
            </View>
          )}
          <MapView
            ref={ref}
            provider={PROVIDER_GOOGLE}
            onMapReady={handleMapReady}
            onError={handleError}
            // Production-ready defaults
            cacheEnabled={true}
            loadingEnabled={true}
            loadingIndicatorColor={loadingColor}
            loadingBackgroundColor="#FFFFFF"
            liteMode={false}
            // Performance optimizations
            moveOnMarkerPress={true}
            // Zoom limits
            maxZoomLevel={20}
            minZoomLevel={3}
            // Clean UI
            showsCompass={false}
            showsScale={false}
            showsPointsOfInterest={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            toolbarEnabled={false}
            // User experience
            pitchEnabled={false}
            rotateEnabled={false}
            // Override with user props
            {...mapProps}
            style={[styles.map, mapProps.style]}
          >
            {children}
          </MapView>
        </View>
      </MapErrorBoundary>
    );
  }
);

ProfessionalMapView.displayName = 'ProfessionalMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
