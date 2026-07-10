/**
 * Smooth Animated Map Markers
 * 
 * Production-ready system for smooth marker transitions between states:
 * dot → price → card with continuous morphing animations
 * 
 * Key Features:
 * - Runs on UI thread via Reanimated v3
 * - No pop-in/pop-out - smooth interpolation between all states
 * - Based on zoom level with derived values
 * - Optimized with React.memo and proper cleanup
 * 
 * @requires react-native-reanimated@^3.0.0
 * @requires react-native-maps
 */

import React, { useEffect, useMemo, memo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
  withTiming,
  Extrapolate,
  Easing,
  cancelAnimation
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

// ============================================================================
// TYPES
// ============================================================================

interface MarkerData {
  id: number | string;
  latitude: number;
  longitude: number;
  price?: number;
  image?: string;
  title?: string;
}

interface AnimatedMarkerProps {
  marker: MarkerData;
  isSelected: boolean;
  zoomLevel: number; // Pass from parent (region.latitudeDelta)
  onPress?: () => void;
}

// ============================================================================
// CONSTANTS - Zoom Thresholds
// ============================================================================

const ZOOM_THRESHOLDS = {
  // When latitudeDelta is ABOVE this = show dot
  DOT_MAX: 0.15,
  // When latitudeDelta is BETWEEN these = show price
  PRICE_MAX: 0.08,
  // When latitudeDelta is BELOW this = show card
  CARD_MIN: 0.08
} as const;

const SIZES = {
  DOT_SIZE: 12,
  DOT_INNER: 7,
  PRICE_WIDTH_MIN: 40,
  PRICE_WIDTH_MAX: 80,
  PRICE_HEIGHT: 28,
  CARD_WIDTH: 64,
  CARD_HEIGHT: 48,
  CARD_IMAGE_HEIGHT: 32
} as const;

const ANIMATION_CONFIG = {
  duration: 340,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1)
} as const;

const COLORS = {
  primary: "#AB0003",
  primarySelected: "#00A699",
  white: "#FFF",
  shadow: "rgba(0,0,0,0.15)"
} as const;

// ============================================================================
// UTILITY - Format Price
// ============================================================================

