/**
 * Freehand Drawing Map Component
 * Airbnb-style paint/drawing mechanism for area selection
 * Features:
 * - Freehand drawing (drag to draw)
 * - Small top controls
 * - Clean, professional UI
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Region, Polygon, Polyline, Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FreehandDrawingMapProps {
  mapRef: React.MutableRefObject<MapView | null>;
  initialRegion?: Region;
  isDrawing: boolean;
  onDrawingChange: (isDrawing: boolean) => void;
  onApplyPolygon: (polygon: { latitude: number; longitude: number }[]) => void;
  mapType?: 'standard' | 'satellite';
  onMapTypeChange?: (type: 'standard' | 'satellite') => void;
}

export const FreehandDrawingMap: React.FC<FreehandDrawingMapProps> = ({
  mapRef,
  initialRegion,
  isDrawing,
  onDrawingChange,
  onApplyPolygon,
  mapType = 'standard',
  onMapTypeChange,
}) => {
  const [drawingPath, setDrawingPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const panResponderRef = useRef<PanResponder | null>(null);

  // Convert screen coordinates to map coordinates
  const screenToMapCoordinates = useCallback(
    async (screenX: number, screenY: number) => {
      if (!mapRef.current) return null;
      try {
        const coordinate = await mapRef.current.coordinateForPoint({
          x: screenX,
          y: screenY,
        });
        return coordinate;
      } catch (error) {
        return null;
      }
    },
    [mapRef]
  );

  // Create PanResponder for freehand drawing
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => isDrawing && isDrawingActive,
      onMoveShouldSetPanResponder: () => isDrawing && isDrawingActive,
      onPanResponderGrant: async (evt) => {
        if (!isDrawing) return;
        setIsDrawingActive(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const coordinate = await screenToMapCoordinates(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        if (coordinate) {
          setDrawingPath([coordinate]);
        }
      },
      onPanResponderMove: async (evt) => {
        if (!isDrawing || !isDrawingActive) return;
        const coordinate = await screenToMapCoordinates(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        if (coordinate) {
          setDrawingPath((prev) => {
            // Only add if distance is significant (reduce noise)
            if (prev.length === 0) return [coordinate];
            const last = prev[prev.length - 1];
            const distance = Math.sqrt(
              Math.pow(coordinate.latitude - last.latitude, 2) +
              Math.pow(coordinate.longitude - last.longitude, 2)
            );
            // Add point if moved at least 0.0001 degrees (roughly 10 meters)
            if (distance > 0.0001) {
              return [...prev, coordinate];
            }
            return prev;
          });
        }
      },
      onPanResponderRelease: () => {
        setIsDrawingActive(false);
        if (drawingPath.length > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
    });
  }, [isDrawing, isDrawingActive, screenToMapCoordinates, drawingPath.length]);

  // Simplify path to reduce points while maintaining shape
  const simplifyPath = useCallback((path: { latitude: number; longitude: number }[]) => {
    if (path.length <= 3) return path;
    
    // Douglas-Peucker algorithm simplified
    const tolerance = 0.00005; // ~5 meters
    const simplified: { latitude: number; longitude: number }[] = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];
      
      // Calculate distance from current point to line between prev and next
      const dx = next.longitude - prev.longitude;
      const dy = next.latitude - prev.latitude;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        const t = ((curr.longitude - prev.longitude) * dx + (curr.latitude - prev.latitude) * dy) / (length * length);
        const projX = prev.longitude + t * dx;
        const projY = prev.latitude + t * dy;
        const dist = Math.sqrt(
          Math.pow(curr.longitude - projX, 2) + Math.pow(curr.latitude - projY, 2)
        );
        
        if (dist > tolerance) {
          simplified.push(curr);
        }
      } else {
        simplified.push(curr);
      }
    }
    
    simplified.push(path[path.length - 1]);
    return simplified;
  }, []);

  // Close the path (connect last point to first)
  const closedPath = useCallback(() => {
    if (drawingPath.length < 3) return drawingPath;
    const simplified = simplifyPath(drawingPath);
    return [...simplified, simplified[0]]; // Close the loop
  }, [drawingPath, simplifyPath]);

  const handleStartDrawing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDrawingPath([]);
    setIsDrawingActive(false);
    onDrawingChange(true);
  }, [onDrawingChange]);

  const handleStopDrawing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDrawingActive(false);
    onDrawingChange(false);
  }, [onDrawingChange]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDrawingPath([]);
    setIsDrawingActive(false);
  }, []);

  const handleUndo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawingPath((prev) => prev.slice(0, -1));
  }, []);

  const handleApply = useCallback(() => {
    if (drawingPath.length < 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const simplified = simplifyPath(drawingPath);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApplyPolygon(simplified);
    setDrawingPath([]);
    setIsDrawingActive(false);
    onDrawingChange(false);
  }, [drawingPath, simplifyPath, onApplyPolygon, onDrawingChange]);

  const handleToggleMapType = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMapTypeChange?.(mapType === 'standard' ? 'satellite' : 'standard');
  }, [mapType, onMapTypeChange]);

  const path = closedPath();
  const canApply = drawingPath.length >= 3;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        initialRegion={initialRegion}
        scrollEnabled={!isDrawing}
        zoomEnabled={!isDrawing}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        {...(panResponderRef.current?.panHandlers || {})}
      >
        {/* Drawing Path */}
        {path.length >= 2 && (
          <>
            <Polyline
              coordinates={path}
              strokeColor={theme['color-temporary-primary']}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
            />
            {path.length >= 3 && (
              <Polygon
                coordinates={path}
                fillColor={`${theme['color-temporary-primary']}20`}
                strokeWidth={0}
              />
            )}
          </>
        )}
      </MapView>

      {/* Small Top Controls */}
      <View style={styles.topControls}>
        {!isDrawing ? (
          <>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleStartDrawing}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={18} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleToggleMapType}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={mapType === 'standard' ? 'satellite' : 'map'}
                size={18}
                color="#222"
              />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {drawingPath.length > 0 && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleUndo}
                activeOpacity={0.8}
              >
                <MaterialIcons name="undo" size={18} color="#222" />
              </TouchableOpacity>
            )}
            {drawingPath.length > 0 && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <MaterialIcons name="delete-outline" size={18} color="#222" />
              </TouchableOpacity>
            )}
            {canApply && (
              <TouchableOpacity
                style={[styles.controlButton, styles.applyButton]}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleStopDrawing}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={18} color="#222" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Drawing Hint */}
      {isDrawing && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            {drawingPath.length === 0
              ? 'Drag to draw your area'
              : drawingPath.length < 3
              ? `Keep drawing... (${drawingPath.length} points)`
              : 'Tap Apply when done'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1000,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applyButton: {
    backgroundColor: theme['color-temporary-primary'],
  },
  hintContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FreehandDrawingMap;

