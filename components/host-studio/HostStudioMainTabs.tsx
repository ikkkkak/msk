import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { studio } from "./studioTheme";

export type HostStudioMainTab = "overview" | "properties" | "videos";

type Props = {
  value: HostStudioMainTab;
  onChange: (tab: HostStudioMainTab) => void;
};

export function HostStudioMainTabs({ value, onChange }: Props) {
  const { t } = useTranslation();
  const tabs: { key: HostStudioMainTab; label: string }[] = [
    { key: "overview", label: t("hostStudio.tabOverview", "Overview") },
    { key: "videos", label: t("hostStudio.tabVideos", "Videos") },
    { key: "properties", label: t("hostStudio.tabProperties", "Properties") },
  ];

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
            style={[styles.tabHit, active && styles.tabHitActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
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
    gap: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabHit: {
    paddingBottom: 8,
  },
  tabHitActive: {
    borderBottomWidth: 2,
    borderBottomColor: studio.ink,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: studio.muted,
  },
  tabTextActive: {
    fontWeight: "700",
    color: studio.ink,
  },
});
