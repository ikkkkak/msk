import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CaretRight } from "phosphor-react-native";
import type { HostStudioListing } from "../hooks/queries/useHostStudioQuery";
import { useHostStudioLive } from "../hooks/queries/useHostStudioLive";
import { useUser } from "../hooks/useUser";
import { StudioChart } from "../components/host-studio/StudioChart";
import { StudioTimeRange } from "../components/host-studio/StudioTimeRange";
import { studio } from "../components/host-studio/studioTheme";
import { buildDefaultDays } from "../components/host-studio/chartDateUtils";
import {
  sliceTrend,
  formatMetricValue,
  type StudioRangeDays,
} from "../components/host-studio/studioTrendUtils";
import {
  useListingGuidePreviews,
  normalizeGuidePreviewsMap,
  type ListingGuidePreview,
} from "../hooks/queries/useMeskenyGuide";

export const HostListingStudioScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { user } = useUser();
  const seedListing = route.params?.listing as HostStudioListing | undefined;
  const [range, setRange] = useState<StudioRangeDays>(7);

  const canLoad = Boolean(user?.ID && user?.accessToken);
  const { studio, isSyncing } = useHostStudioLive(canLoad);

  const listing = useMemo(() => {
    if (!seedListing) return undefined;
    const fresh = studio?.listings?.find(
      (l) => l.kind === seedListing.kind && l.id === seedListing.id,
    );
    return fresh ?? seedListing;
  }, [studio?.listings, seedListing]);

  const saleId = listing?.kind === "sale" ? listing.id : 0;
  const { data: previewData } = useListingGuidePreviews(
    saleId > 0 ? [saleId] : [],
    saleId > 0,
  );
  const previewMap = normalizeGuidePreviewsMap(previewData);
  const preview = saleId > 0 ? previewMap.get(saleId) : undefined;

  const m = listing?.metrics;
  const trendDays =
    listing?.trend?.days?.length === listing?.trend?.views?.length
      ? listing!.trend!.days!
      : buildDefaultDays(14);

  const viewsValues = listing?.trend?.views ?? [];
  const viewsSliced = useMemo(
    () => sliceTrend(viewsValues, trendDays, range),
    [viewsValues, trendDays, range],
  );
  const periodViews = viewsSliced.values.reduce((a, b) => a + b, 0);

  if (!listing || !m) {
    return (
      <SafeAreaView style={styles.root}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <ArrowLeft size={22} color={studio.ink} />
        </TouchableOpacity>
        <Text style={styles.err}>
          {t("hostStudio.listingNotFound", "Listing not found")}
        </Text>
      </SafeAreaView>
    );
  }

  const kindLabel =
    listing.kind === "rent"
      ? t("hostStudio.kindRent", "Rent")
      : t("hostStudio.kindSale", "For sale");

  const periodHint =
    range === 7
      ? t("hostStudio.viewsThisWeek", "views this week")
      : t("hostStudio.viewsThisPeriod", "views in this period");

  const showLegacyHint = m.views > 0 && periodViews === 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.back}
        >
          <ArrowLeft size={22} color={studio.ink} />
        </TouchableOpacity>
        {isSyncing ? (
          <ActivityIndicator size="small" color={studio.muted} />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listingRow}>
          <Image
            source={{
              uri: listing.image_url || "https://via.placeholder.com/120",
            }}
            style={styles.thumb}
          />
          <View style={styles.listingText}>
            <Text style={styles.title} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={styles.meta}>
              {kindLabel}
              {listing.city ? ` · ${listing.city}` : ""}
            </Text>
          </View>
        </View>

        <StudioTimeRange value={range} onChange={setRange} />

        <Text style={styles.bigNumber}>{formatMetricValue(periodViews)}</Text>
        <Text style={styles.bigLabel}>{periodHint}</Text>

        {showLegacyHint ? (
          <Text style={styles.hint}>
            {t(
              "hostStudio.chartLegacyHint",
              "You have {{total}} total views. New views will appear day by day on this chart.",
              { total: formatMetricValue(m.views) },
            )}
          </Text>
        ) : null}

        <View style={styles.chartWrap}>
          <StudioChart
            values={
              viewsSliced.values.length
                ? viewsSliced.values
                : Array(range).fill(0)
            }
            days={viewsSliced.days}
            variant="views"
            plotHeight={168}
            showArea
            showAxes
            showLastDot
            xLabelCount={range === 7 ? 4 : 5}
            metricLabel={t("hostStudio.dailyViews", "Daily views")}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.totals}>
          <TotalCell
            label={t("hostStudio.statViewsShort", "Views")}
            value={m.views}
          />
          <TotalCell
            label={t("hostStudio.statSavesShort", "Saves")}
            value={m.saves}
          />
          <TotalCell
            label={t("hostStudio.statLikesShort", "Likes")}
            value={m.likes}
          />
        </View>
        <Text style={styles.totalsHint}>
          {t("hostStudio.allTime", "All time")}
        </Text>

        {preview ? (
          <TouchableOpacity
            style={styles.guideRow}
            onPress={() =>
              navigation.navigate("ListingGuide", { propertySaleId: saleId })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.guideLabel} numberOfLines={1}>
              {t("meskenyGuide.openFull", "Open full guide")}
            </Text>
            <CaretRight size={16} color={studio.muted} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

function TotalCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.totalCell}>
      <Text style={styles.totalValue}>{formatMetricValue(value)}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: studio.bg },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: studio.surface,
  },
  listingText: { flex: 1, marginLeft: 14 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: studio.ink,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  meta: { fontSize: 14, color: studio.muted, marginTop: 4 },
  bigNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -1.5,
    marginTop: 8,
  },
  bigLabel: {
    fontSize: 15,
    color: studio.muted,
    marginTop: 4,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: studio.inkSecondary,
    lineHeight: 19,
    marginBottom: 12,
    backgroundColor: studio.surface,
    padding: 12,
    borderRadius: 10,
  },
  chartWrap: { marginBottom: 8 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: studio.border,
    marginVertical: 24,
  },
  totals: { flexDirection: "row" },
  totalCell: { flex: 1 },
  totalValue: {
    fontSize: 20,
    fontWeight: "600",
    color: studio.ink,
    fontVariant: ["tabular-nums"],
  },
  totalLabel: { fontSize: 13, color: studio.muted, marginTop: 4 },
  totalsHint: { fontSize: 12, color: studio.muted, marginTop: 12 },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: studio.border,
  },
  guideLabel: { fontSize: 16, color: studio.trend, fontWeight: "500" },
  err: {
    margin: 24,
    fontSize: 16,
    color: studio.muted,
    textAlign: "center",
  },
});

export default HostListingStudioScreen;
