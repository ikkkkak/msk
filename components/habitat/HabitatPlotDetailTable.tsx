import React, { useMemo } from "react";
import { View, Text, StyleSheet, I18nManager } from "react-native";
import { useTranslation } from "react-i18next";
import type { HabitatPlot } from "../../types/habitat";
import { displayPlotNumber, formatPlotDimensions } from "./cadastreFilterUtils";

type Row = { key: string; label: string; value: string };

type TableVariant = "sheet" | "compact" | "map";

type Props = {
  plot: HabitatPlot;
  /** Tighter rows + smaller type for the map bottom card */
  compact?: boolean;
  /** Map bottom sheet — readable two-column registry table */
  variant?: TableVariant;
  /** Include parcel number as the first table row */
  includeParcelRow?: boolean;
  /** Hide IL / EL / RES / dimensions when empty (keeps map card shorter) */
  omitEmptyOptional?: boolean;
};

function pickLocalized(
  isRtl: boolean,
  en?: string | null,
  ar?: string | null,
): string {
  const primary = isRtl ? ar || en : en || ar;
  return (primary || "").trim();
}

export function HabitatPlotDetailTable({
  plot,
  compact = false,
  variant,
  includeParcelRow = false,
  omitEmptyOptional = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl =
    I18nManager.isRTL || (i18n.language || "").toLowerCase().startsWith("ar");

  const rows = useMemo((): Row[] => {
    const planName = pickLocalized(isRtl, plot.plan?.name, plot.plan?.name_ar);
    const planCode = plot.plan?.code?.trim() || "";
    const sectorName = pickLocalized(
      isRtl,
      plot.sector?.name,
      plot.sector?.name_ar,
    );
    const sectorCode = plot.sector?.code?.trim() || "";
    const area = plot.area_m2 ?? plot.area_rounded;

    const out: Row[] = [];

    if (includeParcelRow) {
      out.push({
        key: "parcel",
        label: t("habitatCadastre.card.parcelNumber", "Parcel no."),
        value: displayPlotNumber(plot.plot_number) || "—",
      });
    }

    out.push(
      {
        key: "zone",
        label: t("habitatCadastre.card.zone", "Zone"),
        value: planCode || planName || "—",
      },
      {
        key: "sector",
        label: t("habitatCadastre.quartierLabel", "Quartier"),
        value: sectorCode || sectorName || "—",
      },
      {
        key: "area",
        label: t("habitatCadastre.card.areaSize", "Area"),
        value: area != null && Number(area) > 0 ? `${area} m²` : "—",
      },
      {
        key: "dimensions",
        label: t("habitatCadastre.card.dimensions", "Dimensions"),
        value: formatPlotDimensions(plot),
      },
      {
        key: "il",
        label: t("habitatCadastre.card.frontHeight", "Front height"),
        value: plot.il_value != null ? `${plot.il_value} m` : "—",
      },
      {
        key: "el",
        label: t("habitatCadastre.card.backHeight", "Back height"),
        value: plot.el_value != null ? `${plot.el_value} m` : "—",
      },
      {
        key: "res",
        label: t("habitatCadastre.card.res", "RES"),
        value: plot.res_value != null ? String(plot.res_value) : "—",
      },
    );

    if (!omitEmptyOptional) return out;

    const optionalKeys = new Set(["dimensions", "il", "el", "res"]);
    return out.filter(
      (row) =>
        !optionalKeys.has(row.key) || (row.value !== "—" && row.value !== ""),
    );
  }, [plot, t, isRtl, includeParcelRow, omitEmptyOptional]);

  const resolvedVariant: TableVariant =
    variant ?? (compact ? "compact" : "sheet");
  const s =
    resolvedVariant === "compact"
      ? compactStyles
      : resolvedVariant === "map"
        ? mapStyles
        : sheetStyles;

  return (
    <View style={s.table}>
      <View style={[s.headerRow, isRtl && s.rowRtl]}>
        <Text style={[s.headerCell, s.headerCellLabel, isRtl && s.textRtl]}>
          {t("habitatCadastre.card.field", "Field")}
        </Text>
        <View style={s.colDivider} />
        <Text style={[s.headerCell, s.headerCellValue, isRtl && s.textRtl]}>
          {t("habitatCadastre.card.value", "Value")}
        </Text>
      </View>
      {rows.map((row, index) => (
        <View
          key={row.key}
          style={[
            s.dataRow,
            index % 2 === 1 && s.dataRowAlt,
            index === rows.length - 1 && s.dataRowLast,
            isRtl && s.rowRtl,
          ]}
        >
          <Text style={[s.labelCell, isRtl && s.textRtl]} numberOfLines={2}>
            {row.label}
          </Text>
          <View style={s.colDivider} />
          <Text style={[s.valueCell, isRtl && s.textRtl]} numberOfLines={2}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  table: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#E8EEF4",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  headerCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  headerCellLabel: {
    flex: 0.42,
  },
  headerCellValue: {
    flex: 0.58,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    minHeight: 44,
  },
  dataRowAlt: {
    backgroundColor: "#F8FAFC",
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  labelCell: {
    flex: 0.42,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  valueCell: {
    flex: 0.58,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
  colDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  textRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

const mapStyles = StyleSheet.create({
  table: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  headerCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  headerCellLabel: {
    flex: 0.38,
  },
  headerCellValue: {
    flex: 0.62,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    minHeight: 30,
  },
  dataRowAlt: {
    backgroundColor: "#F8FAFC",
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  labelCell: {
    flex: 0.38,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  valueCell: {
    flex: 0.62,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
  colDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  textRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

const compactStyles = StyleSheet.create({
  table: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#E8EEF4",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  headerCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  headerCellLabel: {
    flex: 0.4,
  },
  headerCellValue: {
    flex: 0.6,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    minHeight: 20,
  },
  dataRowAlt: {
    backgroundColor: "#F8FAFC",
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  labelCell: {
    flex: 0.4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
  },
  valueCell: {
    flex: 0.6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
  colDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  textRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
