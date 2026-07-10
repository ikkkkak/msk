import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { CaretRight } from "phosphor-react-native";
import { LAI } from "./listingAiTheme";

type Props = {
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function ListingAiActionRow({
  label,
  value,
  onPress,
  disabled,
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.main}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      {onPress ? (
        <CaretRight size={16} color={LAI.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LAI.border,
  },
  disabled: { opacity: 0.5 },
  main: { flex: 1, marginRight: 8 },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: LAI.text,
  },
  value: {
    fontSize: 13,
    color: LAI.textSecondary,
    marginTop: 2,
  },
});
