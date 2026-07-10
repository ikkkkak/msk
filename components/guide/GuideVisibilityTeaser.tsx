import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { CaretRight } from "phosphor-react-native";
import type { ListingGuidePreview } from "../../hooks/queries/useMeskenyGuide";
import { HandwrittenLetterReveal } from "./HandwrittenLetterReveal";

type Props = {
  propertyTitle: string;
  preview: ListingGuidePreview;
  onPress: () => void;
};

/** Minimal plot-card style tip — typewriter reveal when the screen is opened. */
export function GuideVisibilityTeaser({
  propertyTitle,
  preview,
  onPress,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar") || I18nManager.isRTL;
  const tip = (preview.diagnosis || "").trim();
  const [animateKey, setAnimateKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setAnimateKey((k) => k + 1);
    }, []),
  );

  if (!tip) return null;

  const title =
    propertyTitle && !propertyTitle.startsWith("#")
      ? propertyTitle
      : t("meskenyGuide.listing", "your listing");

  const isUnread = preview.status === "unread";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.94}
    >
      <View style={[styles.headerRow, isRTL && styles.rowRtl]}>
        <Text style={[styles.eyebrow, isRTL && styles.rtlText]}>
          {t("meskenyGuide.visibilityEyebrow", "AI visibility tip")}
        </Text>
        {isUnread ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>
              {t("meskenyGuide.unreadBadge", "Unread")}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.headline, isRTL && styles.rtlText]} numberOfLines={2}>
        {t("meskenyGuide.visibilityHeadline", "Get more eyes on «{{title}}»", {
          title,
        })}
      </Text>

      <View style={styles.divider} />

      <HandwrittenLetterReveal
        key={animateKey}
        text={tip}
        maxReveal={120}
        style={styles.letterBody}
      />

      <Text style={[styles.hook, isRTL && styles.rtlText]}>
        {t(
          "meskenyGuide.visibilityHook",
          "Your AI analyst found a change that can improve how often buyers see this listing.",
        )}
      </Text>

      <View style={[styles.ctaRow, isRTL && styles.rowRtl]}>
        <Text style={styles.cta}>
          {t("meskenyGuide.visibilityCta", "See how to improve visibility")}
        </Text>
        <CaretRight
          size={14}
          color="#008489"
          weight="bold"
          style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C8C8C8",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#008489",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#BFDBFE",
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.3,
  },
  headline: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 21,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  letterBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  hook: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 10,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  cta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#008489",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
