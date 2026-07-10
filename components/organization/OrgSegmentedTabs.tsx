import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import { orgTheme as o } from "./orgTheme";

export type OrgSegmentOption<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

type Props<T extends string> = {
  options: OrgSegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  style?: object;
};

/** Text-first segmented control (no tab icons). */
export function OrgSegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  style,
}: Props<T>) {
  return (
    <View style={[styles.wrap, style]}>
      {options.map((opt) => {
        const on = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.segment, on && styles.segmentOn]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{opt.label}</Text>
            {typeof opt.count === "number" && opt.count > 0 ? (
              <View style={[styles.count, on && styles.countOn]}>
                <Text style={[styles.countText, on && styles.countTextOn]}>
                  {opt.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 3,
    backgroundColor: o.surface,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: o.line,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  segmentOn: {
    backgroundColor: o.bg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: o.muted,
  },
  labelOn: {
    fontWeight: "600",
    color: o.ink,
  },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  countOn: {
    backgroundColor: o.ink,
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: o.muted,
  },
  countTextOn: {
    color: "#FFF",
  },
});
