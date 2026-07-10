import React, { useMemo } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTranslation } from "react-i18next";

export type SoldPropertyTractionPosterProps = {
  variant: "card" | "detail";
  /**
   * When variant is `card`, `overlay` mounts the strip on the photo bottom edge.
   * `inline` mounts it below the image (recommended for carousel controls).
   */
  cardPlacement?: "overlay" | "inline";
  /** Typically `updated_at` after host marks sold (ISO string). */
  soldAtIso?: string | null;
  style?: StyleProp<ViewStyle>;
};

function parseIso(ms: unknown): number | null {
  if (ms == null) return null;
  const n =
    typeof ms === "number"
      ? ms
      : Date.parse(typeof ms === "string" ? ms.trim() : String(ms));
  return Number.isFinite(n) ? n : null;
}

export function SoldPropertyTractionPoster({
  variant,
  cardPlacement = "overlay",
  soldAtIso,
  style,
}: SoldPropertyTractionPosterProps) {
  const { t } = useTranslation();

  const recency = useMemo(() => {
    const ts = parseIso(soldAtIso ?? undefined);
    if (ts == null) return null;
    const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
    if (days <= 0) {
      return t("sale.soldTractionRecencyToday", "Marked sold recently");
    }
    if (days === 1) {
      return t("sale.soldTractionRecencyYesterday", "Marked sold yesterday");
    }
    if (days < 14) {
      return t("sale.soldTractionRecencyDays", {
        defaultValue: "Marked sold {{count}} days ago",
        count: days,
      });
    }
    const weeks = Math.floor(days / 7);
    return t("sale.soldTractionRecencyWeeks", {
      defaultValue: "Marked sold {{count}} weeks ago",
      count: weeks,
    });
  }, [soldAtIso, t]);

  if (variant === "card") {
    const wrapStyle =
      cardPlacement === "overlay"
        ? styles.cardWrapOverlay
        : styles.cardWrapInline;
    return (
      <View style={[wrapStyle, style]} pointerEvents="none">
        <View style={styles.cardSurface}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {t("sale.soldTractionBadge", "Sold")}
              </Text>
            </View>
            <View style={styles.contractStampMini}>
              <Text style={styles.contractStampMiniText}>
                {t("sale.contractClosed", "CONTRACT CLOSED")}
              </Text>
            </View>
            {recency ? (
              <Text style={styles.cardMeta} numberOfLines={1}>
                {recency}
              </Text>
            ) : null}
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {t("sale.soldTractionCardTitle", "Recently sold on Meskeny")}
          </Text>
          <Text style={styles.cardSub} numberOfLines={2}>
            {t(
              "sale.soldTractionCardSub",
              "This home was listed here and found a buyer — strong demand in your area.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.detailOuter, style]}>
      <View style={styles.detailGradient}>
        <View style={styles.detailHeaderRow}>
          <Text style={styles.detailKicker}>
            {t("sale.soldTractionBadge", "Sold")}
          </Text>
          {recency ? <Text style={styles.detailMeta}>{recency}</Text> : null}
        </View>
        <Text style={styles.detailTitle}>
          {t("sale.soldTractionDetailTitle", "This listing closed on Meskeny")}
        </Text>
        <Text style={styles.detailBody}>
          {t(
            "sale.soldTractionDetailBody",
            "It was live on the app — and it recently sold. That’s proof people are discovering and completing deals here. Browse similar homes while inventory moves fast.",
          )}
        </Text>
        <View style={styles.contractStampWrap}>
          <View style={styles.contractStamp}>
            <Text style={styles.contractStampText}>
              {t("sale.contractClosed", "CONTRACT CLOSED")}
            </Text>
          </View>
        </View>
        <View style={styles.detailStatRow}>
          <View style={styles.detailStatPill}>
            <Text style={styles.detailStatPillText}>
              {t("sale.soldTractionBadge", "Sold")} Listing
            </Text>
          </View>
          <View style={styles.detailStatPillMuted}>
            <Text style={styles.detailStatPillMutedText}>
              Meskeny Market Signal
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Semi-transparent veil over hero / card photo when sold — social proof framing. */
export function SoldPropertyImageVeil(): React.ReactElement {
  return <View pointerEvents="none" style={styles.imageVeil} />;
}

/** Compact corner pill — use when space is tight (e.g. map pins). */
export function SoldCornerPill(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <View style={styles.cornerPill} pointerEvents="none">
      <Text style={styles.cornerPillText}>
        {t("sale.soldTractionBadge", "Sold")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30,58,138,0.10)",
  },
  cardWrapOverlay: {
    marginTop: 10,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  cardWrapInline: {
    width: "100%",

    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#BFDBFE",
  },
  cardSurface: {
    backgroundColor: "#F8FBFF",
    borderTopWidth: 1,
    borderTopColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  cardBadge: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardBadgeText: {
    color: "#1E3A8A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  cardSub: {
    marginTop: 2,
    color: "#334155",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  cardMeta: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: "auto",
  },
  contractStampMini: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: "-4deg" }],
    backgroundColor: "rgba(37,99,235,0.06)",
  },
  contractStampMiniText: {
    color: "#1D4ED8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  detailOuter: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  detailGradient: {
    backgroundColor: "#F8FBFF",
    minHeight: 120,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailKicker: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    color: "#1E3A8A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  detailTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
  detailBody: {
    marginTop: 6,
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  contractStampWrap: {
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 2,
  },
  contractStamp: {
    borderWidth: 2,
    borderColor: "#1D4ED8",
    borderStyle: "dashed",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    transform: [{ rotate: "-6deg" }],
    backgroundColor: "rgba(37,99,235,0.07)",
  },
  contractStampText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  detailMeta: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },
  detailStatRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailStatPill: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  detailStatPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  detailStatPillMuted: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  detailStatPillMutedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
  },
  cornerPill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  cornerPillText: {
    color: "#1E3A8A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});
