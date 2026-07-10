import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, View, TextInput } from "react-native";
import { Text } from "@ui-kitten/components";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  MicrophoneStage,
  TrendUp,
  ChartBar,
  ArrowUpRight,
} from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { Send } from "lucide-react-native";
import { theme } from "../theme";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const CREAM = "#F4F1EC";
const INK = "#1C1917";
const INK_SUB = "#78716C";
const CHIP_BG = "#ECEAE6";
const CHIP_BORDER = "rgba(0,0,0,0.07)";
const INPUT_BG = "rgba(255,255,255,0.88)";
const MIC_BG = "#4F6EF7"; // blue mic button like reference

// ─── Blob: the swirling aurora at the bottom ──────────────────────────────────
function AuroraBlob() {
  const rot = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rot.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear }),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.97, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View style={styles.blobContainer} pointerEvents="none">
      <Animated.View style={[styles.blobWrap, anim]}>
        {/* Orange blob */}
        <View style={[styles.blob, styles.blobOrange]} />
        {/* Purple blob */}
        <View style={[styles.blob, styles.blobPurple]} />
        {/* Yellow blob */}
        <View style={[styles.blob, styles.blobYellow]} />
      </Animated.View>
      {/* White fade mask at top of blob area */}
      <LinearGradient
        colors={[CREAM, CREAM, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.blobMask}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── Pill chip ────────────────────────────────────────────────────────────────
function Chip({
  label,
  icon,
  delay,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  delay: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const press = () => {
    scale.value = withSequence(
      withTiming(0.94, { duration: 70 }),
      withSpring(1, { damping: 12, stiffness: 280 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(380).springify().damping(18)}
      style={anim}
    >
      <Pressable onPress={press} style={styles.chip}>
        {icon}
        <Text style={styles.chipText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Pulsing mic icon in the input bar ───────────────────────────────────────
function MicButton({ onPress }: { onPress: () => void }) {
  const ring = useSharedValue(1);
  const rop = useSharedValue(0);

  useEffect(() => {
    ring.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
    rop.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 900 }),
        withTiming(0, { duration: 900 }),
        withTiming(0, { duration: 800 }),
      ),
      -1,
    );
  }, []);

  const ringAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: rop.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.micBtn}>
      {/* Pulse ring */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.micRing, ringAnim]}
        pointerEvents="none"
      />
      <Send size={17} color="#fff" />
    </Pressable>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SharedPropertyForAi = {
  id: number | string;
  title?: string;
  listing_price?: number;
  address?: string;
  city?: string;
  image?: string | null;
  type: "sale" | string;
};

// ─── Main card ────────────────────────────────────────────────────────────────
export default function ShareWithAiAdvisorCard({
  sectionStyle,
  sharedProperty,
  previewImageUri,
  initialPrompt,
}: {
  sectionStyle?: any;
  sharedProperty: SharedPropertyForAi;
  previewImageUri?: string | null;
  initialPrompt?: string;
}) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const goToChat = (prompt?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const finalPrompt =
      prompt ??
      initialPrompt ??
      t(
        "sale.aiAdvisorInitialPrompt",
        "I want to know the market value for this property.",
      );
    navigation.navigate("AIChatScreen", {
      sharedProperty: {
        ...sharedProperty,
        image: previewImageUri ?? sharedProperty.image ?? null,
      },
      initialPrompt: finalPrompt,
    });
  };

  return (
    <View style={[sectionStyle]}>
      <Animated.View
        entering={FadeInDown.duration(500).springify().damping(20)}
        style={styles.card}
      >
        {/* ── Aurora blob ── */}
        {/* <AuroraBlob /> */}
        <Image
          source={require("../assets/shareai.png")}
          style={styles.shareaiImage}
        />

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Eyebrow */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(400)}
            style={styles.eyebrowRow}
          >
            <Text style={styles.eyebrow}>
              {t("sale.aiAdvisorEyebrow", "AI PROPERTY ADVISOR")}
            </Text>
          </Animated.View>

          {/* Headline */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(420).springify()}
          >
            <Text style={styles.headline}>
              {t("sale.aiAdvisorHeadline", "What would you\nlike to know?")}
            </Text>
          </Animated.View>

          {/* Chips row */}
          <View style={styles.chipsWrap}>
            <Chip
              delay={200}
              icon={<TrendUp size={13} color={INK_SUB} weight="bold" />}
              label={t("sale.chip1", "Market value")}
              onPress={() =>
                goToChat(
                  t(
                    "sale.aiAdvisorPromptMarketValue",
                    "What is the market value of this property?",
                  ),
                )
              }
            />
            <Chip
              delay={260}
              icon={<ChartBar size={13} color={INK_SUB} weight="bold" />}
              label={t("sale.chip2", "Luxury comps")}
              onPress={() =>
                goToChat(
                  t(
                    "sale.aiAdvisorPromptLuxuryComps",
                    "Show me luxury comparable properties for this listing.",
                  ),
                )
              }
            />
            <Chip
              delay={320}
              icon={<ArrowUpRight size={13} color={INK_SUB} weight="bold" />}
              label={t("sale.chip3", "Investment ROI")}
              onPress={() =>
                goToChat(
                  t(
                    "sale.aiAdvisorPromptROI",
                    "What is the estimated investment ROI for this property?",
                  ),
                )
              }
            />
          </View>

          {/* Input row */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(420).springify().damping(18)}
            style={styles.inputRow}
          >
            <Pressable style={styles.inputFake} onPress={() => goToChat()}>
              <Text style={styles.inputPlaceholder}>
                {t(
                  "sale.inputPlaceholder",
                  "Click to share this property with AI Advisor…",
                )}
              </Text>
            </Pressable>
            <MicButton onPress={() => goToChat()} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: CREAM,
    overflow: "hidden",
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 6,
  },

  // ── Aurora blob ──────────────────────────────────────────────────────────
  blobContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: "hidden",
  },
  blobWrap: {
    position: "absolute",
    bottom: -60,
    left: -40,
    right: -40,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.82,
  },
  blobOrange: {
    width: 220,
    height: 130,
    backgroundColor: "#F97316",
    bottom: 0,
    left: 10,
    transform: [{ rotate: "-18deg" }],
  },
  blobPurple: {
    width: 190,
    height: 110,
    backgroundColor: "#818CF8",
    bottom: 10,
    right: 0,
    transform: [{ rotate: "12deg" }],
  },
  blobYellow: {
    width: 160,
    height: 100,
    backgroundColor: "#FDE047",
    bottom: -10,
    left: 60,
    transform: [{ rotate: "5deg" }],
  },
  blobMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // ── Content ──────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    gap: 0,
  },

  eyebrowRow: {
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: INK_SUB,
    letterSpacing: 1.6,
  },

  headline: {
    fontSize: 26,
    fontWeight: "800",
    color: INK,
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 20,
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 80, // space for blob to show through
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: INK,
    letterSpacing: -0.1,
  },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  inputFake: {
    flex: 1,
    paddingVertical: 6,
  },
  inputPlaceholder: {
    fontSize: 13,
    fontWeight: "500",
    color: INK_SUB,
    letterSpacing: -0.1,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: theme["color-temporary-primary2"],
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    shadowColor: theme["color-temporary-primary3"],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  micRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme["color-temporary-primary3"],
  },
  shareaiImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 50,
  },
});
