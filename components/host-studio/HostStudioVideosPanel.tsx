import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  HostStudioVideo,
  HostStudioVideoSummary,
} from "../../hooks/queries/useHostStudioQuery";
import { HostStudioVideoSegment, type VideoSegment } from "./HostStudioVideoSegment";
import { HostStudioVideosList } from "./HostStudioVideosList";
import { TikTokMetricCard } from "./TikTokMetricCard";
import { studio } from "./studioTheme";

type Props = {
  videos: HostStudioVideo[];
  videoSummary?: HostStudioVideoSummary;
  onPressVideo: (video: HostStudioVideo) => void;
};

function sumFromVideos(items: HostStudioVideo[]) {
  return items.reduce(
    (acc, v) => ({
      views: acc.views + (v.metrics.views ?? 0),
      likes: acc.likes + (v.metrics.likes ?? 0),
      saves: acc.saves + (v.metrics.saves ?? 0),
      comments: acc.comments + (v.metrics.comments ?? 0),
    }),
    { views: 0, likes: 0, saves: 0, comments: 0 },
  );
}

export function HostStudioVideosPanel({
  videos,
  videoSummary,
  onPressVideo,
}: Props) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<VideoSegment>("rent");

  const rentVideos = useMemo(
    () => videos.filter((v) => v.kind === "rent"),
    [videos],
  );
  const saleVideos = useMemo(
    () => videos.filter((v) => v.kind === "sale"),
    [videos],
  );
  const filtered = kind === "rent" ? rentVideos : saleVideos;

  const totals = useMemo(() => {
    const fromList = sumFromVideos(filtered);
    if (videoSummary) {
      if (kind === "rent") {
        return {
          count: videoSummary.rent_count,
          views: videoSummary.rent_views,
          likes: videoSummary.rent_likes,
          saves: fromList.saves,
          comments: fromList.comments,
        };
      }
      return {
        count: videoSummary.sale_count,
        views: videoSummary.sale_views,
        likes: videoSummary.sale_likes,
        saves: fromList.saves,
        comments: fromList.comments,
      };
    }
    return { count: filtered.length, ...fromList };
  }, [kind, videoSummary, filtered]);

  const sectionTitle =
    kind === "rent"
      ? t("hostStudio.videosRentTitle", "Rental videos")
      : t("hostStudio.videosSaleTitle", "For-sale videos");

  return (
    <View style={styles.wrap}>
      <Text style={styles.pageTitle}>
        {t("hostStudio.videosPageTitle", "Video analytics")}
      </Text>
      <Text style={styles.pageSub}>
        {t(
          "hostStudio.videosPageSub",
          "Reach and engagement from your listing videos.",
        )}
      </Text>

      <HostStudioVideoSegment
        value={kind}
        onChange={setKind}
        tabs={[
          {
            key: "rent",
            label: t("hostStudio.subTabRent", "Rent"),
            count: rentVideos.length,
          },
          {
            key: "sale",
            label: t("hostStudio.subTabBuy", "For sale"),
            count: saleVideos.length,
          },
        ]}
      />

      <View style={styles.metricsBlock}>
        <Text style={styles.blockLabel}>{sectionTitle}</Text>
        <View style={styles.metricsRow}>
          <TikTokMetricCard
            label={t("hostStudio.views", "Views")}
            value={totals.views}
          />
          <View style={styles.metricGap} />
          <TikTokMetricCard
            label={t("hostStudio.likes", "Likes")}
            value={totals.likes}
          />
        </View>
        <View style={styles.metricsRow}>
          <TikTokMetricCard
            label={t("hostStudio.saves", "Saves")}
            value={totals.saves}
          />
          <View style={styles.metricGap} />
          <TikTokMetricCard
            label={t("hostStudio.comments", "Comments")}
            value={totals.comments}
          />
        </View>
        {totals.count > 0 ? (
          <Text style={styles.footnote}>
            {t("hostStudio.videosFootnote", {
              count: totals.count,
              defaultValue: "{{count}} videos in this category · all-time totals",
            })}
          </Text>
        ) : null}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {t("hostStudio.videosListTitle", "All videos")}
        </Text>
        <Text style={styles.listCount}>{filtered.length}</Text>
      </View>

      <HostStudioVideosList
        videos={filtered}
        kind={kind}
        onPressVideo={onPressVideo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: studio.ink,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 13,
    color: studio.muted,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  metricsBlock: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.inkSecondary,
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  metricGap: {
    width: 10,
  },
  footnote: {
    fontSize: 12,
    color: studio.muted,
    marginTop: 4,
    lineHeight: 17,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: studio.ink,
  },
  listCount: {
    fontSize: 13,
    fontWeight: "600",
    color: studio.muted,
    fontVariant: ["tabular-nums"],
  },
});
