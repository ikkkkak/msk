import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Sparkle } from "phosphor-react-native";
import { theme } from "../../theme";

const BRAND = theme["color-temporary-primary"];

type Props = {
  kindLabel: string;
};

/** Trust header — Meskeny listing agent persona (Chesky-style clarity). */
export function ListingAiAssistantBar({ kindLabel }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.avatar}>
        <Sparkle size={20} color={BRAND} weight="fill" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name}>
          {t("listingAi.agentName", { defaultValue: "Meskeny Listing Agent" })}
        </Text>
        <Text style={styles.role}>
          {t("listingAi.agentRole", {
            defaultValue: "{{kind}} · writes title, description & location",
            kind: kindLabel,
          })}
        </Text>
        <Text style={styles.trust}>
          {t("listingAi.agentTrust", {
            defaultValue:
              "Private to you · Matches Mauritania catalog · Never invents quartiers",
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EBEBEB",
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF4ED",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
  },
  role: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
    lineHeight: 18,
  },
  trust: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 6,
    lineHeight: 15,
  },
});
