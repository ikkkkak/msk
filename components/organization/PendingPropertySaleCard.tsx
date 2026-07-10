import React from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { House, ArrowClockwise, X } from "phosphor-react-native";
import { PublishRingProgress } from "../PublishRingProgress";
import type { PublishJob } from "../../services/publishQueue";
import { publishStageLabelKey } from "../../utils/publishProgress";

const T = {
  bg: "#FFFFFF",
  surface: "#F5F5F5",
  ink: "#161616",
  inkMid: "#6B6B6B",
  inkLight: "#9CA3AF",
  accent: "#2563EB",
  warn: "#D97706",
  error: "#DC2626",
  line: "#E8E8E8",
  r12: 12,
};

type Props = {
  job: PublishJob;
  index?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
  anim?: Animated.Value;
};

export function PendingPropertySaleCard({
  job,
  index = 0,
  onRetry,
  onDismiss,
  anim,
}: Props) {
  const { t } = useTranslation();
  const isFailed = job.status === "failed";
  const isDone = job.status === "completed";
  const stageKey = publishStageLabelKey(job.stage);

  const wrapperStyle = anim
    ? { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }
    : undefined;

  return (
    <Animated.View style={[styles.card, wrapperStyle]}>
      <View style={styles.thumb}>
        {job.previewUri ? (
          <Image source={{ uri: job.previewUri }} style={styles.thumbImg} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <House size={20} weight="fill" color={T.inkLight} />
          </View>
        )}
        <View
          style={[
            styles.badge,
            isFailed && styles.badgeFailed,
            isDone && styles.badgeDone,
          ]}
        >
          <Text style={styles.badgeText}>
            {isFailed
              ? t("organization.publishFailed", "Failed")
              : isDone
                ? t("organization.publishDone", "Published")
                : t("organization.publishing", "Publishing…")}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {job.title || t("organization.noTitle", "Untitled listing")}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {isFailed
            ? job.lastError || t("organization.publishFailedSub", "Tap to retry")
            : t(stageKey, "Working…")}
        </Text>
        {job.city ? (
          <Text style={styles.city} numberOfLines={1}>
            {job.city}
          </Text>
        ) : null}
        {typeof job.price === "number" && job.price > 0 ? (
          <Text style={styles.price}>
            {job.price.toLocaleString()}{" "}
            <Text style={styles.priceSub}>MRU</Text>
          </Text>
        ) : null}
        {isFailed && onRetry ? (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <ArrowClockwise size={14} color={T.accent} weight="bold" />
            <Text style={styles.retryText}>
              {t("organization.publishRetry", "Retry")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.ringWrap}>
        <PublishRingProgress
          percent={job.percent}
          size={56}
          strokeWidth={5}
          trackColor="#E8E8E8"
          progressColor={isFailed ? T.error : isDone ? "#16A34A" : T.ink}
          textColor={T.ink}
        />
        {isFailed && onDismiss ? (
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={8}>
            <X size={14} color={T.inkMid} weight="bold" />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.bg,
    borderRadius: T.r12,
    borderWidth: 1,
    borderColor: T.line,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: T.surface,
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: "rgba(22,22,22,0.82)",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  badgeFailed: { backgroundColor: "rgba(220,38,38,0.9)" },
  badgeDone: { backgroundColor: "rgba(22,163,74,0.9)" },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  info: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 15, fontWeight: "600", color: T.ink },
  sub: { fontSize: 12, color: T.inkMid, lineHeight: 16 },
  city: { fontSize: 12, color: T.inkLight },
  price: { fontSize: 14, fontWeight: "700", color: T.ink, marginTop: 2 },
  priceSub: { fontSize: 11, fontWeight: "500", color: T.inkMid },
  ringWrap: { alignItems: "center", justifyContent: "center", width: 64 },
  dismissBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: T.line,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  retryText: { fontSize: 13, fontWeight: "600", color: T.accent },
});