const formatPrice = (price: number): string => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${Math.round(price / 1000)}K`;
  return `${price}`;
};

// ============================================================================
// MAIN ANIMATED MARKER COMPONENT
// ============================================================================

export const AnimatedMarker = memo<AnimatedMarkerProps>(
  ({ marker, isSelected, zoomLevel, onPress }) => {
    const priceText = useMemo(() => formatPrice(marker.price || 0), [marker.price]);

    // ========================================================================
    // SHARED VALUES - Continuous Animation Progress
    // ========================================================================
    
    /**
     * Key Insight: Instead of discrete states (dot/price/card),
     * we use a continuous 0-1 progress value for each transition:
     * 
     * - dotProgress: 1 when fully dot, 0 when transitioning away
     * - priceProgress: 0→1 as dot transforms to price
     * - cardProgress: 0→1 as price transforms to card
     * 
     * This eliminates pop-in because elements smoothly blend.
     */
    const dotProgress = useSharedValue(1);
    const priceProgress = useSharedValue(0);
    const cardProgress = useSharedValue(0);

    // ========================================================================
    // DERIVED VALUE - Smooth Zoom-Based Progress Calculation
    // ========================================================================
    
    /**
     * useDerivedValue runs on UI thread and automatically updates
     * when zoomLevel changes. This is the key to smooth transitions.
     */
    const animationProgress = useDerivedValue(() => {
      // Map zoom level (latitudeDelta) to animation states
      // Higher latitudeDelta = zoomed out (show dot)
      // Lower latitudeDelta = zoomed in (show card)

      if (zoomLevel > ZOOM_THRESHOLDS.DOT_MAX) {
        // Fully zoomed out - show dot
        return {
          dot: 1,
          price: 0,
          card: 0
        };
      } else if (zoomLevel > ZOOM_THRESHOLDS.PRICE_MAX) {
        // Mid zoom - transition from dot to price
        const progress = interpolate(
          zoomLevel,
          [ZOOM_THRESHOLDS.PRICE_MAX, ZOOM_THRESHOLDS.DOT_MAX],
          [1, 0],
          Extrapolate.CLAMP
        );
        return {
          dot: 1 - progress,
          price: progress,
          card: 0
        };
      } else {
        // Zoomed in - transition from price to card
        const progress = interpolate(
          zoomLevel,
          [0, ZOOM_THRESHOLDS.PRICE_MAX],
          [1, 0],
          Extrapolate.CLAMP
        );
        return {
          dot: 0,
          price: 1 - progress,
          card: progress
        };
      }
    }, [zoomLevel]);

    // ========================================================================
    // ANIMATE PROGRESS VALUES
    // ========================================================================
    
    /**
     * Smooth timing animations when progress values change.
     * This runs on UI thread for silky smooth performance.
     */
    useEffect(() => {
      dotProgress.value = withTiming(
        animationProgress.value.dot,
        ANIMATION_CONFIG
      );
      priceProgress.value = withTiming(
        animationProgress.value.price,
        ANIMATION_CONFIG
      );
      cardProgress.value = withTiming(
        animationProgress.value.card,
        ANIMATION_CONFIG
      );
    }, [zoomLevel]);

    // Cleanup animations on unmount
    useEffect(() => {
      return () => {
        cancelAnimation(dotProgress);
        cancelAnimation(priceProgress);
        cancelAnimation(cardProgress);
      };
    }, []);

    // ========================================================================
    // ANIMATED STYLES - Smooth Morphing
    // ========================================================================

    /**
     * DOT STYLE
     * - Scales down and fades out as it transforms to price
     */
    const dotStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        dotProgress.value,
        [0, 1],
        [0.3, 1],
        Extrapolate.CLAMP
      );
      
      return {
        opacity: dotProgress.value,
        transform: [{ scale }]
      };
    });

    /**
     * PRICE STYLE
     * - Grows from dot (small circle) to pill shape
     * - Width expands horizontally
     * - Border radius transitions from circle to rounded rect
     */
    const priceStyle = useAnimatedStyle(() => {
      // Width: small circle → wide pill
      const width = interpolate(
        priceProgress.value,
        [0, 1],
        [SIZES.DOT_SIZE * 2, SIZES.PRICE_WIDTH_MIN + priceText.length * 4],
        Extrapolate.CLAMP
      );

      // Height: grows from dot to price height
      const height = interpolate(
        priceProgress.value,
        [0, 1],
        [SIZES.DOT_SIZE * 2, SIZES.PRICE_HEIGHT],
        Extrapolate.CLAMP
      );

      // Border radius: circle → rounded pill
      const borderRadius = interpolate(
        priceProgress.value,
        [0, 1],
        [SIZES.DOT_SIZE, SIZES.PRICE_HEIGHT / 2],
        Extrapolate.CLAMP
      );

      // Scale: slight bounce effect
      const scale = interpolate(
        priceProgress.value,
        [0, 0.5, 1],
        [0.8, 1.05, 1],
        Extrapolate.CLAMP
      );

      return {
        width,
        height,
        borderRadius,
        opacity: priceProgress.value,
        transform: [{ scale }]
      };
    });

    /**
     * CARD STYLE
     * - Expands from price pill to full card with image
     * - Height grows to reveal image section
     * - Width adjusts to card dimensions
     */
    const cardStyle = useAnimatedStyle(() => {
      // Width: price width → card width
      const width = interpolate(
        cardProgress.value,
        [0, 1],
        [SIZES.PRICE_WIDTH_MIN, SIZES.CARD_WIDTH],
        Extrapolate.CLAMP
      );

      // Height: price height → full card height
      const height = interpolate(
        cardProgress.value,
        [0, 1],
        [SIZES.PRICE_HEIGHT, SIZES.CARD_HEIGHT],
        Extrapolate.CLAMP
      );

      // Border radius: pill → card corners
      const borderRadius = interpolate(
        cardProgress.value,
        [0, 1],
        [SIZES.PRICE_HEIGHT / 2, 8],
        Extrapolate.CLAMP
      );

      // Scale: slight bounce
      const scale = interpolate(
        cardProgress.value,
        [0, 0.5, 1],
        [0.9, 1.03, 1],
        Extrapolate.CLAMP
      );

      return {
        width,
        height,
        borderRadius,
        opacity: cardProgress.value,
        transform: [{ scale }]
      };
    });

    /**
     * IMAGE REVEAL STYLE
     * - Image section grows from 0 to full height
     * - Creates unfolding effect
     */
    const imageRevealStyle = useAnimatedStyle(() => {
      const imageHeight = interpolate(
        cardProgress.value,
        [0, 1],
        [0, SIZES.CARD_IMAGE_HEIGHT],
        Extrapolate.CLAMP
      );

      return {
        height: imageHeight,
        opacity: cardProgress.value
      };
    });

    /**
     * TEXT FADE STYLE
     * - Price text fades in as price marker appears
     * - Fades out as card appears (card shows price differently)
     */
    const priceTextStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        priceProgress.value,
        [0, 0.3, 0.7, 1],
        [0, 1, 1, 0.8],
        Extrapolate.CLAMP
      );

      return { opacity };
    });

    const cardPriceTextStyle = useAnimatedStyle(() => {
      return {
        opacity: cardProgress.value
      };
    });

    // ========================================================================
    // RENDER - Layered Composition
    // ========================================================================

    /**
     * All states are rendered simultaneously and blended via opacity/scale.
     * This prevents unmounting and ensures smooth transitions.
     * 
     * Layout: All layers are absolutely positioned at center.
     */

    const markerColor = isSelected ? COLORS.primarySelected : COLORS.primary;

    return (
      <Marker
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude
        }}
        anchor={{ x: 0.5, y: 1 }}
        onPress={onPress}
        tracksViewChanges={false}
        zIndex={isSelected ? 1000 : 100}
      >
        <View style={styles.markerContainer}>
          {/* ============== DOT LAYER ============== */}
          <Animated.View style={[styles.layer, dotStyle]} pointerEvents="none">
            <View style={[styles.dotOuter, { backgroundColor: markerColor }]}>
              <View style={styles.dotInner} />
            </View>
          </Animated.View>

          {/* ============== PRICE LAYER ============== */}
          <Animated.View
            style={[
              styles.layer,
              styles.priceContainer,
              { backgroundColor: markerColor },
              priceStyle
            ]}
            pointerEvents="none"
          >
            <Animated.Text style={[styles.priceText, priceTextStyle]}>
              {priceText}
            </Animated.Text>
          </Animated.View>

          {/* ============== CARD LAYER ============== */}
          <Animated.View style={[styles.layer, cardStyle]} pointerEvents="none">
            <View
              style={[
                styles.cardContainer,
                { backgroundColor: markerColor }
              ]}
            >
              {/* Image Section - Unfolds from top */}
              <Animated.View style={[styles.cardImageSection, imageRevealStyle]}>
                {marker.image ? (
                  <Image
                    source={{ uri: marker.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <MaterialIcons name="home" size={14} color={COLORS.white} />
                  </View>
                )}
              </Animated.View>

              {/* Price Section - Always visible in card */}
              <View style={styles.cardPriceSection}>
                <Animated.Text style={[styles.cardPriceText, cardPriceTextStyle]}>
                  {priceText}
                </Animated.Text>
              </View>
            </View>

            {/* Pointer Arrow */}
            <View style={[styles.markerPointer, { borderTopColor: markerColor }]} />
          </Animated.View>
        </View>
      </Marker>
    );
  }
);

AnimatedMarker.displayName = "AnimatedMarker";

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  markerContainer: {
    width: SIZES.CARD_WIDTH + 10,
    height: SIZES.CARD_HEIGHT + 10,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  layer: {
    position: "absolute",
    bottom: 5,
    alignItems: "center",
    justifyContent: "center"
  },

  // DOT
  dotOuter: {
    width: SIZES.DOT_SIZE * 2,
    height: SIZES.DOT_SIZE * 2,
    borderRadius: SIZES.DOT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white
  },
  dotInner: {
    width: SIZES.DOT_INNER * 2,
    height: SIZES.DOT_INNER * 2,
    borderRadius: SIZES.DOT_INNER,
    backgroundColor: COLORS.white
  },

  // PRICE
  priceContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: "hidden"
  },
  priceText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -0.2
  },

  // CARD
  cardContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: "hidden"
  },
  cardImageSection: {
    width: "100%",
    overflow: "hidden"
  },
  cardImage: {
    width: "100%",
    height: "100%"
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  cardPriceSection: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center"
  },
  cardPriceText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -0.3
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1
  }
});

// ============================================================================
// USAGE EXAMPLE - How to use with MapView
// ============================================================================

/**
 * USAGE IN YOUR MAP COMPONENT:
 * 
 * import { AnimatedMarker } from './AnimatedMarker';
 * 
 * const YourMapComponent = () => {
 *   const [region, setRegion] = useState(INITIAL_REGION);
 *   const [selectedId, setSelectedId] = useState(null);
 * 
 *   // Track zoom level from region changes
 *   const handleRegionChange = (newRegion) => {
 *     setRegion(newRegion);
 *   };
 * 
 *   return (
 *     <MapView
 *       onRegionChange={handleRegionChange}
 *       onRegionChangeComplete={handleRegionChange}
 *     >
 *       {markers.map((marker) => (
 *         <AnimatedMarker
 *           key={marker.id}
 *           marker={marker}
 *           isSelected={selectedId === marker.id}
 *           zoomLevel={region.latitudeDelta} // Pass current zoom
 *           onPress={() => setSelectedId(marker.id)}
 *         />
 *       ))}
 *     </MapView>
 *   );
 * };
 */

// ============================================================================
// TECHNICAL EXPLANATION
// ============================================================================

/**
 * WHY THIS WORKS (No Pop-In):
 * 
 * 1. CONTINUOUS PROGRESS VALUES
 *    - Instead of if/else states, we use 0-1 progress values
 *    - Elements blend smoothly via opacity interpolation
 * 
 * 2. LAYERED COMPOSITION
 *    - All states (dot/price/card) render simultaneously
 *    - No unmounting = no pop-in
 *    - Absolute positioning keeps them centered
 * 
 * 3. UI THREAD ANIMATIONS
 *    - useDerivedValue runs on UI thread
 *    - No JS bridge lag
 *    - Smooth 60fps transitions
 * 
 * 4. INTERPOLATION MAGIC
 *    - Width/height/borderRadius all interpolate smoothly
 *    - Creates morphing effect instead of replacement
 * 
 * 5. PROPER CLEANUP
 *    - cancelAnimation prevents memory leaks
 *    - tracksViewChanges={false} optimizes rendering
 * 
 * AVOIDING COMMON MISTAKES:
 * 
 * ❌ DON'T: if (state === 'dot') return <Dot />
 *    (Causes unmount/remount = pop-in)
 * 
 * ✅ DO: Render all states with opacity transitions
 * 
 * ❌ DON'T: Animate with setState
 *    (Runs on JS thread = laggy)
 * 
 * ✅ DO: Use useSharedValue + useAnimatedStyle
 * 
 * ❌ DON'T: Change display: 'none'
 *    (Instant visibility change = jarring)
 * 
 * ✅ DO: Animate opacity from 0 to 1
 */