import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LAI } from "./listingAiTheme";

export type ComposeStepDef = {
  id: string;
  label: string;
};

type Props = {
  steps: ComposeStepDef[];
  currentIndex: number;
};

export function ListingAiFlowTracker({ steps, currentIndex }: Props) {
  const { t } = useTranslation();
  if (steps.length === 0) return null;

  const current = steps[currentIndex];

  return (
    <View style={styles.wrap}>
      <View style={styles.segments}>
        {steps.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <View
              key={step.id}
              style={[styles.segment, done && styles.segmentDone]}
            />
          );
        })}
      </View>
      <Text style={styles.meta}>
        {t("listingAi.stepOf", {
          defaultValue: "Step {{current}} of {{total}}",
          current: currentIndex + 1,
          total: steps.length,
        })}
        {current?.label ? ` · ${current.label}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LAI.border,
    backgroundColor: LAI.surface,
  },
  segments: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 2,
    backgroundColor: LAI.border,
  },
  segmentDone: {
    backgroundColor: LAI.text,
  },
  meta: {
    fontSize: 12,
    color: LAI.textMuted,
  },
});
