import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { CaretRight, Sparkle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import LottieView from "lottie-react-native";

const LOTTIE = require("../assets/lotties/property-add.json");

/** Compact Airbnb-style promo: AI-assisted sale listing in the home feed. */
export const SmartAddHomeSection = React.memo(function SmartAddHomeSection() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    const t = setTimeout(() => lottieRef.current?.play(), 80);
    return () => clearTimeout(t);
  }, []);

  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate("CreatePropertySale", { openAiFlow: true });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      accessibilityRole="button"
      accessibilityLabel={t(
        "smartAdd.a11y",
        "Smart add — create a property listing with AI",
      )}
    >
      <View style={s.textCol}>
        <View style={s.eyebrowRow}>
          <Sparkle size={12} color="#222222" weight="duotone" />
          <Text style={s.eyebrow}>
            {t("smartAdd.eyebrow", "Smart add")}
          </Text>
        </View>
        <Text style={s.title} numberOfLines={2}>
          {t(
            "smartAdd.title",
            "Create your property faster with AI",
          )}
        </Text>
        <View style={s.ctaRow}>
          <Text style={s.cta}>
            {t("smartAdd.cta", "Start listing")}
          </Text>
          <CaretRight size={14} color="#222222" weight="bold" />
        </View>
      </View>

      <View style={s.lottieWrap} pointerEvents="none">
        <LottieView
          ref={lottieRef}
          source={LOTTIE}
          loop
          style={s.lottie}
        />
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 92,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EBEBEB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    gap: 4,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#717171",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  cta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    textDecorationLine: "underline",
  },
  lottieWrap: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: 76,
    height: 76,
  },
});
