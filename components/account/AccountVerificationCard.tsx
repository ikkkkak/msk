import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { CaretRight, SealCheck } from "phosphor-react-native";
import { trustColors as c } from "../trust/trustTokens";

type Props = {
  brokerId?: string;
  onPress?: () => void;
};

/**
 * Account profile verification row — calm, credible, tappable to broker settings.
 */
export function AccountVerificationCard({ brokerId, onPress }: Props) {
  const { t } = useTranslation();
  const id = brokerId?.trim();

  const inner = (
    <>
      <View style={styles.iconWrap}>
        <SealCheck size={18} color={c.accent} weight="fill" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {t("broker.verifiedBadge", "Identity verified")}
        </Text>
        <Text style={styles.subtitle}>
          {id
            ? t("account.brokerIdLine", "Broker ID · {{id}}", { id })
            : t(
                "account.brokerVerifiedSub",
                "Your broker credentials are confirmed on Meskeny.",
              )}
        </Text>
      </View>
      {onPress ? (
        <CaretRight size={18} color={c.muted} style={styles.chevron} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: c.ink,
    letterSpacing: -0.15,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: c.muted,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
  },
  chevron: {
    marginLeft: 4,
  },
});
