import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { SealCheck } from "phosphor-react-native";
import { trustColors as c } from "../trust/trustTokens";

type Props = {
  brokerId?: string | null;
  /** inline: text beside icon (default). chip: soft pill. micro: one compact line */
  variant?: "inline" | "chip" | "micro";
  showId?: boolean;
};

/**
 * Verified broker mark — small, credible, not a marketing banner.
 */
export function BrokerVerifiedBadge({
  brokerId,
  variant = "inline",
  showId = true,
}: Props) {
  const { t } = useTranslation();
  const id = brokerId?.trim();
  const label = t("broker.verifiedBadge", "Licensed broker");

  if (variant === "micro") {
    return (
      <View style={styles.micro}>
        <SealCheck size={12} color={c.accent} weight="fill" />
        <Text style={styles.microText}>
          {label}
          {showId && id ? (
            <Text style={styles.microId}> · {id}</Text>
          ) : null}
        </Text>
      </View>
    );
  }

  if (variant === "chip") {
    return (
      <View style={styles.chip}>
        <SealCheck size={13} color={c.accent} weight="fill" />
        <Text style={styles.chipText}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <SealCheck size={14} color={c.accent} weight="fill" />
      <View style={styles.inlineTextCol}>
        <Text style={styles.inlineLabel}>{label}</Text>
        {showId && id ? <Text style={styles.inlineId}>{id}</Text> : null}
      </View>
    </View>
  );
}

export {
  isVerifiedBrokerUser,
  brokerIdFromHost,
  hostIsVerifiedBroker,
  brokerProfileVisible,
  resolveBrokerPerson,
  brokerDisplayName,
  brokerAvatarUri,
} from "./brokerHost";
export type { BrokerHostUser, BrokerHostData } from "./brokerHost";

const styles = StyleSheet.create({
  inline: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    alignSelf: "flex-start",
  },
  inlineTextCol: {
    gap: 1,
    flexShrink: 1,
  },
  inlineLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: c.body,
    lineHeight: 17,
  },
  inlineId: {
    fontSize: 12,
    fontWeight: "500",
    color: c.muted,
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: c.accentSoft,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: c.accent,
    letterSpacing: 0.1,
  },
  micro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  microText: {
    fontSize: 12,
    fontWeight: "500",
    color: c.muted,
    lineHeight: 16,
  },
  microId: {
    fontWeight: "500",
    color: c.body,
    fontVariant: ["tabular-nums"],
  },
});
