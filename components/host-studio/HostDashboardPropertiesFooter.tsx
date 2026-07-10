import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { HostStudioListing } from "../../hooks/queries/useHostStudioQuery";
import { HostListingMetricCard } from "./HostListingMetricCard";
import { studio } from "./studioTheme";

type Props = {
  listings: HostStudioListing[];
  onPressListing: (listing: HostStudioListing) => void;
};

export function HostDashboardPropertiesFooter({
  listings,
  onPressListing,
}: Props) {
  const { t } = useTranslation();

  if (!listings.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>
          {t("hostStudio.yourListings", "Your listings")}
        </Text>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {t("hostStudio.noListings", "No listings yet")}
          </Text>
          <Text style={styles.emptySub}>
            {t(
              "hostStudio.noListingsSub",
              "Upload a listing to see views, saves, and likes.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t("hostStudio.yourListings", "Your listings")}
      </Text>
      <Text style={styles.sub}>
        {t(
          "hostStudio.tapForDetails",
          "Tap any listing for charts and AI guidance",
        )}
      </Text>
      {listings.map((item) => (
        <HostListingMetricCard
          key={`${item.kind}-${item.id}`}
          listing={item}
          onPress={() => onPressListing(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: studio.border,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13,
    color: studio.muted,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  empty: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: studio.surface,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: studio.ink,
  },
  emptySub: {
    fontSize: 13,
    color: studio.muted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
});
