import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { studio } from "./studioTheme";
import { formatMetricValue, formatTrendLabel } from "./studioTrendUtils";

type Props = {
  label: string;
  value: number;
  delta?: number;
  pct?: number | null;
};

export function TikTokMetricCard({ label, value, delta, pct }: Props) {
  const showTrend = delta !== undefined;
  const trendStr = showTrend
    ? formatTrendLabel(delta, pct ?? null)
    : null;

  return (
    <View style={styles.card}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value}>{formatMetricValue(value)}</Text>
      {trendStr && trendStr !== "—" ? (
        <Text style={[styles.trend, delta! < 0 && styles.trendDown]}>
          {trendStr}
        </Text>
      ) : (
        <Text style={styles.trendPlaceholder}> </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: studio.cardLight,
    borderRadius: 12,
    padding: 14,
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: studio.muted,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: studio.ink,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  trend: {
    fontSize: 12,
    fontWeight: "600",
    color: studio.trend,
    marginTop: 4,
  },
  trendDown: {
    color: "#FF6B6B",
  },
  trendPlaceholder: {
    fontSize: 12,
    marginTop: 4,
  },
});
