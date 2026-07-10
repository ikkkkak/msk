import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChartLineUp, SealCheck, ShieldCheck } from "phosphor-react-native";
import { theme } from "../../theme";
import type { HostStudioBrokerVerification } from "../../hooks/queries/useHostStudioQuery";

const BRAND = theme["color-temporary-primary"] as string;

type Props = {
  data?: HostStudioBrokerVerification | null;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function formatMru(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function HostBrokerVerificationCard({ data, onPress, style }: Props) {
  const { t } = useTranslation();
  const status = data?.status ?? "none";

  if (status === "approved" || data?.is_verified) {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.iconWrapVerified}>
          <SealCheck size={20} color="#008489" weight="fill" />
        </View>
        <View style={styles.body}>
          <Text style={styles.verifiedTitle}>
            {t("broker.dashboard.verifiedTitle", "Identity verified")}
          </Text>
          {data?.broker_id ? (
            <Text style={styles.brokerId}>
              {t("propertySaleDetails.trust.brokerId", "Broker ID · {{id}}", {
                id: data.broker_id,
              })}
            </Text>
          ) : null}
          <Text style={styles.verifiedSub}>
            {t(
              "broker.dashboard.verifiedSub",
              "Your listings display verified status. Buyers can confirm your broker ID on each listing.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  if (status === "pending") {
    return (
      <View style={[styles.card, styles.cardPending, style]}>
        <View style={styles.iconWrapPending}>
          <ShieldCheck size={22} color="#92400E" weight="duotone" />
        </View>
        <View style={styles.body}>
          <Text style={styles.pendingTitle}>
            {t("broker.dashboard.pendingTitle", "Verification in review")}
          </Text>
          <Text style={styles.pendingSub}>
            {t(
              "broker.dashboard.pendingSub",
              "We usually respond within 24–48 hours. You'll get the verified badge once approved.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  const viewsBoost = data?.expected_views_boost_pct ?? 35;
  const leadsMru = data?.estimated_monthly_leads_mru ?? 85000;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <ShieldCheck size={22} color={BRAND} weight="duotone" />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>
          {t("broker.dashboard.eyebrow", "Broker identity")}
        </Text>
        <Text style={styles.title}>
          {t("broker.dashboard.title", "Get verified on Meskeny")}
        </Text>
        <Text style={styles.sub}>
          {t(
            "broker.dashboard.subtitle",
            "Build trust with buyers. Simple steps — profile photo, languages, and ID check.",
          )}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <ChartLineUp size={14} color={BRAND} weight="bold" />
            <Text style={styles.statVal}>+{viewsBoost}%</Text>
            <Text style={styles.statLbl}>
              {t("broker.dashboard.views", "views")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatMru(leadsMru)} MRU</Text>
            <Text style={styles.statLbl}>
              {t("broker.dashboard.leadsEst", "est. inquiries/mo")}
            </Text>
          </View>
        </View>
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>
            {t("broker.dashboard.cta", "Start verification")}
          </Text>
          <ArrowRight size={16} color={BRAND} weight="bold" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E4DC",
    padding: 16,
    marginBottom: 16,
  },
  cardPending: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapVerified: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapPending: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#111" },
  sub: { fontSize: 13, color: "#555", lineHeight: 18, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },
  stat: { flex: 1, gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "#E8E4DC" },
  statVal: { fontSize: 15, fontWeight: "800", color: "#111" },
  statLbl: { fontSize: 11, color: "#777" },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  cta: { fontSize: 14, fontWeight: "800", color: BRAND },
  verifiedTitle: { fontSize: 15, fontWeight: "600", color: "#222" },
  brokerId: {
    fontSize: 12,
    fontWeight: "500",
    color: "#717171",
    fontVariant: ["tabular-nums"],
  },
  verifiedSub: { fontSize: 12, color: "#717171", lineHeight: 17 },
  pendingTitle: { fontSize: 15, fontWeight: "800", color: "#92400E" },
  pendingSub: { fontSize: 12, color: "#B45309", lineHeight: 17 },
});
