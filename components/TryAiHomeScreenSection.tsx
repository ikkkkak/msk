import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Sparkle, ChatCircle, CaretRight } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { Image, ImageBackground } from "expo-image";

const BLACK = "#111827";
const MUTED = "#6B7280";

export const TryAiHomeScreenSection = React.memo(function TryAiHomeScreenSection() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  React.useEffect(() => {
    // expo-image cache helps make this banner feel instant inside lists.
    // For local assets this is typically already fast, but the prefetch is best-effort.
    Image.prefetch(require("../assets/Frame-71.jpg")).catch(() => {});
  }, []);

  const go = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate("MeskenyGPTLanding");
  };

  return (
    <Pressable
      onPress={go}
      style={s.wrap}
      android_ripple={{ color: "#00000014" }}
    >
      <ImageBackground
        source={require("../assets/Frame-71.jpg")}
        style={s.bg}
        imageStyle={s.bgImg}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      >
        {/* Soft overlay to keep typography readable */}
        {/* <View style={s.overlay} /> */}

        <View style={s.content}>
          {/* <View style={s.topRow}>
            <View style={s.pill}>
              <Sparkle size={14} color={BLACK} weight="fill" />
              <Text style={s.pillText}>AI HOME SEARCH</Text>
            </View>

            <View style={s.ctaPill}>
              <Text style={s.ctaText}>Try</Text>
              <CaretRight size={14} color={BLACK} weight="bold" />
            </View>
          </View> */}

          <Text style={s.title}>{t("tryai.title", "Try MeskenyGPT")}</Text>

          <View style={s.cardsRow}>
            {/* <View style={s.miniCard}>
              <ChatCircle size={16} color={BLACK} weight="fill" />
              <Text style={s.miniTitle}>Ask anything</Text>
              <Text style={s.miniSub} numberOfLines={2}>
                Market value, comparables, area insights.
              </Text>
            </View> */}

            <View style={s.miniCard}>
              <Sparkle size={16} color={BLACK} weight="fill" />
              <Text style={s.miniTitle}>{t("tryai.smartPicksTitle")}</Text>
              <Text style={s.miniSub} numberOfLines={2}>
                {t("tryai.smartPicksSubtitle")}
              </Text>
            </View>
          </View>

          {/* <Text style={s.footerText} numberOfLines={2}>
            Let AI help you shortlist faster, with clean recommendations and
            real listings.
          </Text> */}
          <View style={s.pill}>
            <Sparkle size={14} color={BLACK} weight="fill" />
            <Text style={s.pillText}>{t("tryai.pill")}</Text>
            <CaretRight size={14} color={BLACK} weight="bold" />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
});

const s = StyleSheet.create({
  wrap: { width: "100%" },
  bg: {
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 210,
    backgroundColor: "#EEF2F7",
  },
  bgImg: {
    borderRadius: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.68)",
  },
  content: {
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    justifyContent: "center",
    alignSelf: "center",
    borderColor: "rgba(17,24,39,0.08)",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    color: BLACK,
    letterSpacing: 0.9,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  ctaText: { fontSize: 12, fontWeight: "800", color: BLACK },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "white",
    letterSpacing: -0.2,
    textAlign: "center",
    marginBottom: 10,
  },
  cardsRow: { paddingTop: 30, justifyContent: "center", alignItems: "center" },
  miniCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
  },
  miniTitle: { fontSize: 12, fontWeight: "900", color: BLACK, marginTop: 8 },
  miniSub: { fontSize: 11, color: MUTED, marginTop: 4, lineHeight: 16 },
  footerText: { fontSize: 12, color: MUTED, lineHeight: 18, marginTop: 2 },
});
