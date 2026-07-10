import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { HabitatPlot } from "../../types/habitat";
import { displayPlotNumber } from "./cadastreFilterUtils";
import { HabitatPlotDetailTable } from "./HabitatPlotDetailTable";

type Props = {
  plot: HabitatPlot;
  showHero?: boolean;
};

export function HabitatPlotDetailsBody({ plot, showHero = true }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      {showHero ? (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>
            {t("habitatCadastre.card.parcelNumber", "Parcel no.")}
          </Text>
          <Text style={styles.heroNumber}>
            {displayPlotNumber(plot.plot_number)}
          </Text>
        </View>
      ) : null}

      <HabitatPlotDetailTable plot={plot} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  hero: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  heroNumber: {
    fontSize: 42,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.8,
    textAlign: "center",
  },
});
