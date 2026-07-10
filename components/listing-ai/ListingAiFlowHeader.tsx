import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { X } from "phosphor-react-native";
import { LAI } from "./listingAiTheme";

type Props = {
  kindLabel: string;
  phase: "compose" | "review";
  onClose: () => void;
  disabled?: boolean;
};

export function ListingAiFlowHeader({
  kindLabel,
  phase,
  onClose,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={12}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <X size={20} color={LAI.text} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {phase === "compose"
          ? t("listingAi.flowTitleShort", {
              defaultValue: "New listing · {{kind}}",
              kind: kindLabel,
            })
          : t("listingAi.reviewTitle", { defaultValue: "Review" })}
      </Text>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: LAI.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LAI.border,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: LAI.text,
    textAlign: "center",
    marginHorizontal: 8,
  },
  spacer: { width: 20 },
});
