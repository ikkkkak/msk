import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import { CaretRight } from "phosphor-react-native";
import type { HostStudioListing } from "../../hooks/queries/useHostStudioQuery";
import { studio } from "./studioTheme";
import { formatMetricValue } from "./studioTrendUtils";
import { StudioSparkline } from "./StudioSparkline";
import { buildDefaultDays } from "./chartDateUtils";

type Props = {
  listing: HostStudioListing;
  onPress: () => void;
};

export function HostListingMetricCard({ listing, onPress }: Props) {
  const { t } = useTranslation();
  const m = listing.metrics;
  const kindLabel =
    listing.kind === "rent"
      ? t("hostStudio.kindRent", "Rent")
      : t("hostStudio.kindSale", "For sale");

  const sparkValues = useMemo(() => {
    const raw = listing.trend?.views ?? [];
    if (raw.length >= 7) return raw.slice(-7);
    if (raw.length > 0) return raw;
    return [0, 0, 0, 0, 0, 0, 0];
  }, [listing.trend?.views]);

  const periodViews = useMemo(
    () => sparkValues.reduce((a, b) => a + b, 0),
    [sparkValues],
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Image
        source={{
          uri: listing.image_url || "https://via.placeholder.com/120",
        }}
        style={styles.thumb}
      />

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title || t("hostStudio.untitled", "Listing")}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {kindLabel}
          {listing.city ? ` · ${listing.city}` : ""}
        </Text>
      </View>

      <View style={styles.sparkCol}>
        <Text style={styles.sparkValue}>
          {formatMetricValue(periodViews || m.views)}
        </Text>
        <StudioSparkline values={sparkValues} width={76} height={34} />
        <Text style={styles.sparkLabel}>
          {t("hostStudio.cardViews7d", "Views · 7d")}
        </Text>
      </View>

      <CaretRight
        size={16}
        color={studio.muted}
        weight="bold"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: studio.cardLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: studio.surface,
  },
  center: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
    minHeight: 64,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: studio.ink,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    color: studio.muted,
    marginTop: 4,
  },
  sparkCol: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: 80,
    paddingRight: 4,
  },
  sparkValue: {
    fontSize: 15,
    fontWeight: "700",
    color: studio.ink,
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  sparkLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: studio.muted,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 2,
  },
});
