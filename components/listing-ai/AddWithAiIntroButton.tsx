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
import { CaretRight, Sparkle } from "phosphor-react-native";
import { theme } from "../../theme";

const BRAND = theme["color-temporary-primary"] as string;

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Persistent CTA — pinned at top of manual listing wizards. */
export function AddWithAiIntroButton({ onPress, style }: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.wrap, style]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
    >
      <View style={styles.icon}>
        <Sparkle size={20} color={BRAND} weight="duotone" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>
          {t("listingAi.introCtaTitle", {
            defaultValue: "Add with AI",
          })}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {t("listingAi.introCtaSubtitle", {
            defaultValue:
              "Win ~70% of your time — we write title, description & location",
          })}
        </Text>
      </View>
      <CaretRight size={18} color={BRAND} weight="bold" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFF4ED",
    gap: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(209, 96, 36, 0.2)",
  },
  textCol: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
    lineHeight: 16,
  },
});
