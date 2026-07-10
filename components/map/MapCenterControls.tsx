/**
 * Minimal bottom bar: Map (left) + MeskenyGPT (right), shared pill — width hugs label text.
 */
import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
  useWindowDimensions,
  I18nManager,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapTrifold, Sparkle } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import {
  FAB_SEGMENT_GAP,
  FAB_SEGMENT_H_PAD,
  FAB_SEGMENT_ICON,
} from "../../utils/fabPillLayout";

const BAR_MIN_HEIGHT = 44;
const HORIZONTAL_INSET = 12;
const BOTTOM_GAP = 10;
const SPRING = { damping: 22, stiffness: 280, mass: 0.8 };

type Props = {
  listViewMode?: boolean;
  onToggleView?: () => void;
  onMeskenyPress?: () => void;
  hidden?: boolean;
  /** Extra lift when lot card or other bottom UI is visible */
  bottomOffset?: number;
};

export function MapCenterControls({
  listViewMode,
  onToggleView,
  onMeskenyPress,
  hidden = false,
  bottomOffset = 0,
}: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isRtl =
    I18nManager.isRTL || (i18n.language || "").toLowerCase().startsWith("ar");

  const scaleMap = useSharedValue(1);
  const scaleGpt = useSharedValue(1);

  const bottom = BOTTOM_GAP + Math.min(insets.bottom, 12) + bottomOffset;
  const maxBarWidth = Math.max(200, screenWidth - HORIZONTAL_INSET * 2);

  const mapLabel =
    listViewMode !== undefined
      ? listViewMode
        ? t("search.showMap", "Show map")
        : t("search.showList", "Show list")
      : t("map.button", "Map");

  const gptLabel = t("fab.meskenyGpt", "MeskenyGPT");

  const mapAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleMap.value }],
  }));
  const gptAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleGpt.value }],
  }));

  const pressIn = (sv: typeof scaleMap) => {
    sv.value = withTiming(0.96, { duration: 80 });
  };
  const pressOut = (sv: typeof scaleMap) => {
    sv.value = withSpring(1, SPRING);
  };

  if (hidden) return null;

  return (
    <View
      style={[styles.host, { bottom, maxWidth: maxBarWidth }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          { minHeight: BAR_MIN_HEIGHT, maxWidth: maxBarWidth },
          isRtl && styles.barRtl,
        ]}
      >
        <Animated.View style={[styles.sideWrap, mapAnimStyle]}>
          <Pressable
            style={[styles.side, isRtl ? styles.sideRight : styles.sideLeft]}
            onPress={() => {
              if (!onToggleView) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onToggleView();
            }}
            onPressIn={() => pressIn(scaleMap)}
            onPressOut={() => pressOut(scaleMap)}
            disabled={!onToggleView}
            accessibilityRole="button"
            accessibilityLabel={mapLabel}
          >
            <MapTrifold size={FAB_SEGMENT_ICON} color="#222222" weight="bold" />
            <Text
              style={[styles.sideText, isRtl && styles.sideTextRtl]}
              numberOfLines={1}
            >
              {mapLabel}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.divider} />

        <Animated.View style={[styles.sideWrap, gptAnimStyle]}>
          <Pressable
            style={[styles.side, isRtl ? styles.sideLeft : styles.sideRight]}
            onPress={() => {
              if (!onMeskenyPress) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onMeskenyPress();
            }}
            onPressIn={() => pressIn(scaleGpt)}
            onPressOut={() => pressOut(scaleGpt)}
            disabled={!onMeskenyPress}
            accessibilityRole="button"
            accessibilityLabel={gptLabel}
          >
            <Sparkle size={FAB_SEGMENT_ICON} color="#222222" weight="duotone" />
            <Text
              style={[styles.sideText, isRtl && styles.sideTextRtl]}
              numberOfLines={1}
            >
              {gptLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    zIndex: 10060,
    elevation: 10060,
    alignSelf: "center",
    left: HORIZONTAL_INSET,
    right: HORIZONTAL_INSET,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "center",
    flexShrink: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: BAR_MIN_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  barRtl: {
    flexDirection: "row-reverse",
  },
  sideWrap: {
    flexShrink: 1,
    minWidth: 0,
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: FAB_SEGMENT_GAP,
    paddingHorizontal: FAB_SEGMENT_H_PAD,
    paddingVertical: 8,
    minHeight: BAR_MIN_HEIGHT,
  },
  sideLeft: {
    borderTopLeftRadius: BAR_MIN_HEIGHT / 2,
    borderBottomLeftRadius: BAR_MIN_HEIGHT / 2,
  },
  sideRight: {
    borderTopRightRadius: BAR_MIN_HEIGHT / 2,
    borderBottomRightRadius: BAR_MIN_HEIGHT / 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "center",
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  sideText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
    letterSpacing: -0.1,
    flexShrink: 1,
    includeFontPadding: false,
  },
  sideTextRtl: {
    writingDirection: "rtl",
  },
});
