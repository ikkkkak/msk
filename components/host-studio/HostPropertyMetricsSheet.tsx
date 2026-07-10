import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Sparkle } from "phosphor-react-native";
import type { HostStudioListing } from "../../hooks/queries/useHostStudioQuery";
import { StudioChart } from "./StudioChart";
import { TikTokMetricCard } from "./TikTokMetricCard";
import { studio } from "./studioTheme";
import { buildDefaultDays } from "./chartDateUtils";
import {
  periodDelta,
  sliceTrend,
  type StudioRangeDays,
} from "./studioTrendUtils";

const { height: SH } = Dimensions.get("window");

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  listing: HostStudioListing | null;
  range: StudioRangeDays;
  onClose: () => void;
};

export function HostPropertyMetricsSheet({
  sheetRef,
  listing,
  range,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const snapPoints = useMemo(() => ["55%", "85%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
      />
    ),
    [],
  );

  if (!listing) return null;

  const m = listing.metrics;
  const trendDays =
    listing.trend?.days?.length === listing.trend?.views?.length
      ? listing.trend.days
      : buildDefaultDays(14);

  const viewsValues = listing.trend?.views ?? [];
  const savesValues = listing.trend?.saves ?? [];
  const likesValues = listing.trend?.likes ?? [];

  const viewsSliced = sliceTrend(viewsValues, trendDays, range);
  const savesSliced = sliceTrend(savesValues, trendDays, range);
  const likesSliced = sliceTrend(likesValues, trendDays, range);

  const viewsDelta = periodDelta(viewsValues, range);
  const savesDelta = periodDelta(savesValues, range);
  const likesDelta = periodDelta(likesValues, range);

  const weekViews = viewsSliced.values.reduce((a, b) => a + b, 0);
  const tip =
    weekViews >= 20
      ? t("hostStudio.hypeHot", "Strong interest this week — keep your listing fresh.")
      : weekViews >= 5
        ? t("hostStudio.hypeWarm", "Steady activity. Photos and videos help you stand out.")
        : t("hostStudio.hypeStart", "Share your listing to reach more guests.");

  const trends = [
    {
      label: t("hostStudio.views", "Views"),
      values: viewsSliced.values,
      days: viewsSliced.days,
      metricKey: "dailyViews",
    },
    {
      label: t("hostStudio.saves", "Saves"),
      values: savesSliced.values,
      days: savesSliced.days,
      metricKey: "dailySaves",
    },
    {
      label: t("hostStudio.likes", "Likes"),
      values: likesSliced.values,
      days: likesSliced.days,
      metricKey: "dailyLikes",
    },
  ];

  const rangeLabel =
    range === 7
      ? t("hostStudio.range7", "7 days")
      : t("hostStudio.range14", "14 days");

  const openGuide = () => {
    onClose();
    sheetRef.current?.dismiss();
    navigation.navigate("ListingGuide", { propertySaleId: listing.id });
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{
            uri: listing.image_url || "https://via.placeholder.com/400x200",
          }}
          style={styles.hero}
        />
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>
          {listing.kind === "rent"
            ? t("hostStudio.kindRent", "Rent")
            : t("hostStudio.kindSale", "For sale")}
          {listing.city ? ` · ${listing.city}` : ""}
        </Text>

        <Text style={styles.tip}>{tip}</Text>

        {listing.kind === "sale" ? (
          <TouchableOpacity
            style={styles.guideBtn}
            activeOpacity={0.85}
            onPress={openGuide}
          >
            <Sparkle size={18} color={studio.ink} weight="fill" />
            <View style={styles.guideBtnTextWrap}>
              <Text style={styles.guideBtnText}>
                {t("meskenyGuide.tabTitle", "Guide")}
              </Text>
              <Text style={styles.guideBtnSub}>
                {t(
                  "meskenyGuide.sheetHint",
                  "AI performance notes for this listing",
                )}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <TikTokMetricCard
              label={t("hostStudio.views", "Views")}
              value={m.views}
              delta={viewsDelta.delta}
              pct={viewsDelta.pct}
            />
            <View style={styles.gap} />
            <TikTokMetricCard
              label={t("hostStudio.saves", "Saves")}
              value={m.saves}
              delta={savesDelta.delta}
              pct={savesDelta.pct}
            />
          </View>
          <View style={styles.gridRow}>
            <TikTokMetricCard
              label={t("hostStudio.likes", "Likes")}
              value={m.likes}
              delta={likesDelta.delta}
              pct={likesDelta.pct}
            />
            {typeof m.comments === "number" ? (
              <>
                <View style={styles.gap} />
                <TikTokMetricCard
                  label={t("hostStudio.comments", "Comments")}
                  value={m.comments}
                />
              </>
            ) : null}
          </View>
        </View>

        {typeof m.reservations === "number" && m.reservations > 0 ? (
          <Text style={styles.resNote}>
            {t("hostStudio.reservations", "{{count}} active reservation requests", {
              count: m.reservations,
            })}
          </Text>
        ) : null}

        <Text style={styles.sectionLabel}>
          {t("hostStudio.periodTrends", "Trends · {{range}}", { range: rangeLabel })}
        </Text>

        <View style={styles.trendsCard}>
          {trends.map((row, i) => (
            <View
              key={row.label}
              style={[styles.trendRow, i < trends.length - 1 && styles.trendRowBorder]}
            >
              <View style={styles.trendHead}>
                <Text style={styles.trendLabel}>{row.label}</Text>
                <Text style={styles.trendTotal}>
                  {row.values.reduce((a, b) => a + b, 0).toLocaleString()}
                </Text>
              </View>
              <StudioChart
                values={row.values.length ? row.values : Array(range).fill(0)}
                days={row.days}
                variant="listing"
                plotHeight={72}
                showArea
                showAxes
                xLabelCount={range === 7 ? 4 : 5}
                metricLabel={t(`hostStudio.${row.metricKey}`, row.label)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          {t(
            "hostStudio.footnote",
            "Guest interest on your listing. Internal analytics stay with Meskeny.",
          )}
        </Text>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: studio.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    backgroundColor: studio.border,
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  hero: {
    width: "100%",
    height: Math.min(160, SH * 0.22),
    borderRadius: 10,
    backgroundColor: studio.surface,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 14,
    color: studio.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: studio.inkSecondary,
    marginBottom: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: studio.trend,
  },
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: studio.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    marginBottom: 20,
  },
  guideBtnTextWrap: { flex: 1 },
  guideBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: studio.ink,
  },
  guideBtnSub: {
    fontSize: 12,
    color: studio.muted,
    marginTop: 2,
  },
  grid: {
    gap: 10,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: "row",
  },
  gap: {
    width: 10,
  },
  resNote: {
    fontSize: 13,
    color: studio.trendMuted,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.inkSecondary,
    marginBottom: 10,
  },
  trendsCard: {
    backgroundColor: studio.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  trendRow: {
    paddingVertical: 12,
  },
  trendRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: studio.border,
  },
  trendHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.ink,
  },
  trendTotal: {
    fontSize: 13,
    color: studio.muted,
  },
  footnote: {
    fontSize: 12,
    color: studio.muted,
    lineHeight: 18,
    textAlign: "center",
  },
});
