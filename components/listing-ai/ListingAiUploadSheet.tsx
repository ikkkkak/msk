import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LAI } from "./listingAiTheme";

type Props = {
  visible: boolean;
  variant?: "compose" | "review";
};

/** In-modal sheet — must NOT use a nested RN Modal (Android dismisses the parent). */
export function ListingAiUploadSheet({ visible, variant = "compose" }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
        >
          <ActivityIndicator color={LAI.brand} size="small" />
          <Text style={styles.title}>
            {variant === "review"
              ? t("listingAi.uploadTitleReview", {
                  defaultValue: "Uploading media",
                })
              : t("listingAi.uploadTitle", {
                  defaultValue: "Uploading media",
                })}
          </Text>
          <Text style={styles.sub}>
            {t("listingAi.uploadHint", {
              defaultValue: "Keep the app open",
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LAI.surface,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LAI.border,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: LAI.text,
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    color: LAI.textSecondary,
    textAlign: "center",
  },
});
