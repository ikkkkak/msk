import React, { memo } from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { SealCheck } from "phosphor-react-native";

const DGDPE_LOGO = require("../../assets/DGDPE.png");

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const SURFACE = "#FFFFFF";
const STATUS_BG = "#F0FDF4";
const STATUS_BORDER = "#BBF7D0";
const STATUS_INK = "#166534";

export function propertyHasTrucheck(data: unknown): boolean {
  const rec = data as Record<string, unknown> | null | undefined;
  if (!rec) return false;
  return rec.truckeck === true || rec.trucheck === true;
}

export const PropertyDgdpeVerificationCard = memo(
  function PropertyDgdpeVerificationCard() {
    const { t } = useTranslation();

    return (
      <View
        style={styles.card}
        accessibilityRole="summary"
        accessibilityLabel={t(
          "propertySaleDetails.dgdpeVerification.a11y",
          "DGDPE property papers verification",
        )}
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={DGDPE_LOGO}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              {t(
                "propertySaleDetails.dgdpeVerification.eyebrow",
                "Official verification",
              )}
            </Text>
            <Text style={styles.title}>
              {t(
                "propertySaleDetails.dgdpeVerification.title",
                "DGDPE document check",
              )}
            </Text>
          </View>

          <View style={styles.iconWrap}>
            <SealCheck size={20} color="#059669" weight="fill" />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.verifiedLine}>
            {t(
              "propertySaleDetails.dgdpeVerification.verifiedLine",
              "This property's papers have been verified by the DGDPE (Direction Générale des Domaines et de la Conservation Foncière).",
            )}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusLabel}>
                {t(
                  "propertySaleDetails.dgdpeVerification.statusLabel",
                  "Status",
                )}
              </Text>
              <Text style={styles.footnote}>
                {t(
                  "propertySaleDetails.dgdpeVerification.footnote",
                  "Submitted title and land documents match official cadastre records.",
                )}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusValue}>
                {t(
                  "propertySaleDetails.dgdpeVerification.statusConforme",
                  "Conforme",
                )}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
    backgroundColor: SURFACE,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
    backgroundColor: "#FAFBFC",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 56,
    height: 56,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
    letterSpacing: -0.15,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  verifiedLine: {
    fontSize: 14,
    fontWeight: "400",
    color: INK,
    lineHeight: 21,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
  },
  footnote: {
    fontSize: 12,
    fontWeight: "400",
    color: MUTED,
    lineHeight: 17,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: STATUS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: STATUS_BORDER,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: "700",
    color: STATUS_INK,
    letterSpacing: 0.2,
  },
});
