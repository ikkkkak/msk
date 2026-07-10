/**
 * SkeletonUI.tsx
 *
 * Animated skeleton placeholders for profile sheet loading states
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Text } from "@ui-kitten/components";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  skeletonContainer: {
    backgroundColor: "#F5F5F5",
    overflow: "hidden"
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.4)"
  },
  // Header skeleton
  headerSkeleton: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E0E0",
    marginBottom: 12
  },
  nameSkeleton: {
    width: 150,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#E0E0E0"
  },
  bioSkeleton: {
    width: 200,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginTop: 8
  },
  // Section skeleton
  sectionHeaderSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginLeft: 16,
    marginVertical: 12
  },
  // Horizontal carousel skeleton
  carouselContainer: {
    paddingHorizontal: 8,
    marginBottom: 16
  },
  cardSkeleton: {
    width: width * 0.7,
    height: 200,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8
  },
  // Chips skeleton
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16
  },
  chipSkeleton: {
    height: 32,
    minWidth: 80,
    borderRadius: 16,
    backgroundColor: "#E0E0E0"
  }
});

/**
 * Animated shimmer effect
 */
function useShimmerAnimation() {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3]
  });

  return opacity;
}

/**
 * Base skeleton component with shimmer
 */
export function SkeletonBase({
  style,
  width = "100%",
  height = 16
}: {
  style?: any;
  width?: number | string;
  height?: number;
}) {
  const shimmerOpacity = useShimmerAnimation();

  return (
    <View
      style={[
        styles.skeletonContainer,
        {
          width,
          height
        },
        style
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            opacity: shimmerOpacity
          }
        ]}
      />
    </View>
  );
}

/**
 * Profile header skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <View style={styles.headerSkeleton}>
      <SkeletonBase style={styles.avatarSkeleton} width={80} height={80} />
      <SkeletonBase style={styles.nameSkeleton} width={150} height={18} />
      <SkeletonBase style={styles.bioSkeleton} width={200} height={14} />
    </View>
  );
}

/**
 * Horizontal carousel skeleton (3-4 cards)
 */
export function CarouselSkeleton() {
  return (
    <View>
      <SkeletonBase
        style={styles.sectionHeaderSkeleton}
        width={120}
        height={16}
      />
      <View style={styles.carouselContainer}>
        {[0, 1, 2].map((i) => (
          <SkeletonBase
            key={i}
            style={styles.cardSkeleton}
            width={width * 0.7}
            height={200}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Landmarks skeleton (4 chips)
 */
export function LandmarksSkeleton() {
  return (
    <View>
      <SkeletonBase
        style={styles.sectionHeaderSkeleton}
        width={100}
        height={16}
      />
      <View style={styles.chipsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBase
            key={i}
            style={styles.chipSkeleton}
            width={80 + Math.random() * 40}
            height={32}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Full sheet skeleton
 */
export function ProfileSheetSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <ProfileHeaderSkeleton />
      <CarouselSkeleton />
      <LandmarksSkeleton />
      <CarouselSkeleton />
    </View>
  );
}
