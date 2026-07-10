import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { Sparkle, Check } from "phosphor-react-native";
import { theme } from "../../theme";
import { PublishRingProgress } from "../PublishRingProgress";
import {
  AI_PROCESSING_STEPS,
  aiProgressPercent,
  aiStepState,
} from "./listingAiProgress";

const BRAND = theme["color-temporary-primary"] as string;

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  progress: string;
  isActive?: boolean;
  onCancel?: () => void;
};

export function ListingAiProcessingSheet({
  sheetRef,
  progress,
  isActive = false,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const snapPoints = useMemo(() => ["46%"], []);

  const pct = useMemo(() => aiProgressPercent(progress), [progress]);

  const activeMessage = t(`listingAi.progress.${progress}`, {
    defaultValue: t("listingAi.progress.default", {
      defaultValue: "Preparing your listing…",
    }),
  });

  const steps = useMemo(
    () =>
      AI_PROCESSING_STEPS.map((key, index) => ({
        key,
        label: t(`listingAi.progress.${key}`, { defaultValue: key }),
        state: aiStepState(key, progress),
        isLast: index === AI_PROCESSING_STEPS.length - 1,
      })),
    [progress, t],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="none"
      />
    ),
    [],
  );

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [isActive]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableDismissOnClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
      stackBehavior="push"
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Sparkle size={18} color={BRAND} weight="fill" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {t("listingAi.processingBadge", { defaultValue: "Meskeny AI" })}
            </Text>
            <Text style={styles.title}>
              {t("listingAi.processingTitle", {
                defaultValue: "Building your listing",
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.statusLine} numberOfLines={2}>
          {activeMessage}
        </Text>

        <View style={styles.ringWrap}>
          <PublishRingProgress
            percent={pct}
            size={108}
            strokeWidth={6}
            trackColor="#F0F0F0"
            progressColor={BRAND}
            textColor="#111111"
          />
        </View>

        <View style={styles.timeline}>
          {steps.map(({ key, label, state, isLast }) => (
            <TimelineRow
              key={key}
              label={label}
              state={state}
              isLast={isLast}
            />
          ))}
        </View>

        <Text style={styles.footnote}>
          {elapsed < 12
            ? t("listingAi.usuallyFast", {
                defaultValue: "Usually under 15 seconds",
              })
            : t("listingAi.stillWorking", {
                defaultValue: "{{s}}s — still working…",
                s: String(elapsed),
              })}
        </Text>

        {onCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>
              {t("listingAi.cancelGeneration", {
                defaultValue: "Cancel",
              })}
            </Text>
          </TouchableOpacity>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function TimelineRow({
  label,
  state,
  isLast,
}: {
  label: string;
  state: "done" | "active" | "upcoming";
  isLast: boolean;
}) {
  const done = state === "done";
  const active = state === "active";

  return (
    <View style={styles.timelineRow}>
      <View style={styles.rail}>
        <View
          style={[
            styles.railDot,
            done && styles.railDotDone,
            active && styles.railDotActive,
          ]}
        >
          {done ? <Check size={12} color="#FFF" weight="bold" /> : null}
        </View>
        {!isLast ? (
          <View style={[styles.railLine, done && styles.railLineDone]} />
        ) : null}
      </View>
      <View style={styles.timelineLabelCol}>
        <Text
          style={[
            styles.timelineLabel,
            active && styles.timelineLabelActive,
            done && styles.timelineLabelDone,
          ]}
        >
          {label}
        </Text>
        {active ? (
          <ActivityIndicator
            size="small"
            color={BRAND}
            style={styles.timelineSpinner}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: "#E0E0E0",
    width: 36,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.4,
  },
  statusLine: {
    fontSize: 14,
    color: "#6B6B6B",
    lineHeight: 20,
    marginBottom: 16,
  },
  ringWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  timeline: {
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 44,
  },
  rail: {
    width: 28,
    alignItems: "center",
    marginRight: 12,
  },
  railDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  railDotActive: {
    borderColor: BRAND,
    backgroundColor: "#FFF8F5",
  },
  railDotDone: {
    borderColor: "#111",
    backgroundColor: "#111",
  },
  railLine: {
    width: 2,
    height: 18,
    backgroundColor: "#EBEBEB",
    marginVertical: 4,
  },
  railLineDone: {
    backgroundColor: "#111",
  },
  timelineLabelCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 1,
  },
  timelineLabel: {
    flex: 1,
    fontSize: 15,
    color: "#A3A3A3",
    fontWeight: "500",
  },
  timelineSpinner: {
    marginRight: 4,
  },
  timelineLabelActive: {
    color: "#111",
    fontWeight: "700",
  },
  timelineLabelDone: {
    color: "#525252",
    fontWeight: "600",
  },
  footnote: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
  },
  cancelBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B6B6B",
  },
});
