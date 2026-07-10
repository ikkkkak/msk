/**
 * MeskenyGPT Landing Screen
 * Hero title uses an inlined FancyText that cycles through property-type words.
 * FancyText is self-contained — zero ThemedText dependency.
 */

import React, { useEffect } from "react";
import {
  Dimensions,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Animated, {
  createAnimatedComponent,
  Easing,
  FadeIn,
  FadeInUp,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { CaretRight, X } from "phosphor-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Palette ────────────────────────────────────────────────────────────────

const COLORS = {
  background: "#FAEFE9",
  surface: "#FAEFE9",
  cardBorder: "rgba(15, 23, 42, 0.08)",
  text: "#111827",
  textSecondary: "#4B5563",
  textMuted: "rgba(75, 85, 99, 0.8)",
  primary: "#DA8050",
  primarySoft: "rgba(218, 128, 80, 0.16)",
};

// ─── FancyText (no ThemedText) ───────────────────────────────────────────────

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 400,
  mass: 1,
  overshootClamping: true,
  restDisplacementThreshold: 0.0001,
  restSpeedThreshold: 0.0001,
};

const applySpring = (value: number) => {
  "worklet";
  return withSpring(value, SPRING_CONFIG);
};

const AnimatedText = createAnimatedComponent(Text);

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const wordLooksArabic = (w: string) => ARABIC_RE.test(w);

interface FancyTextProps {
  words: string[];
  currentIndex: SharedValue<number>;
  bounce?: boolean;
  style?: StyleProp<ViewStyle>;
  textProps?: TextProps & { style?: any };
}

function FancyText({
  words,
  currentIndex,
  bounce = true,
  style,
  textProps,
}: FancyTextProps) {
  const treatAsWordLevel = words.some((w) => wordLooksArabic(w));
  return (
    <View style={[fancyStyles.container, style]}>
      {words.map((word, wordIndex) => (
        <View key={`word-${wordIndex}`} style={fancyStyles.word}>
          {treatAsWordLevel
            ? [
                <FancyCharacter
                  key={`wordwhole-${wordIndex}`}
                  char={word}
                  currentIndex={currentIndex}
                  textProps={textProps}
                  charIndex={0}
                  wordIndex={wordIndex}
                  words={words}
                  bounce={bounce}
                />,
              ]
            : word.split("").map((char, charIndex) => (
                <FancyCharacter
                  key={`char-${wordIndex}-${charIndex}`}
                  char={char}
                  currentIndex={currentIndex}
                  textProps={textProps}
                  charIndex={charIndex}
                  wordIndex={wordIndex}
                  words={words}
                  bounce={bounce}
                />
              ))}
        </View>
      ))}
    </View>
  );
}

function FancyCharacter({
  char,
  currentIndex,
  wordIndex,
  charIndex,
  words,
  bounce = true,
  textProps,
}: {
  char: string;
  currentIndex: SharedValue<number>;
  wordIndex: number;
  charIndex: number;
  words: string[];
  bounce?: boolean;
  textProps?: TextProps & { style?: any };
}) {
  const prevIndex = useSharedValue(0);
  const mounted = useSharedValue(false);

  useDerivedValue(() => {
    mounted.value = true;
  });

  useAnimatedReaction(
    () => currentIndex.value,
    (value, prev) => {
      if (prev !== null && prev !== undefined) {
        prevIndex.value = prev;
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = currentIndex.value === wordIndex && mounted.value;
    const totalDelay = words[prevIndex.value].length * 15;
    const delay = (isActive ? totalDelay : 0) + 20 * charIndex;

    return {
      opacity: withDelay(
        delay - 20,
        applySpring(isActive ? (textProps?.style?.opacity ?? 1) : 0),
      ),
      transform: bounce
        ? [
            {
              translateY: withDelay(delay, applySpring(isActive ? 0 : 10)),
            },
            {
              scale: withDelay(
                delay,
                applySpring(currentIndex.value === wordIndex ? 1 : 0.7),
              ),
            },
          ]
        : [],
    };
  });

  return (
    <AnimatedText
      {...textProps}
      style={[fancyStyles.charText, textProps?.style, animatedStyle]}
    >
      {char}
    </AnimatedText>
  );
}

const fancyStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 44,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  word: {
    flexDirection: "row",
    position: "absolute",
  },
  charText: {
    fontSize: 30,
    fontStyle: "italic",
    transformOrigin: "bottom",
  },
});

