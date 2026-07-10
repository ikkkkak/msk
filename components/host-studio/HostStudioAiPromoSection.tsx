import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Sparkle } from "phosphor-react-native";
import { studio } from "./studioTheme";
import { theme } from "../../theme";

const BRAND = theme["color-temporary-primary"] as string;

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Host Studio — subtle Add with AI promo when the host has no listings yet. */
export function HostStudioAiPromoSection({ onPress, style }: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, style]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <Sparkle size={20} color={BRAND} weight="duotone" />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>
            {t("listingAi.promoEyebrow", { defaultValue: "Listing assistant" })}
          </Text>
          <Text style={styles.title}>
            {t("listingAi.promoTitle", { defaultValue: "Add with AI" })}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {t("listingAi.promoSubtitle", {
              defaultValue:
                "Describe your place — we write the title, description, and match your location.",
            })}
          </Text>
          <Text style={styles.cta}>
            {t("listingAi.promoCta", { defaultValue: "Start a listing" })}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: studio.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
  },
  body: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: studio.muted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: studio.ink,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: studio.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  cta: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND,
    marginTop: 10,
  },
});
