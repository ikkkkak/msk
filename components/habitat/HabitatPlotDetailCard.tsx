/**
 * Cadastre plot detail — compact bottom card with Excel-style field table.
 */
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  I18nManager,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CaretRight } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { HabitatPlot } from "../../types/habitat";
import { HabitatPlotDetailTable } from "./HabitatPlotDetailTable";

type Props = {
  plot: HabitatPlot;
  onClose: () => void;
  onViewAllDetails?: (plot: HabitatPlot) => void;
};

export function HabitatPlotBottomCard({
  plot,
  onClose,
  onViewAllDetails,
}: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRtl =
    I18nManager.isRTL || (i18n.language || "").toLowerCase().startsWith("ar");
  const isForSale = plot.is_for_sale === true;

  const close = () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const openDetails = () => {
    if (!isForSale || !onViewAllDetails) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onViewAllDetails(plot);
  };

  return (
    <View
      style={[styles.host, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none"
    >
      {/* <View style={[styles.card, isRtl && styles.cardRtl]}> */}

      {/* <View style={[styles.toolbar, isRtl && styles.toolbarRtl]}>
          <Text style={[styles.toolbarTitle, isRtl && styles.textRtl]}>
            {t("habitatCadastre.card.sheetTitle", "Parcel record")}
          </Text> */}
      <View style={styles.toolbarActions}>
        {isForSale ? (
          <View style={styles.salePill}>
            <Text style={styles.salePillText}>
              {t("habitatCadastre.card.forSale", "For sale")}
            </Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={close} style={styles.close} hitSlop={8}>
        <MaterialIcons name="close" size={14} color="#6B7280" />
      </Pressable>
      {/* </View> */}

      <View style={styles.tableWrap}>
        <HabitatPlotDetailTable plot={plot} compact includeParcelRow />
      </View>

      {isForSale && onViewAllDetails ? (
        <Pressable style={styles.cta} onPress={openDetails}>
          <Text style={styles.ctaText}>
            {t("habitatCadastre.card.viewListing", "View listing")}
          </Text>
          <CaretRight size={12} color="#1E3A5F" weight="bold" />
        </Pressable>
      ) : null}
      {/* </View> */}
    </View>
  );
}

/** @deprecated Use HabitatPlotPreviewSheet + HabitatPlotPinMarker. */
export function HabitatPlotCalloutContent(props: Props) {
  return <HabitatPlotBottomCard {...props} />;
}

export function HabitatPlotCalloutMarker(_props: Props) {
  return null;
}

export function HabitatPlotDetailCard(props: Props) {
  return <HabitatPlotBottomCard {...props} />;
}

/** Approximate visible height — keep map padding in sync. */
export const HABITAT_PLOT_BOTTOM_CARD_HEIGHT = 220;

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10220,
    elevation: 10220,
    pointerEvents: "box-none",
  },
  card: {
    marginHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#CBD5E1",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  cardRtl: {
    alignItems: "stretch",
  },
  stripe: {
    height: 2,
    backgroundColor: "#1E3A5F",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  toolbarRtl: {
    flexDirection: "row-reverse",
  },
  toolbarTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  salePill: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  salePillText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#B91C1C",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  close: {
    width: 22,
    alignSelf: "flex-end",
    height: 22,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  tableWrap: {
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginHorizontal: 8,
    marginBottom: 8,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#BFDBFE",
  },
  ctaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  textRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
