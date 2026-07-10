import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import { Text } from "@ui-kitten/components";
import { useTranslation } from "react-i18next";
import { CaretRight, Door } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

const DOOR_LOTTIE = require("../../assets/lotties/door-open.json");

type Props = {
  onPress: () => void;
};

export const BecomeHostCard = React.memo(function BecomeHostCard({
  onPress
}: Props) {
  const { t } = useTranslation();
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    const timer = setTimeout(() => lottieRef.current?.play(), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.outer, pressed && styles.outerPressed]}
      accessibilityRole="button"
      accessibilityLabel={t("hostOnboarding.cardA11y")}
    >
      <LinearGradient
        colors={["#FFF", "#FFF", "#FFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {t("hostOnboarding.cardTitle")}
          </Text>
          <View style={styles.ctaRow}>
            <Text style={styles.cta}>{t("hostOnboarding.cardCta")}</Text>
            <CaretRight size={15} color="#222222" weight="bold" />
          </View>
        </View>

        <View style={styles.lottieShell} pointerEvents="none">
          <View style={styles.lottieGlow} />
          <LottieView
            ref={lottieRef}
            source={DOOR_LOTTIE}
            loop
            autoPlay
            style={styles.lottie}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  outer: {
    borderRadius: 18
  },
  outerPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }]
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 70,
    paddingLeft: 18,
    paddingRight: 4,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(209, 96, 36, 0.14)",
    overflow: "hidden"
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
    gap: 4
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D16024",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
    letterSpacing: -0.35,
    lineHeight: 23
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8
  },
  cta: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(34, 34, 34, 0.35)"
  },
  lottieShell: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2
  },
  lottieGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    transform: [{ scale: 0.85 }]
  },
  lottie: {
    width: 76,
    height: 76
  }
});
