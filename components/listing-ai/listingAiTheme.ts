import { StyleSheet } from "react-native";
import { theme } from "../../theme";

/** Flat, human UI — one border, one input style, brand on actions only */
export const LAI = {
  brand: theme["color-temporary-primary"] as string,
  text: "#222222",
  textSecondary: "#717171",
  textMuted: "#A3A3A3",
  border: "#E5E5E5",
  borderFocus: "#222222",
  surface: "#FFFFFF",
  canvas: "#FFFFFF",
  danger: "#C13515",
  radius: 8,
  brandSoft: "#FFF4ED",
  borderLight: "#E8E8E8",
};

export const laiStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LAI.surface },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: LAI.textSecondary,
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderColor: LAI.border,
    borderRadius: LAI.radius,
    backgroundColor: LAI.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: LAI.text,
  },
  fieldMultiline: {
    minHeight: 112,
    textAlignVertical: "top" as const,
    lineHeight: 22,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: LAI.radius,
    borderWidth: 1,
    borderColor: LAI.border,
    backgroundColor: LAI.surface,
  },
  chipActive: {
    borderColor: LAI.text,
    backgroundColor: LAI.surface,
  },
  chipText: { fontSize: 14, color: LAI.text, fontWeight: "400" },
  chipTextActive: { color: LAI.text, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: LAI.brand,
    borderRadius: LAI.radius,
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 48,
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  btnGhost: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "center" as const,
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: "500",
    color: LAI.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LAI.border,
  },
});
