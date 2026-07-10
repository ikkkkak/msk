import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Seal,
  Scroll,
  EnvelopeSimple,
  FileText,
  Buildings,
  MapPin,
} from "phosphor-react-native";
import type { PaperDisplayItem } from "../utils/paperDisplay";

export type { PaperDisplayItem };

const ICON_COLOR = "#1E3A5F";
const ICON_SIZE = 22;

function PaperRowIcon({ canonicalKey }: { canonicalKey: string }) {
  const props = { size: ICON_SIZE, color: ICON_COLOR, weight: "duotone" as const };
  switch (canonicalKey) {
    case "titre_foncier":
      return <Seal {...props} />;
    case "quitane":
      return <Scroll {...props} />;
    case "lettre":
      return <EnvelopeSimple {...props} />;
    case "concession":
      return <Buildings {...props} />;
    case "bornage":
      return <MapPin {...props} />;
    default:
      return <FileText {...props} />;
  }
}

type Props = {
  title: string;
  subtitle: string;
  items: PaperDisplayItem[];
};

export function ListingPapersCard({ title, subtitle, items }: Props) {
  if (!items.length) return null;

  return (
    <View
      style={styles.card}
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerIconWrap}>
          <Seal size={26} color={ICON_COLOR} weight="duotone" />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View
            key={`${item.canonicalKey}-${item.label}-${i}`}
            style={[styles.row, i > 0 && styles.rowBorder]}
          >
            <View style={styles.rowIcon}>
              <PaperRowIcon canonicalKey={item.canonicalKey} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C7D2E0",
    backgroundColor: "#F4F7FC",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E8EEF8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#B8C5DA",
  },
  headerTextCol: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    fontWeight: "500",
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C7D2E0",
    backgroundColor: "#FAFBFE",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF3FA",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 20,
  },
});
