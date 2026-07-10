/**
 * Premium AI Button Component
 * 
 * Sophisticated, clean button inspired by Shipfast & Grok
 * Professional, minimal, elegant design with subtle animations
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface PremiumAIButtonProps {
  onPress: () => void;
}

export const PremiumAIButton: React.FC<PremiumAIButtonProps> = ({ onPress }) => {
  const borderProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0.3);

  // Sophisticated slow border animation (4 seconds for smooth, premium feel)
  useEffect(() => {
    borderProgress.value = withRepeat(
      withTiming(1, { 
        duration: 4000, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) // Smooth ease-in-out
      }),
      -1,
      false
    );

    // Subtle glow pulse
    glowIntensity.value = withRepeat(
      withTiming(0.6, { 
        duration: 3000, 
        easing: Easing.inOut(Easing.ease) 
      }),
      -1,
      true
    );
  }, []);

  // Press effect - smooth spring
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Sophisticated moving border - travels around perimeter
  const topBorderStyle = useAnimatedStyle(() => {
    const progress = borderProgress.value;
    if (progress < 0.25) {
      const t = progress / 0.25;
      return {
        left: interpolate(t, [0, 1], [0, 26]),
        opacity: interpolate(t, [0, 0.5, 1], [0.4, 1, 0.4]),
      };
    }
    return { opacity: 0 };
  });

  const rightBorderStyle = useAnimatedStyle(() => {
    const progress = borderProgress.value;
    if (progress >= 0.25 && progress < 0.5) {
      const t = (progress - 0.25) / 0.25;
      return {
        top: interpolate(t, [0, 1], [0, 16]),
        opacity: interpolate(t, [0, 0.5, 1], [0.4, 1, 0.4]),
      };
    }
    return { opacity: 0 };
  });

  const bottomBorderStyle = useAnimatedStyle(() => {
    const progress = borderProgress.value;
    if (progress >= 0.5 && progress < 0.75) {
      const t = (progress - 0.5) / 0.25;
      return {
        right: interpolate(t, [0, 1], [0, 26]),
        opacity: interpolate(t, [0, 0.5, 1], [0.4, 1, 0.4]),
      };
    }
    return { opacity: 0 };
  });

  const leftBorderStyle = useAnimatedStyle(() => {
    const progress = borderProgress.value;
    if (progress >= 0.75) {
      const t = (progress - 0.75) / 0.25;
      return {
        bottom: interpolate(t, [0, 1], [0, 16]),
        opacity: interpolate(t, [0, 0.5, 1], [0.4, 1, 0.4]),
      };
    }
    return { opacity: 0 };
  });

  // Subtle glow effect
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.wrapper}>
        {/* Base Border - Clean, minimal */}
        <View style={styles.baseBorder} />

        {/* Subtle Glow */}
        <Animated.View style={[styles.glow, glowStyle]} />

        {/* Moving Border Highlight - Sophisticated travel */}
        <Animated.View style={[styles.movingBorderTop, topBorderStyle]}>
          <LinearGradient
            colors={[
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.6)',
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.4)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.movingBorderRight, rightBorderStyle]}>
          <LinearGradient
            colors={[
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.6)',
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.4)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.movingBorderBottom, bottomBorderStyle]}>
          <LinearGradient
            colors={[
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.6)',
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.4)',
            ]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.movingBorderLeft, leftBorderStyle]}>
          <LinearGradient
            colors={[
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.6)',
              theme['color-temporary-primary'],
              'rgba(255,255,255,0.4)',
            ]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Background */}
          <View style={styles.buttonBackground} />

          {/* AI Text - Clean, professional typography */}
          <Text style={styles.buttonText}>AI</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginRight: -4,
  },
  wrapper: {
    width: 48,
    height: 38,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 38,
    borderWidth: 1.5,
    borderColor: theme['color-temporary-primary'],
    borderRadius: 0,
    zIndex: 1,
    opacity: 0.8,
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 52,
    height: 42,
    borderRadius: 0,
    backgroundColor: theme['color-temporary-primary'],
    opacity: 0.2,
    zIndex: 0,
  },
  movingBorderTop: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 1.5,
    zIndex: 2,
  },
  movingBorderRight: {
    position: 'absolute',
    right: 0,
    width: 1.5,
    height: 24,
    zIndex: 2,
  },
  movingBorderBottom: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 1.5,
    zIndex: 2,
  },
  movingBorderLeft: {
    position: 'absolute',
    left: 0,
    width: 1.5,
    height: 24,
    zIndex: 2,
  },
  button: {
    width: 42,
    height: 32,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    zIndex: 3,
  },
  buttonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme['color-temporary-primary'],
    borderRadius: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 10,
    position: 'relative',
    letterSpacing: 1,
    fontFamily: 'System',
  },
});
