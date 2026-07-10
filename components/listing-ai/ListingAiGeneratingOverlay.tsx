import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { LAI } from "./listingAiTheme";
import {
  AI_PROCESSING_STEPS,
  aiStepState,
} from "./listingAiProgress";

type Props = {
  visible: boolean;
  progress: string;
};

/** In-modal overlay — must NOT use a nested RN Modal (Android dismisses the parent). */
export function ListingAiGeneratingOverlay({ visible, progress }: Props) {
  const { t } = useTranslation();

  const activeMessage = t(`listingAi.progress.${progress}`, {
    defaultValue: t("listingAi.progress.default", {
      defaultValue: "Preparing your listing…",
    }),
  });

  const activeStep = AI_PROCESSING_STEPS.find(
    (key) => aiStepState(key, progress) === "active",
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator color={LAI.brand} size="large" />
          <Text style={styles.title}>
            {t("listingAi.processingTitle", {
              defaultValue: "Building your listing",
            })}
          </Text>
          <Text style={styles.status}>{activeMessage}</Text>
          {activeStep ? (
            <Text style={styles.step}>
              {t(`listingAi.progress.${activeStep}`, {
                defaultValue: activeStep,
              })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: LAI.surface,
    borderRadius: LAI.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LAI.border,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: LAI.text,
    textAlign: "center",
  },
  status: {
    fontSize: 14,
    color: LAI.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  step: {
    fontSize: 13,
    color: LAI.textMuted,
    textAlign: "center",
  },
});
