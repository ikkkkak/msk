import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  Eye,
  Heart,
  BookmarkSimple,
  ChatCircle,
  Play,
  CaretRight,
  VideoCamera,
} from "phosphor-react-native";
import type { HostStudioVideo } from "../../hooks/queries/useHostStudioQuery";
import { studio } from "./studioTheme";
import { formatMetricValue } from "./studioTrendUtils";

const THUMB_W = 52;
const THUMB_H = 88;

type Props = {
  video: HostStudioVideo;
  onPress: () => void;
  /** Hidden when list is already filtered by rent/sale tab. */
  showKind?: boolean;
};

export function HostStudioVideoCard({
  video,
  onPress,
  showKind = false,
}: Props) {
  const { t } = useTranslation();
  const m = video.metrics;
  const thumb = video.thumbnail_url?.trim();
  const hasThumb = Boolean(thumb);
  const status = (video.status ?? "").toLowerCase();
  const isLive =
    status === "approved" || status === "active" || status === "published";

  const title =
    video.caption?.trim() ||
    video.listing_title?.trim() ||
    t("hostStudio.untitled", "Video");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.thumbCol}>
        {hasThumb ? (
          <Image
            source={{ uri: thumb }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <VideoCamera size={24} color={studio.muted} weight="duotone" />
          </View>
        )}
        <View style={styles.thumbOverlay}>
          <View style={styles.playCircle}>
            <Play size={16} color="#FFFFFF" weight="fill" />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {video.listing_title && video.caption?.trim() ? (
              <Text style={styles.listing} numberOfLines={1}>
                {video.listing_title}
              </Text>
            ) : null}
          </View>
          <CaretRight size={16} color={studio.muted} weight="bold" />
        </View>

        <View style={styles.metaRow}>
          {showKind ? (
            <Text style={styles.kind}>
              {video.kind === "rent"
                ? t("hostStudio.kindRent", "Rent")
                : t("hostStudio.kindSale", "For sale")}
            </Text>
          ) : null}
          {isLive ? (
            <View style={styles.liveDot}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>
                {t("hostStudio.statusLive", "Live")}
              </Text>
            </View>
          ) : status ? (
            <Text style={styles.statusMuted}>
              {t(`organization.propertyStatus.${status}`, status, {
                defaultValue: status,
              })}
            </Text>
          ) : null}
        </View>

        <View style={styles.metricsBar}>
          <MetricCell
            value={m.views}
            label={t("hostStudio.views", "Views")}
            primary
          />
          <MetricCell value={m.likes} label={t("hostStudio.likes", "Likes")} />
          <MetricCell value={m.saves} label={t("hostStudio.saves", "Saves")} />
          <MetricCell
            value={m.comments ?? 0}
            label={t("hostStudio.comments", "Comments")}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetricCell({
  value,
  label,
  primary,
}: {
  value: number;
  label: string;
  primary?: boolean;
}) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricValue, primary && styles.metricValuePrimary]}>
        {formatMetricValue(value)}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: studio.cardLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  thumbCol: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: studio.surface,
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
  },
  thumbEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    marginLeft: 12,
    minHeight: THUMB_H,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: studio.ink,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  listing: {
    fontSize: 12,
    color: studio.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    minHeight: 18,
  },
  kind: {
    fontSize: 11,
    fontWeight: "600",
    color: studio.inkSecondary,
  },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  liveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#15803D",
  },
  statusMuted: {
    fontSize: 11,
    fontWeight: "500",
    color: studio.muted,
    textTransform: "capitalize",
  },
  metricsBar: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: studio.border,
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: studio.inkSecondary,
    fontVariant: ["tabular-nums"],
  },
  metricValuePrimary: {
    fontSize: 16,
    color: studio.ink,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: studio.muted,
    marginTop: 2,
  },
});
