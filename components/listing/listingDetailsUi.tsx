/**
 * Shared UI primitives matching PropertySaleDetailsScreen + LandmarkDetailsScreen.
 */
import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Platform,
  ActivityIndicator,
  ViewStyle,
  Text as RNText,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "phosphor-react-native";
import { theme } from "../../theme";

export const LD = {
  black: "#1A1A1A",
  border: "#F0F0F0",
  muted: "#666666",
  surface: "#FFFFFF",
  soft: "#F8F9FA",
  accent: theme["color-temporary-primary"] as string,
  secondary: "#2C3E50",
};

export const LDDivider = ({ margin = 0 }: { margin?: number }) => (
  <View
    style={{ height: 1, backgroundColor: LD.border, marginVertical: margin }}
  />
);

export function LDSectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={ld.sectionTitleWrap}>
      <View style={ld.sectionTitleRow}>
        <Text style={ld.sectionTitleText}>{title}</Text>
        <View style={ld.sectionTitleBar} />
      </View>
      {subtitle ? (
        <Text style={ld.sectionSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function LDNavHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <SafeAreaView edges={["top"]} style={ld.headerSafe}>
      <View style={ld.navRow}>
        <Pressable style={ld.navBtn} onPress={onBack}>
          <ArrowLeft size={22} color={LD.black} />
        </Pressable>
        <Text style={ld.navTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={ld.navBtnSpacer} />
      </View>
    </SafeAreaView>
  );
}

export function LDPropertyContextCard({
  title,
  priceLabel,
  imageUri,
}: {
  title?: string;
  priceLabel?: string;
  imageUri?: string;
}) {
  if (!title && !imageUri) return null;
  return (
    <View style={ld.contextCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={ld.contextImage} />
      ) : (
        <View style={[ld.contextImage, ld.contextImageFallback]} />
      )}
      <View style={ld.contextBody}>
        {title ? (
          <Text style={ld.contextTitle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {priceLabel ? (
          <Text style={ld.contextPrice}>{priceLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function LDActionButton({
  icon,
  label,
  onPress,
  variant = "primary",
  style,
  disabled,
  loading,
}: {
  icon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}) {
  const bg =
    variant === "primary"
      ? LD.accent
      : variant === "secondary"
        ? LD.secondary
        : LD.surface;
  const border =
    variant === "outline" ? { borderWidth: 1, borderColor: "#E0E0E0" } : {};
  const textColor = variant === "outline" ? LD.black : "#FFF";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        ld.actionBtn,
        { backgroundColor: bg },
        border,
        disabled && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} style={{ marginRight: 8 }} />
      ) : (
        icon
      )}
      <RNText style={[ld.actionBtnText, { color: textColor }]}>{label}</RNText>
    </TouchableOpacity>
  );
}

export function LDBottomBar({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={["bottom"]} style={ld.bottomBar}>
      {children}
    </SafeAreaView>
  );
}

export function LDSelectOption({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[ld.selectOption, selected && ld.selectOptionActive]}
    >
      {icon}
      <Text style={[ld.selectOptionText, selected && ld.selectOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function LDChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[ld.chip, selected && ld.chipActive]}
    >
      <Text style={[ld.chipText, selected && ld.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function LDHintCard({
  text,
  icon,
}: {
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={ld.hintCard}>
      {icon}
      <Text style={ld.hintText}>{text}</Text>
    </View>
  );
}

export const ld = StyleSheet.create({
  screen: { flex: 1, backgroundColor: LD.surface },
  contentPad: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
  contentPadScroll: { paddingBottom: 120 },
  headerSafe: {
    backgroundColor: LD.surface,
    borderBottomWidth: 1,
    borderBottomColor: LD.border,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 56,
    justifyContent: "space-between",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  navBtnSpacer: { width: 40 },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: LD.black,
    textAlign: "center",
    marginHorizontal: 8,
  },
  sectionTitleWrap: { marginBottom: 16, marginTop: 8 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: "700",
    color: LD.black,
    letterSpacing: -0.3,
  },
  sectionTitleBar: {
    width: 40,
    height: 3,
    backgroundColor: LD.accent,
    borderRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: LD.muted,
    marginTop: 4,
  },
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: LD.soft,
    borderWidth: 0.5,
    borderColor: "#EEE",
    marginBottom: 8,
  },
  contextImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#E8E8E8",
  },
  contextImageFallback: { backgroundColor: "#E8E4DC" },
  contextBody: { flex: 1, gap: 4 },
  contextTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: LD.black,
    lineHeight: 20,
  },
  contextPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: LD.accent,
  },
  fieldRow: { flexDirection: "row", gap: 10 },
  fieldBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LD.border,
    backgroundColor: LD.soft,
  },
  fieldBoxActive: {
    borderColor: LD.accent,
    backgroundColor: "#FFF8F4",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: LD.muted,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: "600",
    color: LD.black,
  },
  fieldPlaceholder: { color: "#B0B0B0", fontWeight: "400" },
  textArea: {
    borderWidth: 1,
    borderColor: LD.border,
    borderRadius: 10,
    padding: 14,
    minHeight: 96,
    fontSize: 15,
    color: LD.black,
    backgroundColor: LD.soft,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: LD.accent,
    marginBottom: 6,
  },
  currency: {
    fontSize: 20,
    fontWeight: "700",
    color: LD.muted,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "800",
    color: LD.accent,
    padding: 0,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LD.border,
    backgroundColor: LD.surface,
  },
  chipActive: {
    borderColor: LD.accent,
    backgroundColor: "#FFF8F4",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: LD.black },
  chipTextActive: { color: LD.accent },
  selectRow: { flexDirection: "row", gap: 10 },
  selectOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LD.border,
    backgroundColor: LD.soft,
  },
  selectOptionActive: {
    borderColor: LD.accent,
    backgroundColor: "#FFF8F4",
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: LD.black,
  },
  selectOptionTextActive: { color: LD.accent },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: LD.soft,
    borderWidth: 0.5,
    borderColor: "#EEE",
    marginTop: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: LD.muted,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LD.border,
    backgroundColor: LD.surface,
    alignItems: "stretch",
    ...Platform.select({
      ios: { paddingBottom: 8 },
      android: { paddingBottom: 12 },
    }),
  },
  actionBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 48,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: LD.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: LD.border,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LD.black,
  },
  pickerClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  picker: { height: 200 },
  pickerDone: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: LD.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickerDoneText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