// ─── Landing Screen ──────────────────────────────────────────────────────────

export function MeskenyGPTLandingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cyclingWords = [
    t("meskenyLanding.words.home", "home."),
    t("meskenyLanding.words.apartment", "apartment."),
    t("meskenyLanding.words.villa", "villa."),
    t("meskenyLanding.words.studio", "studio."),
    t("meskenyLanding.words.place", "place."),
  ];

  // Animation shared values
  const heroOpacity = useSharedValue(0);
  const heroTranslate = useSharedValue(12);
  const ctaOpacity = useSharedValue(0);

  // FancyText cycling index
  const wordIndex = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    heroOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    heroTranslate.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    setTimeout(() => {
      ctaOpacity.value = withTiming(1, {
        duration: 450,
        easing: Easing.out(Easing.ease),
      });
    }, 250);

    // Cycle through words every 2 s
    const interval = setInterval(() => {
      wordIndex.value = (wordIndex.value + 1) % cyclingWords.length;
    }, 2000);

    return () => clearInterval(interval);
  }, [cyclingWords.length]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    (navigation as any).navigate("AIChatScreen");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Background gradient */}
      <LinearGradient
        colors={["#FAEFE9", "#FAEFE9", "#F7DFD0", "#DA8050"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <Animated.View entering={FadeIn.duration(250)} style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>
            {t("meskenyLanding.brand", "Meskeny Model X46")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={20} color={COLORS.textSecondary} weight="regular" />
        </TouchableOpacity>
      </Animated.View>

      {/* Hero content */}
      <Animated.View style={[styles.heroWrapper, heroStyle]}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>
            {t("meskenyLanding.eyebrow", "AI HOME SEARCH")}
          </Text>

          {/* Static first line */}
          <Text style={styles.heroTitleStatic}>
            {t("meskenyLanding.heroTitle", "Let me find your next")}
          </Text>

          {/* Animated cycling word */}
          <FancyText
            words={cyclingWords}
            currentIndex={wordIndex}
            bounce
            style={styles.fancyTextContainer}
            textProps={{
              style: {
                fontSize: 30,
                fontWeight: "700",
                fontStyle: "italic",
                color: COLORS.primary,
                letterSpacing: -0.6,
              },
            } as any}
          />

          <Text style={styles.heroSubtitle}>
            {t(
              "meskenyLanding.heroSubtitle",
              "Tell MeskenyGPT what you're looking for and it will search our listings, neighborhoods, and budget fit for you.",
            )}
          </Text>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {t("meskenyLanding.chips.rent", "I want to rent")}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {t("meskenyLanding.chips.buy", "I want to buy")}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {t("meskenyLanding.chips.location", "Nouakchott center")}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* CTA block */}
      <Animated.View style={[styles.ctaWrapper, ctaStyle]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={handleStart}
        >
          <View style={styles.primaryButtonGlow} />
          <Text style={styles.primaryLabel}>
            {t("meskenyLanding.cta", "Start MeskenyGPT")}
          </Text>
          <CaretRight size={20} color={COLORS.background} weight="bold" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(300).duration(350)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          {t(
            "meskenyLanding.footer",
            "Powered by Meskeny AI • Local data",
          )}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: "#F7DFD0",
  },
  heroWrapper: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  heroTextBlock: {
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  // Static "Let me find your next" — same weight/size as before
  heroTitleStatic: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.6,
  },
  // Container for the FancyText row — gives it a bit of breathing room
  fancyTextContainer: {
    marginTop: 2,
    marginBottom: 12,
    height: 44,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  ctaWrapper: {
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    overflow: "hidden",
  },
  primaryButtonGlow: {
    position: "absolute",
    left: -10,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: COLORS.primarySoft,
  },
  primaryLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#FEF9F6",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 11,
    color: "#FFF",
  },
});

export default MeskenyGPTLandingScreen;
