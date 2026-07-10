/**
 * LandmarksSection.tsx
 *
 * Display landmarks as horizontal scrollable chips
 */

import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MapPin } from "phosphor-react-native";
import { theme } from "../theme";

const PRIMARY = theme["color-temporary-primary"] as string;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
    marginLeft: 6,
  },
  chipTextActive: {
    color: "#FFF",
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 13,
    color: "#999"
  },
  loadingContainer: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center"
  }
});

interface Landmark {
  id: number;
  name?: string;
  title?: string;
  distance?: number;
  distanceKm?: number;
  zone_name?: string;
}

interface LandmarksSectionProps {
  landmarks: Landmark[];
  isLoading: boolean;
  onLandmarkPress: (landmarkId: number) => void;
  hideHeader?: boolean;
}

export const LandmarksSection = React.memo(
  ({
    landmarks,
    isLoading,
    onLandmarkPress,
    hideHeader = false,
  }: LandmarksSectionProps) => {
    const safeLandmarks = Array.isArray(landmarks) ? landmarks : [];

    // Format distance
    const formatDistance = useCallback((distance?: number) => {
      if (!distance) return "";
      if (distance >= 1000) {
        return `${(distance / 1000).toFixed(1)}km`;
      }
      return `${Math.round(distance)}m`;
    }, []);

    // Get landmark name
    const getLandmarkName = useCallback((landmark: Landmark) => {
      return landmark.name || landmark.title || "Landmark";
    }, []);

    // Render chip
    const renderChip = useCallback(
      (landmark: Landmark) => (
        <TouchableOpacity
          key={landmark.id}
          style={styles.chip}
          onPress={() => onLandmarkPress(landmark.id)}
          activeOpacity={0.7}
        >
          <MapPin size={14} color={PRIMARY} weight="fill" />
          <Text style={styles.chipText} numberOfLines={1}>
            {getLandmarkName(landmark)}
            {landmark.distance || landmark.distanceKm
              ? ` • ${formatDistance(landmark.distance)}`
              : ""}
          </Text>
        </TouchableOpacity>
      ),
      [onLandmarkPress, formatDistance, getLandmarkName]
    );

    if (isLoading) {
      return (
        <View style={styles.container}>
          {!hideHeader ? <Text style={styles.header}>Landmarks</Text> : null}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PRIMARY} />
          </View>
        </View>
      );
    }

    if (!isLoading && safeLandmarks.length === 0) {
      return (
        <View style={styles.container}>
          {!hideHeader ? <Text style={styles.header}>Landmarks</Text> : null}
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No landmarks nearby</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {!hideHeader ? <Text style={styles.header}>Landmarks</Text> : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          scrollEventThrottle={16}
        >
          {safeLandmarks.map((landmark) => renderChip(landmark))}
        </ScrollView>
      </View>
    );
  }
);

LandmarksSection.displayName = "LandmarksSection";
