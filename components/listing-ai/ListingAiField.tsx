import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { LAI, laiStyles } from "./listingAiTheme";

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export function ListingAiField({
  label,
  hint,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={laiStyles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[
          laiStyles.field,
          focused && styles.focused,
          style,
        ]}
        placeholderTextColor={LAI.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  focused: {
    borderColor: LAI.borderFocus,
  },
  hint: {
    fontSize: 12,
    color: LAI.textMuted,
    marginTop: 6,
  },
});
