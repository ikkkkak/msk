import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  SealCheck,
  Clock,
  WarningCircle,
} from "phosphor-react-native";
import { trustColors as c } from "../trust/trustTokens";
import type { BrokerVerificationStatus } from "../../hooks/useBrokerVerification";

type Props = {
  status: BrokerVerificationStatus;
  onBack: () => void;
  onRetry?: () => void;
};

/** Calm full-screen states — no multi-step wizard when not needed. */
export function BrokerVerificationStatusView({
  status,
  onBack,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  const verified = status.is_verified || status.status === "approved";
  const pending = status.status === "pending";
  const rejected = status.status === "rejected";

  const icon = verified ? (
    <SealCheck size={40} color={c.accent} weight="fill" />
  ) : pending ? (
    <Clock size={40} color={c.muted} />
  ) : (
    <WarningCircle size={40} color="#B45309" weight="duotone" />
  );

  const title = verified
    ? t("broker.status.verifiedTitle", "You're verified")
    : pending
      ? t("broker.status.pendingTitle", "Review in progress")
      : t("broker.status.rejectedTitle", "Application not approved");

  const body = verified
    ? t(
        "broker.status.verifiedBody",
        "Your broker ID is active on your listings. Manage how your name and photo appear in Account settings.",
      )
    : pending
      ? t(
          "broker.status.pendingBody",
          "We usually finish reviews within 24–48 hours. You'll get the verified badge when approved.",
        )
      : status.rejection_notes?.trim()
        ? status.rejection_notes
        : t(
            "broker.status.rejectedBody",
            "You can submit a new application with clearer photos and documents.",
          );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={c.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{body}</Text>

        {verified && status.broker_id?.trim() ? (
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>
              {t("broker.sheet.brokerIdLabel", "Your broker ID")}
            </Text>
            <Text style={styles.idValue}>{status.broker_id.trim()}</Text>
          </View>
        ) : null}

        {rejected && onRetry ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onRetry}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              {t("broker.status.tryAgain", "Submit again")}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onBack}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              {t("common.done", "Done")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: c.muted,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  idBox: {
    alignSelf: "stretch",
    padding: 16,
    borderRadius: 12,
    backgroundColor: c.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    marginBottom: 32,
  },
  idLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  idValue: {
    fontSize: 17,
    fontWeight: "600",
    color: c.ink,
    fontVariant: ["tabular-nums"],
  },
  primaryBtn: {
    alignSelf: "stretch",
    backgroundColor: c.ink,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 24,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
