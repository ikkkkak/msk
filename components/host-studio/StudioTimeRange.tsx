import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { studio } from "./studioTheme";
import type { StudioRangeDays } from "./studioTrendUtils";

type Props = {
  value: StudioRangeDays;
  onChange: (v: StudioRangeDays) => void;
};

export function StudioTimeRange({ value, onChange }: Props) {
  const { t } = useTranslation();
  const options: { key: StudioRangeDays; label: string }[] = [
    { key: 7, label: t("hostStudio.range7", "7 days") },
    { key: 14, label: t("hostStudio.range14", "14 days") }
  ];

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: studio.pillBg
  },
  pillActive: {
    backgroundColor: studio.pillActiveBg
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.pillText
  },
  pillTextActive: {
    color: studio.pillActiveText
  }
});
