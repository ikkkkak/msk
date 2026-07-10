import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  EMPTY_HOST_STUDIO_SUMMARY,
  type HostStudioData,
} from "../../hooks/queries/useHostStudioQuery";
import { StudioChart } from "./StudioChart";
import { StudioTimeRange } from "./StudioTimeRange";
import { TikTokMetricCard } from "./TikTokMetricCard";
import { studio } from "./studioTheme";
import {
  periodDelta,
  sliceTrend,
  type StudioRangeDays,
} from "./studioTrendUtils";
import { buildDefaultDays } from "./chartDateUtils";

type Props = {
  summary?: HostStudioData["summary"] | null;
  range: StudioRangeDays;
  onRangeChange: (r: StudioRangeDays) => void;
};

export function HostStudioSummary({ summary, range, onRangeChange }: Props) {
  const { t } = useTranslation();
  const s = summary ?? EMPTY_HOST_STUDIO_SUMMARY;
  const trendViews = s.trend?.views ?? [];
  const days =
    s.trend?.days?.length === trendViews.length
      ? s.trend.days
      : buildDefaultDays(trendViews.length || 14);

  const sliced = useMemo(
    () => sliceTrend(trendViews, days, range),
    [trendViews, days, range],
  );
  const viewsDelta = useMemo(
    () => periodDelta(trendViews, range),
    [trendViews, range],
  );

  return (
    <View style={styles.wrap}>
      <StudioTimeRange value={range} onChange={onRangeChange} />

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {t("hostStudio.videoViews", "Listing views")}
        </Text>
        <StudioChart
          values={sliced.values.length ? sliced.values : Array(range).fill(0)}
          days={sliced.days}
          variant="listing"
          plotHeight={120}
          showArea
          showAxes
          xLabelCount={range === 7 ? 4 : 5}
          metricLabel={t("hostStudio.dailyViews", "Daily views")}
        />
      </View>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <TikTokMetricCard
            label={t("hostStudio.views", "Views")}
            value={s.total_views}
            delta={viewsDelta.delta}
            pct={viewsDelta.pct}
          />
          <View style={styles.gap} />
          <TikTokMetricCard
            label={t("hostStudio.saves", "Saves")}
            value={s.total_saves}
          />
        </View>
        <View style={styles.gridRow}>
          <TikTokMetricCard
            label={t("hostStudio.likes", "Likes")}
            value={s.total_likes}
          />
          <View style={styles.gap} />
          <TikTokMetricCard
            label={t("hostStudio.listings", "Listings")}
            value={s.active_listings}
          />
        </View>
      </View>

      {s.pending_reservations > 0 ? (
        <Text style={styles.note}>
          {t("hostStudio.pendingRes", "{{count}} reservation requests waiting", {
            count: s.pending_reservations,
          })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  chartCard: {
    backgroundColor: studio.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: studio.ink,
    marginBottom: 12,
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
  },
  gap: {
    width: 10,
  },
  note: {
    marginTop: 14,
    fontSize: 13,
    color: studio.trendMuted,
    textAlign: "center",
  },
});
