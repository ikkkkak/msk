import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { HostStudioListing } from "../../hooks/queries/useHostStudioQuery";
import { HostListingMetricCard } from "./HostListingMetricCard";
import { studio } from "./studioTheme";
import type { HostStudioPropertyKind } from "./HostStudioPropertyKindTabs";

type Props = {
  listings: HostStudioListing[];
  kind: HostStudioPropertyKind;
  onPressListing: (listing: HostStudioListing) => void;
};

function HostStudioPropertiesListInner({
  listings,
  kind,
  onPressListing,
}: Props) {
  const { t } = useTranslation();
  const filtered = useMemo(
    () => listings.filter((l) => l.kind === kind),
    [listings, kind],
  );

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          {kind === "rent"
            ? t("hostStudio.noRentListings", "No rent listings yet")
            : t("hostStudio.noBuyListings", "No listings for sale yet")}
        </Text>
        <Text style={styles.emptySub}>
          {kind === "rent"
            ? t(
                "hostStudio.noRentListingsSub",
                "Add a rental property to track views and engagement.",
              )
            : t(
                "hostStudio.noBuyListingsSub",
                "Add a property for sale to track buyer interest.",
              )}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {filtered.map((item) => (
        <HostListingMetricCard
          key={`${item.kind}-${item.id}`}
          listing={item}
          onPress={() => onPressListing(item)}
        />
      ))}
    </View>
  );
}

export const HostStudioPropertiesList = React.memo(HostStudioPropertiesListInner);

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  empty: {
    marginHorizontal: 16,
    padding: 28,
    borderRadius: 12,
    backgroundColor: studio.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: studio.ink,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: studio.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
