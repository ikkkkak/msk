import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Text } from "@ui-kitten/components";

interface CircularProgressProps {
  size?: number;
  progress: number; // 0-100
  strokeWidth?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  percentageColor?: string;
  percentageSize?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 60,
  progress,
  strokeWidth = 4,
  backgroundColor = "#E5E5EA",
  progressColor = "#161616",
  showPercentage = true,
  percentageColor = "#161616",
  percentageSize = 14,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [progress, animatedProgress]);

  const rotateTransform = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />

      {/* Progress circle */}
      <Animated.View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: "transparent",
            borderTopColor: progressColor,
            borderRightColor: progressColor,
            transform: [{ rotate: rotateTransform }],
          },
        ]}
      />

      {/* Percentage text */}
      {showPercentage && (
        <View style={styles.percentageContainer}>
          <Text
            style={[
              styles.percentage,
              { color: percentageColor, fontSize: percentageSize },
            ]}
          >
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
  },
  progressCircle: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
  percentageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentage: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
