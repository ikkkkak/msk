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
import { guideTheme as G } from "./guideTheme";
import type { ListingGuidePreview } from "../../hooks/queries/useMeskenyGuide";

type Props = {
  propertyTitle: string;
  preview: ListingGuidePreview;
  onPress: () => void;
  /** Smaller inline variant for property cards */
  compact?: boolean;
};

export function GuideTipStrip({
  propertyTitle,
  preview,
  onPress,
  compact,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar") || I18nManager.isRTL;

  const tip = (preview.diagnosis || "").trim();
  if (!tip) return null;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compact, isRTL && styles.rtl]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <Sparkle size={14} color={G.accent} weight="fill" />
        <Text style={styles.compactText} numberOfLines={2}>
          {tip}
        </Text>
        <CaretRight
          size={14}
          color={G.muted}
          style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.wrap, isRTL && styles.rtl]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.iconWrap}>
        <Sparkle size={18} color={G.accent} weight="fill" />
      </View>
      <View style={styles.body}>
        <Text style={[styles.kicker, isRTL && styles.rtlText]}>
          {t("meskenyGuide.tipKicker", "Tip for your listing")}
        </Text>
        <Text style={[styles.property, isRTL && styles.rtlText]} numberOfLines={1}>
          {propertyTitle}
        </Text>
        <Text style={[styles.tip, isRTL && styles.rtlText]} numberOfLines={2}>
          {tip}
        </Text>
        <Text style={[styles.footer, isRTL && styles.rtlText]}>
          {t(
            "meskenyGuide.tipFooter",
            "From your personal AI listing guide — tap to read more",
          )}
        </Text>
      </View>
      <CaretRight
        size={18}
        color={G.muted}
        style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: G.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C5E8EA",
  },
  rtl: {
    flexDirection: "row-reverse",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: G.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: G.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  property: {
    fontSize: 15,
    fontWeight: "600",
    color: G.ink,
    marginTop: 2,
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: G.inkSoft,
    marginTop: 6,
  },
  footer: {
    fontSize: 12,
    color: G.muted,
    marginTop: 8,
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: G.accentSoft,
  },
  compactText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: G.inkSoft,
  },
});
