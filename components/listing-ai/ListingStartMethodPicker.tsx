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
import { CaretRight, PencilSimple, Sparkle } from "phosphor-react-native";
import { theme } from "../../theme";

const BRAND = theme["color-temporary-primary"] as string;

type Props = {
  headline?: string;
  body?: string;
  onAiPress: () => void;
  onManualPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Step 1 — choose AI-assisted listing or manual wizard. */
export function ListingStartMethodPicker({
  headline,
  body,
  onAiPress,
  onManualPress,
  style,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, style]}>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}
      {body ? <Text style={styles.body}>{body}</Text> : null}

      <Text style={styles.prompt}>
        {t("listingAi.startMethodPrompt", {
          defaultValue: "How would you like to create your listing?",
        })}
      </Text>

      <TouchableOpacity
        style={[styles.option, styles.optionAi]}
        onPress={onAiPress}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <View style={[styles.optionIcon, styles.optionIconAi]}>
          <Sparkle size={24} color={BRAND} weight="duotone" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>
            {t("listingAi.startMethodAiTitle", { defaultValue: "Add with AI" })}
          </Text>
          <Text style={styles.optionSub}>
            {t("listingAi.startMethodAiSub", {
              defaultValue:
                "Describe your place — we draft title, description & location.",
            })}
          </Text>
        </View>
        <CaretRight size={18} color={BRAND} weight="bold" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={onManualPress}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <View style={styles.optionIcon}>
          <PencilSimple size={22} color="#444" weight="duotone" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>
            {t("listingAi.startMethodManualTitle", {
              defaultValue: "Add manually",
            })}
          </Text>
          <Text style={styles.optionSub}>
            {t("listingAi.startMethodManualSub", {
              defaultValue: "Step-by-step — you fill in every detail yourself.",
            })}
          </Text>
        </View>
        <CaretRight size={18} color="#9CA3AF" weight="bold" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  headline: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: "#6B6B6B",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  prompt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 14,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: "#FFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    marginBottom: 12,
  },
  optionAi: {
    backgroundColor: "#FFF4ED",
    borderColor: "rgba(209, 96, 36, 0.35)",
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconAi: {
    backgroundColor: "#FFFFFF",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
  },
  optionSub: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 4,
    lineHeight: 18,
  },
});
