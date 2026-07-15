import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { X } from "phosphor-react-native";
import type { HabitatPlot } from "../../types/habitat";
import { useTranslation } from "react-i18next";

interface HabitatPlotDetailCardProps {
  plot: HabitatPlot;
  onClose?: () => void;
}

export const HabitatPlotDetailCard = React.memo(
  function HabitatPlotDetailCard({ plot, onClose }: HabitatPlotDetailCardProps) {
    const { t } = useTranslation();

    const getArea = () => plot.area_m2 || 0;
    const getDimensions = () => {
      if (plot.dimensions_string) return plot.dimensions_string;
      if (plot.sides_m?.length) return plot.sides_m.join(" × ");
      if (plot.length_m && plot.width_m) return `${plot.length_m}m × ${plot.width_m}m`;
      return null;
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {plot.plot_number}
            </Text>
          </View>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" weight="bold" />
            </Pressable>
          )}
        </View>

        <ScrollView style={styles.content} scrollEnabled={false}>
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>رقم القطعة</Text>
              <Text style={styles.value}>{plot.plot_number}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>المساحة</Text>
              <Text style={styles.value}>{getArea().toFixed(2)} m²</Text>
            </View>

            {getDimensions() && (
              <View style={styles.row}>
                <Text style={styles.label}>الأبعاد</Text>
                <Text style={styles.value}>{getDimensions()}</Text>
              </View>
            )}

            {plot.centroid_lat && plot.centroid_lng && (
              <View style={styles.row}>
                <Text style={styles.label}>الموقع</Text>
                <Text style={styles.value}>
                  {plot.centroid_lat.toFixed(4)}, {plot.centroid_lng.toFixed(4)}
                </Text>
              </View>
            )}

            {plot.is_for_sale && (
              <View style={[styles.row, styles.forSaleRow]}>
                <Text style={styles.forSaleLabel}>
                  معروض للبيع
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    maxHeight: 300,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right",
    flex: 1,
  },
  forSaleRow: {
    backgroundColor: "#FEE",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  forSaleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E91E63",
    textAlign: "center",
    flex: 1,
  },
});
