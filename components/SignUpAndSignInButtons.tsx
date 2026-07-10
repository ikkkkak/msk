import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export const SignUpAndSignInButtons = ({ style }: { style?: ViewStyle }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.loginButton, style]}
      onPress={() => (navigation as any).navigate("UnifiedAuth")}
      activeOpacity={0.8}
    >
      <Text style={styles.loginButtonText}>
        {t("account.authButtons.signIn", "Sign in")}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loginButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "CircularStd-Medium",
    letterSpacing: 0.2,
  },
});
