import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  ArrowClockwise,
  CheckCircle,
  House,
  X,
  XCircle,
} from "phosphor-react-native";
import type { PublishJob } from "../../services/publishQueue";
import { resolvePublishLabelKey } from "../../utils/publishProgress";

const T = {
  bg: "#FFFFFF",
  surface: "#F0F4FF",
  ink: "#161616",
  inkMid: "#6B6B6B",
  accent: "#2563EB",
  success: "#16A34A",
  error: "#DC2626",
  line: "#E5E7EB",
  track: "#E8ECF4",
};

type Props = {
  jobs: PublishJob[];
  onRetry?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
};

export function PropertySalePublishBanner({
  jobs,
  onRetry,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  const visible = jobs.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "running" ||
      j.status === "completed" ||
      j.status === "failed",
  );
  const activeJobs = visible.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "running" ||
      j.status === "failed",
  );
  const job = visible[0];
  const queueExtra = Math.max(0, activeJobs.length - 1);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: job ? 1 : 0,
      duration: job ? 0 : 180,
      useNativeDriver: true,
    }).start();
  }, [job, fadeAnim]);

  useEffect(() => {
    if (!job) return;
    Animated.timing(barAnim, {
      toValue: job.percent / 100,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [job?.percent, job, barAnim]);

  if (!job) return null;

  const isFailed = job.status === "failed";
  const isDone = job.status === "completed";
  const labelKey = resolvePublishLabelKey(job.stage, job.step);
  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.card,
          isDone && styles.cardSuccess,
          isFailed && styles.cardFailed,
        ]}
      >
        <View style={styles.thumb}>
          {job.previewUri ? (
            <Image source={{ uri: job.previewUri }} style={styles.thumbImg} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <House size={22} weight="fill" color={T.inkMid} />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {isDone
                ? t("organization.publishBanner.success", "Listing created")
                : isFailed
                  ? t("organization.publishFailed", "Failed")
                  : t("organization.publishBanner.title", "Creating listing")}
            </Text>
            {queueExtra > 0 ? (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>+{queueExtra}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.listingTitle} numberOfLines={1}>
            {job.title || t("organization.noTitle", "Untitled listing")}
          </Text>

          <Text style={styles.step} numberOfLines={2}>
            {isDone
              ? t(
                  "organization.publishBanner.successSub",
                  "Your property is ready in your listings",
                )
              : isFailed
                ? job.lastError ||
                  t(
                    "organization.publishFailedSub",
                    "Could not finish — tap Retry",
                  )
                : t(labelKey, "Working…")}
          </Text>

          {!isFailed && !isDone ? (
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { width: barWidth }]} />
            </View>
          ) : null}
        </View>

        <View style={styles.trailing}>
          {isDone ? (
            <CheckCircle size={36} weight="fill" color={T.success} />
          ) : isFailed ? (
            <XCircle size={36} weight="fill" color={T.error} />
          ) : (
            <Text style={styles.percent}>{job.percent}%</Text>
          )}
        </View>
      </View>

      {isFailed && onRetry ? (
        <TouchableOpacity
          style={styles.retryRow}
          onPress={() => onRetry(job.id)}
          activeOpacity={0.85}
        >
          <ArrowClockwise size={16} weight="bold" color={T.accent} />
          <Text style={styles.retryText}>
            {t("organization.publishRetry", "Retry")}
          </Text>
          {onDismiss ? (
            <TouchableOpacity
              onPress={() => onDismiss(job.id)}
              hitSlop={10}
              style={styles.dismissInline}
            >
              <X size={16} weight="bold" color={T.inkMid} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: T.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.line,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: T.line,
  },
  cardSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  cardFailed: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: T.bg,
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: T.ink,
    flex: 1,
  },
  queueBadge: {
    backgroundColor: T.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  queueBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  listingTitle: { fontSize: 14, fontWeight: "600", color: T.ink },
  step: { fontSize: 12, color: T.inkMid, lineHeight: 16 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: T.track,
    marginTop: 6,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: T.accent,
  },
  trailing: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontSize: 20,
    fontWeight: "800",
    color: T.ink,
    letterSpacing: -0.5,
  },
  retryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: T.accent, flex: 1 },
  dismissInline: { padding: 4 },
});
