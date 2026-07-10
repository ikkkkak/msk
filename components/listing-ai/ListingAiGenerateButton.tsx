import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { laiStyles } from "./listingAiTheme";

type Props = {
  generating: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ListingAiGenerateButton({
  generating,
  disabled,
  onPress,
}: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        laiStyles.btnPrimary,
        styles.btn,
        (disabled || generating) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || generating}
      activeOpacity={0.85}
    >
      {generating ? (
        <ActivityIndicator color="#FFF" size="small" />
      ) : (
        <Text style={laiStyles.btnPrimaryText}>
          {t("listingAi.generate", { defaultValue: "Generate listing" })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: "100%" },
  disabled: { opacity: 0.45 },
});
