import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { studio } from "./studioTheme";

export type VideoSegment = "rent" | "sale";

type Tab = { key: VideoSegment; label: string; count?: number };

type Props = {
  value: VideoSegment;
  onChange: (v: VideoSegment) => void;
  tabs: Tab[];
};

/** Full-width segmented control for the Videos tab. */
export function HostStudioVideoSegment({ value, onChange, tabs }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
            {typeof tab.count === "number" ? (
              <Text style={[styles.count, active && styles.countActive]}>
                {tab.count}
              </Text>
            ) : null}
            {active ? <View style={styles.indicator} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: studio.surface,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    position: "relative",
  },
  segmentActive: {
    backgroundColor: studio.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: studio.muted,
  },
  labelActive: {
    color: studio.ink,
  },
  count: {
    fontSize: 11,
    fontWeight: "600",
    color: studio.muted,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  countActive: {
    color: studio.inkSecondary,
  },
  indicator: {
    display: "none",
  },
});
