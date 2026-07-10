import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;
const TRACK_BORDER_RADIUS = 3;

interface CustomPriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
}

export const CustomPriceRangeSlider: React.FC<CustomPriceRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1000,
  formatValue = (val) => `${val.toLocaleString()} MRU`,
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  
  // Refs
  const minThumbRef = useRef<View>(null);
  const maxThumbRef = useRef<View>(null);
  
  // Animated values for smooth scaling and glow effects
  const minThumbScale = useRef(new Animated.Value(1)).current;
  const maxThumbScale = useRef(new Animated.Value(1)).current;
  const minThumbGlow = useRef(new Animated.Value(0)).current;
  const maxThumbGlow = useRef(new Animated.Value(0)).current;
  const trackGlow = useRef(new Animated.Value(0)).current;

  // Calculations
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

  // Thumb press handlers with animations
  const handleMinThumbPress = useCallback(() => {
    setIsDragging('min');
    
    Animated.parallel([
      Animated.spring(minThumbScale, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.timing(minThumbGlow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(trackGlow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [minThumbScale, minThumbGlow, trackGlow]);

  const handleMaxThumbPress = useCallback(() => {
    setIsDragging('max');
    
    Animated.parallel([
      Animated.spring(maxThumbScale, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.timing(maxThumbGlow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(trackGlow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [maxThumbScale, maxThumbGlow, trackGlow]);

  // Movement handler
  const handleMove = useCallback((evt: any) => {
    if (!isDragging) return;
    
    const touchX = evt.nativeEvent.locationX;
    const newVal = getValue(touchX);
    
    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(newVal, value[1]));
      onChange([newMin, value[1]]);
    } else if (isDragging === 'max') {
      const newMax = Math.max(value[0], Math.min(newVal, max));
      onChange([value[0], newMax]);
    }
  }, [isDragging, getValue, value, min, max, onChange]);

  // End drag handler
  const handleEndDrag = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(null);
    
    // Scale back and fade glow
    const targetScale = isDragging === 'min' ? minThumbScale : maxThumbScale;
    const targetGlow = isDragging === 'min' ? minThumbGlow : maxThumbGlow;
    
    Animated.parallel([
      Animated.spring(targetScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.timing(targetGlow, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(trackGlow, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [isDragging, minThumbScale, maxThumbScale, minThumbGlow, maxThumbGlow, trackGlow]);

  // PanResponder
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (isDragging === null) {
        const touchX = evt.nativeEvent.locationX;
        const minDistance = Math.abs(touchX - positions.min);
        const maxDistance = Math.abs(touchX - positions.max);
        
        const dragTarget = minDistance < maxDistance ? 'min' : 'max';
        
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
          <Text style={styles.valueLabel}>Min Price</Text>
          <Text style={styles.valueText}>{formattedValues.min}</Text>
        </View>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Max Price</Text>
          <Text style={styles.valueText}>{formattedValues.max}</Text>
        </View>
      </View>

      {/* Slider Track */}
      <View 
        style={styles.sliderContainer} 
        {...panResponder.panHandlers}
      >
        {/* Track Background */}
        <View style={styles.track} />
        
        {/* Active Track with Glow */}
        <Animated.View 
          style={[
            styles.activeTrack, 
            { 
              left: positions.min, 
              width: positions.max - positions.min,
              opacity: trackGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
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
        >
          <Animated.View 
            style={[
              styles.thumbGlow,
              {
                opacity: minThumbGlow,
                transform: [{ scale: minThumbGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                })}]
              }
            ]} 
          />
          <View style={styles.thumbInner} />
        </Animated.View>
        
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
        >
          <Animated.View 
            style={[
              styles.thumbGlow,
              {
                opacity: maxThumbGlow,
                transform: [{ scale: maxThumbGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                })}]
              }
            ]} 
          />
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>

      {/* Price Markers */}
      <View style={styles.priceMarkers}>
        <Text style={styles.priceMarker}>0</Text>
        <Text style={styles.priceMarker}>10K</Text>
        <Text style={styles.priceMarker}>20K</Text>
        <Text style={styles.priceMarker}>30K</Text>
        <Text style={styles.priceMarker}>40K</Text>
        <Text style={styles.priceMarker}>50K+</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  valueBox: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  valueLabel: {
    fontSize: 12,
    color: '#717171',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '700',
  },
  sliderContainer: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: '#E0E0E0',
    borderRadius: TRACK_BORDER_RADIUS,
    width: SLIDER_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTrack: {
    height: TRACK_HEIGHT,
    backgroundColor: '#222222',
    borderRadius: TRACK_BORDER_RADIUS,
    position: 'absolute',
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
    shadowColor: '#222222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlow: {
    position: 'absolute',
    width: THUMB_SIZE * 2,
    height: THUMB_SIZE * 2,
    borderRadius: THUMB_SIZE,
    backgroundColor: 'rgba(34, 34, 34, 0.2)',
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#222222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  priceMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  priceMarker: {
    fontSize: 12,
    color: '#717171',
    fontWeight: '500',
  },
});
