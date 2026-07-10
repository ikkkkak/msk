import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  EMPTY_HOST_STUDIO_SUMMARY,
  type HostStudioData
} from "../../hooks/queries/useHostStudioQuery";
import { StudioChart } from "./StudioChart";
import { StudioTimeRange } from "./StudioTimeRange";
import { studio } from "./studioTheme";
import {
  periodDelta,
  sliceTrend,
  type StudioRangeDays
} from "./studioTrendUtils";
import { buildDefaultDays } from "./chartDateUtils";

type Props = {
  summary?: HostStudioData["summary"] | null;
  range: StudioRangeDays;
  onRangeChange: (r: StudioRangeDays) => void;
};

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function PlainStat({
  label,
  value,
  hint,
  deltaPct
}: {
  label: string;
  value: number;
  hint: string;
  deltaPct?: number | null;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value}>{formatBig(value)}</Text>
      <Text style={statStyles.hint}>{hint}</Text>
      {deltaPct != null && !Number.isNaN(deltaPct) ? (
        <Text
          style={[
            statStyles.delta,
            deltaPct >= 0 ? statStyles.deltaUp : statStyles.deltaDown
          ]}
        >
          {deltaPct >= 0 ? "↑" : "↓"} {Math.abs(Math.round(deltaPct))}%
        </Text>
      ) : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: studio.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    minHeight: 100
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: studio.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -0.5,
    marginTop: 6
  },
  hint: {
    fontSize: 12,
    color: studio.inkSecondary,
    marginTop: 4,
    lineHeight: 16
  },
  delta: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6
  },
  deltaUp: { color: "#059669" },
  deltaDown: { color: "#DC2626" }
});

export function HostStudioOverviewPanel({
  summary,
  range,
  onRangeChange
}: Props) {
  const { t } = useTranslation();
  const s = summary ?? EMPTY_HOST_STUDIO_SUMMARY;
  const trendViews = s.trend?.views ?? [];
  const days =
    s.trend?.days?.length === trendViews.length
      ? s.trend.days
      : buildDefaultDays(trendViews.length || 14);

  const sliced = useMemo(
    () => sliceTrend(trendViews, days, range),
    [trendViews, days, range]
  );
  const viewsDelta = useMemo(
    () => periodDelta(trendViews, range),
    [trendViews, range]
  );

  const periodTotal = sliced.values.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {t("hostStudio.summaryTitle", "Your reach")}
      </Text>
      <Text style={styles.sub}>
        {t(
          "hostStudio.summarySubPlain",
          "A simple picture of how people interact with your listings."
        )}
      </Text>

      <StudioTimeRange value={range} onChange={onRangeChange} />

      <View style={styles.heroChart}>
        <View style={styles.heroHead}>
          <Text style={styles.heroLabel}>
            {t("hostStudio.chartMainTitle", "People viewing your listings")}
          </Text>
          <Text style={styles.heroNumber}>{formatBig(periodTotal)}</Text>
          <Text style={styles.heroSub}>
            {range === 7
              ? t("hostStudio.chartMainSub7", "Total views in the last 7 days")
              : t(
                  "hostStudio.chartMainSub14",
                  "Total views in the last 14 days"
                )}
          </Text>
        </View>
        <StudioChart
          values={sliced.values.length ? sliced.values : Array(range).fill(0)}
          days={sliced.days}
          variant="views"
          plotHeight={160}
          showArea
          showAxes
          showLastDot
          xLabelCount={range === 7 ? 4 : 5}
          metricLabel={t("hostStudio.dailyViews", "Views per day")}
        />
        <Text style={styles.chartFoot}>
          {t(
            "hostStudio.chartFootnote",
            "Higher lines mean more people saw your listings that day."
          )}
        </Text>
      </View>

      <View style={styles.statRow}>
        <PlainStat
          label={t("hostStudio.statViewsShort", "Views")}
          value={s.total_views}
          hint={t("hostStudio.statViewsHint", "All time")}
          deltaPct={viewsDelta.pct}
        />
        <View style={styles.statGap} />
        <PlainStat
          label={t("hostStudio.statSavesShort", "Saves")}
          value={s.total_saves}
          hint={t("hostStudio.statSavesHint", "Saved to revisit")}
        />
      </View>
      <View style={[styles.statRow, { marginTop: 10 }]}>
        <PlainStat
          label={t("hostStudio.statLikesShort", "Likes")}
          value={s.total_likes}
          hint={t("hostStudio.statLikesHint", "Showed interest")}
        />
        <View style={styles.statGap} />
        <PlainStat
          label={t("hostStudio.statListingsShort", "Live")}
          value={s.active_listings}
          hint={t("hostStudio.statListingsHint", "Active listings")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -0.4
  },
  sub: {
    fontSize: 14,
    color: studio.muted,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 20
  },
  heroChart: {
    backgroundColor: studio.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    marginBottom: 14
  },
  heroHead: {
    marginBottom: 12
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.inkSecondary
  },
  heroNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -1,
    marginTop: 4
  },
  heroSub: {
    fontSize: 13,
    color: studio.muted,
    marginTop: 2
  },
  chartFoot: {
    fontSize: 12,
    color: studio.muted,
    marginTop: 12,
    lineHeight: 17,
    textAlign: "center"
  },
  statRow: {
    flexDirection: "row"
  },
  statGap: {
    width: 10
  }
});
