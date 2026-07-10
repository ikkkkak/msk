import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { GuideComment } from "../../hooks/queries/useMeskenyGuide";
import { guideTheme as G } from "./guideTheme";

function severityLabel(
  t: (k: string, d: string) => string,
  severity: string,
): string {
  switch (severity) {
    case "urgent":
      return t("meskenyGuide.severityUrgent", "Action required");
    case "action":
      return t("meskenyGuide.severityAction", "Recommended");
    default:
      return t("meskenyGuide.severityInfo", "Insight");
  }
}

type Props = {
  comment: GuideComment;
  highlighted?: boolean;
  showListingTitle?: boolean;
  onImplement: () => void;
  onDismiss: () => void;
  onAskQuestion: (body: string) => void;
  busy?: boolean;
};

export function GuideCommentCard({
  comment,
  highlighted,
  showListingTitle,
  onImplement,
  onDismiss,
  onAskQuestion,
  busy,
}: Props) {
  const { t } = useTranslation();
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const isImpact = comment.triggerEvent === "action_impact";
  const isUnread = comment.status === "unread";
  const isResolved =
    comment.status === "resolved" || comment.status === "implemented";

  const when = comment.createdAt
    ? (() => {
        const ms = Date.now() - new Date(comment.createdAt).getTime();
        const m = Math.floor(ms / 60000);
        if (m < 60) {
          return t("meskenyGuide.timeMinutesAgo", "{{count}}m ago", {
            count: Math.max(1, m),
          });
        }
        const h = Math.floor(m / 60);
        if (h < 48) {
          return t("meskenyGuide.timeHoursAgo", "{{count}}h ago", { count: h });
        }
        return t("meskenyGuide.timeDaysAgo", "{{count}}d ago", {
          count: Math.floor(h / 24),
        });
      })()
    : "";

  const canAct =
    !isImpact &&
    comment.status !== "dismissed" &&
    comment.status !== "implemented" &&
    comment.status !== "resolved";

  return (
    <View style={[styles.card, highlighted && styles.highlighted]}>
      <View style={styles.topRow}>
        <Text style={styles.badge}>
          {t("meskenyGuide.handwrittenBadge", "Meskeny Guide")}
        </Text>
        {isUnread ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadPillText}>
              {t("meskenyGuide.unreadBadge", "Unread")}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text
          style={[
            styles.severity,
            comment.severity === "urgent" && styles.severityUrgent,
            comment.severity === "action" && styles.severityAction,
          ]}
        >
          {severityLabel(t, comment.severity)}
        </Text>
        {when ? <Text style={styles.when}> · {when}</Text> : null}
      </View>

      {showListingTitle && comment.propertySale?.title ? (
        <Text style={styles.listingTitle} numberOfLines={1}>
          {comment.propertySale.title}
        </Text>
      ) : null}

      {comment.body ? (
        <Text style={styles.body}>{comment.body}</Text>
      ) : (
        <View style={styles.sections}>
          <Section
            label={t("meskenyGuide.diagnosis", "Diagnosis")}
            text={comment.diagnosis}
          />
          <Section
            label={t("meskenyGuide.rootCause", "Root cause")}
            text={comment.rootCause}
          />
          <Section
            label={t("meskenyGuide.prescription", "Prescription")}
            text={comment.prescription}
          />
          <Section
            label={t("meskenyGuide.impact", "Expected impact")}
            text={comment.impactForecast}
          />
        </View>
      )}

      {comment.replies?.map((r) => (
        <View key={r.id} style={styles.reply}>
          <Text style={styles.replyLabel}>
            {r.triggerEvent === "host_question"
              ? t("meskenyGuide.youAsked", "You")
              : t("meskenyGuide.support", "Support")}
          </Text>
          <Text style={styles.replyBody}>{r.body}</Text>
        </View>
      ))}

      {canAct ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onImplement}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {t("meskenyGuide.implement", "Mark as implemented")}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setAskOpen((v) => !v)}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>
                {t("meskenyGuide.ask", "Ask question")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onDismiss}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>
                {t("meskenyGuide.dismiss", "Dismiss")}
              </Text>
            </TouchableOpacity>
          </View>
          {askOpen ? (
            <View style={styles.askBox}>
              <TextInput
                style={styles.askInput}
                placeholder={t(
                  "meskenyGuide.askPlaceholder",
                  "What would you like clarified?",
                )}
                placeholderTextColor={G.muted}
                value={question}
                onChangeText={setQuestion}
                multiline
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => {
                  const q = question.trim();
                  if (!q) return;
                  onAskQuestion(q);
                  setQuestion("");
                  setAskOpen(false);
                }}
                disabled={busy || !question.trim()}
              >
                <Text style={styles.sendBtnText}>
                  {t("meskenyGuide.send", "Send")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : isResolved ? (
        <Text style={styles.resolvedNote}>
          {t("meskenyGuide.resolvedNote", "Marked complete")}
        </Text>
      ) : null}
    </View>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: G.bg,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C8C8C8",
  },
  highlighted: {
    borderColor: G.accent,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: G.accent,
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
  unreadPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  severity: {
    fontSize: 13,
    fontWeight: "600",
    color: G.inkSoft,
  },
  severityUrgent: { color: G.urgent },
  severityAction: { color: G.action },
  when: { fontSize: 13, color: G.muted },
  listingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: G.ink,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: G.ink,
  },
  sections: { gap: 14 },
  section: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: G.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: G.ink,
  },
  reply: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: G.line,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: G.muted,
    marginBottom: 4,
  },
  replyBody: { fontSize: 14, lineHeight: 20, color: G.inkSoft },
  footer: { marginTop: 16, gap: 10 },
  primaryBtn: {
    backgroundColor: G.ink,
    borderRadius: G.radius,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: G.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: G.line,
    backgroundColor: G.surface,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: G.inkSoft,
  },
  askBox: { gap: 8 },
  askInput: {
    minHeight: 72,
    borderRadius: G.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: G.line,
    padding: 12,
    fontSize: 15,
    color: G.ink,
    textAlignVertical: "top",
    backgroundColor: G.surface,
  },
  sendBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: G.radius,
    backgroundColor: G.accent,
  },
  sendBtnText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  resolvedNote: {
    marginTop: 12,
    fontSize: 13,
    color: G.muted,
    fontStyle: "italic",
  },
});
