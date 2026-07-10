import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBase } from "../SkeletonUI";
import { studio } from "./studioTheme";

export function HostStudioDashboardSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={styles.tabsRow}>
        <SkeletonBase height={36} style={styles.tab} />
        <SkeletonBase height={36} style={styles.tab} />
        <SkeletonBase height={36} style={styles.tab} />
      </View>
      <View style={styles.segment}>
        <SkeletonBase height={44} style={styles.segmentInner} />
      </View>
      <View style={styles.metricsRow}>
        <SkeletonBase height={88} style={styles.metric} />
        <SkeletonBase height={88} style={styles.metric} />
      </View>
      <View style={styles.metricsRow}>
        <SkeletonBase height={88} style={styles.metric} />
        <SkeletonBase height={88} style={styles.metric} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <SkeletonBase height={120} style={styles.cardImage} />
          <View style={styles.cardBody}>
            <SkeletonBase height={14} width="70%" />
            <SkeletonBase height={12} width="45%" style={styles.cardLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: studio.surface,
  },
  segment: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: studio.surface,
    padding: 4,
  },
  segmentInner: {
    borderRadius: 8,
    backgroundColor: studio.surface,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  metric: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: studio.surface,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    backgroundColor: studio.bg,
  },
  cardImage: {
    width: "100%",
    borderRadius: 0,
    backgroundColor: studio.surface,
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  cardLine: {
    marginTop: 4,
  },
});
