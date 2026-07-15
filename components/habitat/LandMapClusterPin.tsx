import React, { memo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  formatLandClusterCount,
  landClusterBubbleRadius,
} from "../../utils/landmarkMapClustering";
import { LAND_MAP_CLUSTER_THEME as T } from "../../utils/landMapClusterTheme";

/** Minimal numbered cluster — one circle, one label. */
export const LandMapClusterPin = memo(function LandMapClusterPin({
  count,
}: {
  count: number;
}) {
  const label = formatLandClusterCount(count);
  const r = landClusterBubbleRadius(count);
  const size = r * 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.bubble, { width: size, height: size, borderRadius: r }]}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    backgroundColor: T.bubble,
    borderWidth: 2,
    borderColor: T.bubbleBorder,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: { elevation: 4 },
    }),
  },
  label: {
    color: T.label,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
