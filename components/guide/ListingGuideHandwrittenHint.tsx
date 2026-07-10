import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Sparkle, CaretRight } from "phosphor-react-native";
import type { ListingGuidePreview } from "../../hooks/queries/useMeskenyGuide";
import { HandwrittenLetterReveal } from "./HandwrittenLetterReveal";

const NOTE = {
  bg: "#FFFDF8",
  border: "#E5D9C3",
  ink: "#2C2416",
  line: "#C4B59A",
  accent: "#008489",
  urgent: "#B91C1C",
  action: "#B45309",
};

type Props = {
  preview: ListingGuidePreview;
  compact?: boolean;
  onPress: () => void;
  onViewMore?: () => void;
};

export function ListingGuideHandwrittenHint({
  preview,
  compact,
  onPress,
  onViewMore,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar") || I18nManager.isRTL;

  const severityColor =
    preview.severity === "urgent"
      ? NOTE.urgent
      : preview.severity === "action"
        ? NOTE.action
        : NOTE.accent;

  const unread = preview.status === "unread";

  const severityPlain =
    preview.severity === "urgent"
      ? t("meskenyGuide.plainUrgent", "Needs your attention")
      : preview.severity === "action"
        ? t("meskenyGuide.plainAction", "Suggested improvement")
        : t("meskenyGuide.plainInfo", "Helpful note");

  return (
    <TouchableOpacity
      style={[
        styles.wrap,
        unread && styles.wrapUnread,
        compact && styles.wrapCompact,
        isRTL && styles.wrapRtl,
      ]}
      onPress={onPress}
      activeOpacity={0.94}
    >
      <View style={[styles.rule, isRTL && styles.ruleRtl]} />
      <Text style={[styles.salutation, isRTL && styles.rtlText]}>
        {t("meskenyGuide.dearHost", "Dear host,")}
      </Text>
      <View style={styles.header}>
        <Sparkle size={13} color={severityColor} weight="fill" />
        <Text style={[styles.badge, { color: severityColor }]}>
          {t("meskenyGuide.handwrittenBadge", "Meskeny Guide")}
        </Text>
        {unread ? <View style={styles.dot} /> : null}
      </View>
      <Text style={[styles.severityPlain, isRTL && styles.rtlText]}>
        {severityPlain}
      </Text>

      <HandwrittenLetterReveal
        text={preview.diagnosis}
        maxReveal={compact ? 72 : 100}
      />

      <View style={[styles.footer, isRTL && styles.footerRtl]}>
        <Text style={[styles.signoff, isRTL && styles.rtlText]}>
          {t("meskenyGuide.signoff", "— Your Meskeny analyst")}
        </Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            (onViewMore ?? onPress)();
          }}
          hitSlop={10}
        >
          <View style={styles.moreRow}>
            <Text style={styles.moreText}>
              {t("meskenyGuide.readFullLetter", "Read full letter")}
            </Text>
            <CaretRight
              size={12}
              color={NOTE.accent}
              style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
            />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: NOTE.bg,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: NOTE.border,
    shadowColor: "#2C2416",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 1, height: 3 },
    elevation: 2,
  },
  wrapUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#2563EB",
  },
  wrapCompact: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  wrapRtl: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: "#2563EB",
  },
  rule: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    backgroundColor: NOTE.line,
  },
  ruleRtl: {
    left: undefined,
    right: 0,
  },
  salutation: {
    fontSize: 13,
    color: NOTE.ink,
    opacity: 0.65,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },
  severityPlain: {
    fontSize: 12,
    fontWeight: "600",
    color: NOTE.ink,
    marginBottom: 10,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  footerRtl: {
    flexDirection: "row-reverse",
  },
  signoff: {
    fontSize: 11,
    color: NOTE.ink,
    opacity: 0.5,
    fontStyle: "italic",
    flex: 1,
  },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  moreText: {
    fontSize: 13,
    fontWeight: "600",
    color: NOTE.accent,
  },
});
