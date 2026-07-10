import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { studio } from "./studioTheme";

type Props = {
  pendingReservations?: number;
};

export function HostStudioInsightsPlain({ pendingReservations = 0 }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t("hostStudio.insightsTitle", "Quick insights")}
      </Text>
      {pendingReservations > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("hostStudio.pendingResTitle", "Reservation requests")}
          </Text>
          <Text style={styles.cardBody}>
            {t("hostStudio.pendingResPlain", {
              count: pendingReservations,
              defaultValue:
                "You have {{count}} guest(s) waiting for a reply on a rental.",
            })}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardBody}>
            {t(
              "hostStudio.insightsAllGood",
              "Scroll down to open each listing. Charts above show your overall reach.",
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: studio.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: studio.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: studio.ink,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: studio.inkSecondary,
    lineHeight: 20,
  },
});
