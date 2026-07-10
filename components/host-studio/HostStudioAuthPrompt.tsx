import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { SignIn, WarningCircle } from "phosphor-react-native";
import { studio } from "./studioTheme";

type Props = {
  variant?: "signin" | "session";
  onSignIn: () => void;
  /** Override default title (e.g. buyer matches screen). */
  title?: string;
  /** Override default subtitle. */
  subtitle?: string;
};

export function HostStudioAuthPrompt({
  variant = "signin",
  onSignIn,
  title: titleOverride,
  subtitle: subtitleOverride,
}: Props) {
  const { t } = useTranslation();
  const isSession = variant === "session";

  const title =
    titleOverride ??
    (isSession
      ? t("hostStudio.sessionExpired", "Sign in again")
      : t("hostStudio.signInRequired", "Sign in to Host Studio"));

  const subtitle =
    subtitleOverride ??
    (isSession
      ? t(
          "hostStudio.sessionExpiredSub",
          "Your session ended. Sign in again to view your video and listing stats.",
        )
      : t(
          "hostStudio.signInRequiredSub",
          "Video views, likes, and engagement metrics are available after you sign in.",
        ));

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        {isSession ? (
          <WarningCircle size={28} color={studio.trend} weight="duotone" />
        ) : (
          <SignIn size={28} color={studio.trend} weight="duotone" />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
      <TouchableOpacity style={styles.btn} onPress={onSignIn} activeOpacity={0.85}>
        <Text style={styles.btnText}>
          {t("hostStudio.signInCta", "Sign in")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 28,
    borderRadius: 14,
    backgroundColor: studio.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: studio.border,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: studio.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: studio.ink,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 14,
    color: studio.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
  btn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: studio.ink,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
