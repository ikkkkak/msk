import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { HabitatPlot } from "../../types/habitat";
import { HabitatPlotDetailsBody } from "./HabitatPlotDetailsBody";

type Props = {
  plot: HabitatPlot;
  onClose: () => void;
};

export function HabitatPlotSheetContent({ plot, onClose }: Props) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.sheetTitle}>تفاصيل القطعة</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <HabitatPlotDetailsBody plot={plot} showHero />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>اتصل بالمالك</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>حفظ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
  },
  closeButton: { padding: 4 },
  actions: { gap: 10, marginTop: 16 },
  primaryButton: {
    backgroundColor: "#2a5298",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2a5298",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2a5298",
    fontSize: 16,
    fontWeight: "600",
  },
});
