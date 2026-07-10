import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;
const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1000,
  formatValue = (val) => `${val.toLocaleString()} MRU`,
}) => {
  // Simple state
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  
  // Refs
  const minThumbRef = useRef<View>(null);
  const maxThumbRef = useRef<View>(null);
  
  // Animated values for smooth scaling
  const minThumbScale = useRef(new Animated.Value(1)).current;
  const maxThumbScale = useRef(new Animated.Value(1)).current;

  // Simple calculations
  const range = max - min;
  const stepSize = step;

  // Convert value to position
  const getPosition = useCallback((val: number) => {
    const clampedVal = Math.max(min, Math.min(max, val));
    return ((clampedVal - min) / range) * SLIDER_WIDTH;
  }, [min, max, range]);

  // Convert position to value
  const getValue = useCallback((position: number) => {
    const ratio = Math.max(0, Math.min(1, position / SLIDER_WIDTH));
    const val = min + ratio * range;
    return Math.round(val / stepSize) * stepSize;
  }, [min, range, stepSize]);

  // Current positions
  const positions = {
    min: getPosition(value[0]),
    max: getPosition(value[1])
  };

  // Individual thumb handlers
  const handleMinThumbPress = useCallback(() => {
    console.log('🎯 Min Thumb Pressed');
    setIsDragging('min');
    
    Animated.spring(minThumbScale, {
      toValue: 1.2,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [minThumbScale]);

  const handleMaxThumbPress = useCallback(() => {
    console.log('🎯 Max Thumb Pressed');
    setIsDragging('max');
    
    Animated.spring(maxThumbScale, {
      toValue: 1.2,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [maxThumbScale]);

  // Global movement handler
  const handleMove = useCallback((evt: any) => {
    if (!isDragging) return;
    
    const touchX = evt.nativeEvent.locationX;
    const newVal = getValue(touchX);
    
    console.log('🎯 Moving:', { isDragging, touchX, newVal });
    
    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(newVal, value[1]));
      onChange([newMin, value[1]]);
    } else if (isDragging === 'max') {
      const newMax = Math.max(value[0], Math.min(newVal, max));
      onChange([value[0], newMax]);
    }
  }, [isDragging, getValue, value, min, max, onChange]);

  // Simple end drag
  const handleEndDrag = useCallback(() => {
    if (!isDragging) return;
    
    console.log('🎯 Drag Ended:', { wasDragging: isDragging });
    
    setIsDragging(null);
    
    // Scale back
    const targetScale = isDragging === 'min' ? minThumbScale : maxThumbScale;
    Animated.spring(targetScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [isDragging, minThumbScale, maxThumbScale]);

  // PanResponder handles everything
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, // Always capture
    onMoveShouldSetPanResponder: () => true, // Always capture
    onPanResponderGrant: (evt) => {
      if (isDragging === null) {
        // Initial touch - determine which thumb
        const touchX = evt.nativeEvent.locationX;
        const minDistance = Math.abs(touchX - positions.min);
        const maxDistance = Math.abs(touchX - positions.max);
        
        const dragTarget = minDistance < maxDistance ? 'min' : 'max';
        console.log('🎯 PanResponder Grant:', { touchX, minDistance, maxDistance, selected: dragTarget });
        
        if (dragTarget === 'min') {
          handleMinThumbPress();
        } else {
          handleMaxThumbPress();
        }
      }
    },
    onPanResponderMove: handleMove,
    onPanResponderRelease: handleEndDrag,
    onPanResponderTerminate: handleEndDrag,
  }), [handleMove, handleEndDrag, isDragging, positions, handleMinThumbPress, handleMaxThumbPress]);

  // Format values
  const formattedValues = {
    min: formatValue(value[0]),
    max: formatValue(value[1])
  };

  return (
    <View style={styles.container}>
      {/* Value Display */}
      <View style={styles.valueContainer}>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Min</Text>
          <Text style={styles.valueText}>{formattedValues.min}</Text>
        </View>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Max</Text>
          <Text style={styles.valueText}>{formattedValues.max}</Text>
        </View>
      </View>

      {/* Slider Track */}
      <View 
        style={styles.sliderContainer} 
        {...panResponder.panHandlers}
      >
        <View style={styles.track} />
        <View 
          style={[
            styles.activeTrack, 
            { 
              left: positions.min, 
              width: positions.max - positions.min 
            }
          ]} 
        />
        
        {/* Min Thumb */}
        <Animated.View
          ref={minThumbRef}
          style={[
            styles.thumb,
            {
              left: positions.min - THUMB_SIZE / 2,
              transform: [{ scale: minThumbScale }]
            }
          ]}
        />
        
        {/* Max Thumb */}
        <Animated.View
          ref={maxThumbRef}
          style={[
            styles.thumb,
            {
              left: positions.max - THUMB_SIZE / 2,
              transform: [{ scale: maxThumbScale }]
            }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  valueBox: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    color: '#717171',
    marginBottom: 4,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 14,
    color: '#222222',
    fontWeight: '600',
  },
  sliderContainer: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: '#E0E0E0',
    borderRadius: TRACK_HEIGHT / 2,
    width: SLIDER_WIDTH,
  },
  activeTrack: {
    height: TRACK_HEIGHT,
    backgroundColor: '#222222',
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#222222',
    position: 'absolute',
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    ...Platform.select({
      ios: {
        shouldRasterizeIOS: true,
      },
      android: {
        elevation: 0,
      },
    }),
  },
});