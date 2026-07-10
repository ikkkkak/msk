import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";
import { CaretDown, CaretUp, Check } from "phosphor-react-native";
import type {
  AgentStep,
  AgentVerification,
} from "../../services/agentRunService";
import { formatAgentRole } from "../../services/agentRunService";
import { AI_CHAT as C } from "./aiChatTheme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  steps: AgentStep[];
  verification?: AgentVerification | null;
  totalMs?: number;
  role?: string;
  deepThink?: boolean;
  collapsedDefault?: boolean;
};

export function AgentRunTimeline({
  steps,
  verification,
  totalMs,
  role,
  deepThink,
  collapsedDefault = true,
}: Props) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(collapsedDefault);

  const runningStep = useMemo(
    () => steps.find((s) => s.state === "running"),
    [steps],
  );

  const doneCount = useMemo(
    () =>
      steps.filter((s) => s.state === "done" || s.state === "skipped").length,
    [steps],
  );

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((c) => !c);
  };

  if (steps.length === 0) return null;

  const isComplete = doneCount >= steps.length && !runningStep;
  const headerLabel = runningStep
    ? runningStep.label
    : isComplete
      ? deepThink
        ? t("aiChat.agent.deepThinkingDone", "Finished thinking")
        : t("aiChat.agent.complete", "Finished")
      : t("aiChat.agent.preparing", "Thinking…");

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={t(
          "aiChat.agent.toggleSteps",
          "Toggle reasoning steps",
        )}
      >
        <View style={styles.headerLeft}>
          {runningStep ? <View style={styles.pulseDot} /> : null}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerLabel}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {role ? (
            <Text style={styles.meta}>{formatAgentRole(role)}</Text>
          ) : null}
          {totalMs != null && isComplete ? (
            <Text style={styles.meta}>{(totalMs / 1000).toFixed(1)}s</Text>
          ) : null}
          {collapsed ? (
            <CaretDown size={14} color={C.textMuted} />
          ) : (
            <CaretUp size={14} color={C.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.list}>
          {steps.map((step) => (
            <View key={step.id} style={styles.row}>
              <StepMark state={step.state} />
              <View style={styles.rowBody}>
                <Text
                  style={[
                    styles.rowLabel,
                    step.state === "pending" && styles.rowLabelPending,
                    step.state === "skipped" && styles.rowLabelSkipped,
                  ]}
                  numberOfLines={3}
                >
                  {step.label}
                </Text>
                {step.state === "done" && step.ms != null ? (
                  <Text style={styles.rowMeta}>{step.ms}ms</Text>
                ) : null}
                {step.state === "skipped" ? (
                  <Text style={styles.rowMeta}>
                    {t("aiChat.agent.stepSkipped", "Skipped")}
                  </Text>
                ) : null}
                {step.state === "error" && step.error ? (
                  <Text style={styles.rowErr}>{step.error}</Text>
                ) : null}
              </View>
            </View>
          ))}

          {verification ? (
            <View style={styles.verifyNote}>
              <Text style={styles.verifyText}>
                {verification.matchesIntent
                  ? t(
                      "aiChat.agent.verifyOk",
                      "Verified against your question",
                    )
                  : t(
                      "aiChat.agent.verifyWarn",
                      "Partial match — review suggested",
                    )}
              </Text>
              {verification.gaps.length > 0 ? (
                <Text style={styles.verifyGap}>
                  {verification.gaps.join(" · ")}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}

function StepMark({ state }: { state: AgentStep["state"] }) {
  if (state === "done") {
    return <Check size={14} color={C.textMuted} weight="bold" />;
  }
  if (state === "running") {
    return <View style={styles.dotRunning} />;
  }
  if (state === "error") {
    return <View style={styles.dotError} />;
  }
  return <View style={styles.dotPending} />;
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.textMuted,
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: C.textSub,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "400",
  },
  list: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 2,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: 13,
    color: C.text,
    fontWeight: "400",
    lineHeight: 18,
  },
  rowLabelPending: { color: C.textMuted },
  rowLabelSkipped: {
    color: C.textMuted,
    textDecorationLine: "line-through",
  },
  rowMeta: { fontSize: 11, color: C.textMuted },
  rowErr: { fontSize: 11, color: "#DC2626" },
  dotPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.border,
    marginTop: 6,
  },
  dotRunning: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.textSub,
    marginTop: 6,
  },
  dotError: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DC2626",
    marginTop: 6,
  },
  verifyNote: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.borderSoft,
    gap: 3,
  },
  verifyText: {
    fontSize: 12,
    color: C.textSub,
    lineHeight: 17,
  },
  verifyGap: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 16,
  },
});
