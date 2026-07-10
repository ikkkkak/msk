import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Clock, MapPin } from "phosphor-react-native";

export function ListingAiCredibilityStrip() {
  const { t } = useTranslation();

  const items = [
    {
      Icon: Clock,
      text: t("listingAi.credibilityTime", {
        defaultValue: "~70% faster than manual",
      }),
    },
    {
      Icon: MapPin,
      text: t("listingAi.credibilityLocation", {
        defaultValue: "Official city & quartier catalog",
      }),
    },
    {
      Icon: ShieldCheck,
      text: t("listingAi.credibilityPrivate", {
        defaultValue: "Private until you publish",
      }),
    },
  ];

  return (
    <View style={styles.wrap}>
      {items.map(({ Icon, text }) => (
        <View key={text} style={styles.item}>
          <Icon size={14} color="#525252" weight="duotone" />
          <Text style={styles.text}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: "#525252",
    fontWeight: "500",
    lineHeight: 18,
  },
});
