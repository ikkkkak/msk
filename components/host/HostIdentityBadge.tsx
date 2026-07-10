import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import {
  SealCheck,
  Clock,
  WarningCircle,
  ShieldWarning,
} from "phosphor-react-native";
import {
  hostIdentityStatus,
  type HostIdentityData,
  type HostIdentityStatus,
} from "./hostIdentity";

type Props = {
  data: HostIdentityData;
  variant?: "banner" | "chip" | "inline";
};

const STATUS_STYLE: Record<
  HostIdentityStatus,
  {
    bg: string;
    border: string;
    ink: string;
    icon: typeof SealCheck;
    iconColor: string;
  }
> = {
  approved: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    ink: "#065F46",
    icon: SealCheck,
    iconColor: "#059669",
  },
  pending: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    ink: "#92400E",
    icon: Clock,
    iconColor: "#D97706",
  },
  rejected: {
    bg: "#FEF2F2",
    border: "#FECACA",
    ink: "#991B1B",
    icon: WarningCircle,
    iconColor: "#DC2626",
  },
  none: {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    ink: "#475569",
    icon: ShieldWarning,
    iconColor: "#64748B",
  },
};

function labelForStatus(
  status: HostIdentityStatus,
  t: (key: string, fallback?: string) => string,
): { title: string; subtitle: string } {
  switch (status) {
    case "approved":
      return {
        title: t(
          "propertySaleDetails.trust.identityVerifiedTitle",
          "Host identity verified",
        ),
        subtitle: t(
          "propertySaleDetails.trust.identityVerifiedDesc",
          "The person behind this listing confirmed their government ID with Meskeny.",
        ),
      };
    case "pending":
      return {
        title: t(
          "propertySaleDetails.trust.identityPendingTitle",
          "Identity verification in progress",
        ),
        subtitle: t(
          "propertySaleDetails.trust.identityPendingDesc",
          "The host submitted ID documents — review is still in progress.",
        ),
      };
    case "rejected":
      return {
        title: t(
          "propertySaleDetails.trust.identityRejectedTitle",
          "Identity verification incomplete",
        ),
        subtitle: t(
          "propertySaleDetails.trust.identityRejectedDesc",
          "The host's ID check did not pass. Proceed with extra caution.",
        ),
      };
    default:
      return {
        title: t(
          "propertySaleDetails.trust.identityNoneTitle",
          "Host identity not verified",
        ),
        subtitle: t(
          "propertySaleDetails.trust.identityNoneDesc",
          "This host has not completed Meskeny identity verification yet.",
        ),
      };
  }
}

export function HostIdentityBadge({ data, variant = "chip" }: Props) {
  const { t } = useTranslation();
  const status = hostIdentityStatus(data);
  const palette = STATUS_STYLE[status];
  const Icon = palette.icon;
  const copy = labelForStatus(status, t);

  if (variant === "inline") {
    return (
      <View style={[styles.inline, { borderColor: palette.border }]}>
        <Icon size={14} color={palette.iconColor} weight="fill" />
        <Text style={[styles.inlineText, { color: palette.ink }]}>
          {copy.title}
        </Text>
      </View>
    );
  }

  if (variant === "chip") {
    return (
      <View
        style={[
          styles.chip,
          { backgroundColor: palette.bg, borderColor: palette.border },
        ]}
      >
        <Icon size={13} color={palette.iconColor} weight="fill" />
        <Text style={[styles.chipText, { color: palette.ink }]}>
          {copy.title}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <View style={styles.bannerIcon}>
        <Icon size={22} color={palette.iconColor} weight="fill" />
      </View>
      <View style={styles.bannerCopy}>
        <Text style={[styles.bannerTitle, { color: palette.ink }]}>
          {copy.title}
        </Text>
        <Text style={[styles.bannerSubtitle, { color: palette.ink }]}>
          {copy.subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerCopy: { flex: 1, gap: 3 },
  bannerTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.15 },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    opacity: 0.92,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 11, fontWeight: "700" },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start",
  },
  inlineText: { fontSize: 12, fontWeight: "600" },
});
