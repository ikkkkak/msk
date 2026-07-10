import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
  useDerivedValue,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { ReactNode } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  BlurMask,
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { theme } from "../theme";
import { LinearGradient } from "expo-linear-gradient";
import {
  FAB_SEGMENT_H_PAD,
  segmentWidthFromLabel,
  useMeasuredLabelWidth,
} from "../utils/fabPillLayout";

// ============================================================================
// Constants
// ============================================================================

// **To make the shared pill (the dual-segment pill at the bottom) less tall, decrease `DEFAULT_FAB_SIZE` and related "size" usages.**
// For more vertical crunch, decrease DEFAULT_FAB_SIZE (default: 20) and keep changes consistent through usages.
// For even more height reduction, you can also slightly adjust paddingVertical/padding/height in the styles at the end.

const DEFAULT_FAB_SIZE = 16; // DECREASED from 20 to 16 for lower pill height!
const DEFAULT_FAB_BOTTOM = 24;
const DEFAULT_FAB_RIGHT = 24;
const DEFAULT_FAB_BACKGROUND_COLOR = "#222222";
const CARD_FINAL_HEIGHT = 302;
const CARD_BORDER_RADIUS = 24;
const MENU_ITEM_HEIGHT = 64;
const STAGGER_DELAY_MS = 80;
const CARD_VERTICAL_POSITION_PERCENT = 0.62;

// Animation timing
const CARD_EXPANSION_DURATION = 450;
const OVERLAY_FADE_DURATION = 300;
const MENU_ITEM_FADE_DURATION = 250;

// Easing functions
const CARD_EXPANSION_EASING = Easing.out(Easing.cubic);
const OVERLAY_EASING = Easing.out(Easing.ease);
const MENU_ITEM_EASING = Easing.out(Easing.ease);

// ============================================================================
// Types
// ============================================================================

export interface FABAction {
  title: string;
  icon: ReactNode;
  onPress: () => void;
  color?: string;
}

export interface FloatingActionButtonProps {
  actions: FABAction[];
  position?: { bottom: number; right: number };
  size?: number;
  backgroundColor?: string;
  /** Show Meskeny AI button (glow) to the right of the add FAB. Default true. */
  showMeskenyAi?: boolean;
  /** Override default navigation to MeskenyGPT landing */
  onPressMeskenyAi?: () => void;
}

const FAB_CLUSTER_GAP = 0;
const DIVIDER_WIDTH = 1;
const ADD_MIN_WIDTH = 52;
const MESKENY_MIN_WIDTH = 88;

function aiClusterOffsetFromTrailingEdge(meskenyBlockWidth: number) {
  return FAB_CLUSTER_GAP + DIVIDER_WIDTH + FAB_CLUSTER_GAP + meskenyBlockWidth;
}

function meskenyRoundedRightPathSvg(w: number, h: number): string {
  const R = h / 2;
  const xInner = w - R;
  return `M 0 0 L ${xInner} 0 A ${R} ${R} 0 0 1 ${w} ${R} L ${w} ${h - R} A ${R} ${R} 0 0 1 ${xInner} ${h} L 0 ${h} Z`;
}

// ============================================================================
// Meskeny segment only — traveling sweep (Add side has no glow)
// ============================================================================

const glowyPillGlowColors = [
  "rgba(209, 96, 36, 0.22)",
  "rgba(209, 96, 36, 0.35)",
  "rgba(209, 96, 36, 0.18)",
];
const glowyPillPositions = [0, 0.52, 1];
const travelingPillColors = [
  "transparent",
  theme["color-temporary-primary"],
  theme["color-temporary-primary1"],
  "transparent",
];
const travelingPillPositions = [0.28, 0.72, 0.42, 1];

const MeskenyTravelingGlow: React.FC<{
  width: number;
  height: number;
}> = ({ width, height }) => {
  const w = width;
  const h = height;
  const strokeTravel = 1.55;
  const strokeGlow = 2.95;

  const path = useMemo(() => {
    const d = meskenyRoundedRightPathSvg(w, h);
    return Skia.Path.MakeFromSVGString(d);
  }, [w, h]);

  const rotation = useSharedValue(0);
  const rotationSlow = useSharedValue(0);
  const blurIntensity = useSharedValue(10);

  useEffect(() => {
    const finalValue = 1e6;
    rotation.value = withTiming(finalValue, {
      duration: (finalValue / (Math.PI * 2)) * 4200,
      easing: Easing.linear,
    });
    rotationSlow.value = withTiming(finalValue, {
      duration: (finalValue / (Math.PI * 2)) * 78000,
      easing: Easing.linear,
    });
  }, [rotation, rotationSlow]);

  const animatedRotation = useDerivedValue(() => {
    "worklet";
    return [{ rotate: rotation.value % (Math.PI * 2) }];
  });
  const animatedRotationSlow = useDerivedValue(() => {
    "worklet";
    return [{ rotate: rotationSlow.value % (Math.PI * 2) }];
  });

  const cx = w / 2;
  const cy = h / 2;

  if (!path) {
    return null;
  }

  return (
    <Canvas
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: w,
        height: h,
        zIndex: 1,
      }}
    >
      <Path
        path={path}
        opacity={0.5}
        strokeWidth={strokeGlow}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
      >
        <SweepGradient
          transform={animatedRotationSlow}
          origin={vec(cx, cy)}
          c={vec(cx, cy)}
          colors={glowyPillGlowColors}
          positions={glowyPillPositions}
        />
        <BlurMask blur={blurIntensity} />
      </Path>
      <Path
        path={path}
        style="stroke"
        opacity={0.95}
        strokeWidth={strokeTravel}
        strokeCap="round"
        strokeJoin="round"
      >
        <SweepGradient
          transform={animatedRotation}
          origin={vec(cx, cy)}
          c={vec(cx, cy)}
          colors={travelingPillColors}
          positions={travelingPillPositions}
        />
      </Path>
    </Canvas>
  );
};

// ============================================================================
// Component
// ============================================================================

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = { bottom: DEFAULT_FAB_BOTTOM, right: DEFAULT_FAB_RIGHT },
  size = DEFAULT_FAB_SIZE,
  backgroundColor = DEFAULT_FAB_BACKGROUND_COLOR,
  showMeskenyAi = true,
  onPressMeskenyAi,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const addLabel = t("fab.add", "Add");
  const { width: addLabelW, onLayout: onAddLabelLayout } =
    useMeasuredLabelWidth(28);
  const { width: meskenyLabelW, onLayout: onMeskenyLabelLayout } =
    useMeasuredLabelWidth(72);

  const addFabW = showMeskenyAi
    ? segmentWidthFromLabel(addLabelW, {
        icon: true,
        min: ADD_MIN_WIDTH,
        hPad: FAB_SEGMENT_H_PAD,
      })
    : size;
  const meskenyBlockWidth = Math.max(
    MESKENY_MIN_WIDTH,
    segmentWidthFromLabel(meskenyLabelW, {
      icon: false,
      min: MESKENY_MIN_WIDTH,
      hPad: FAB_SEGMENT_H_PAD,
    }),
  );
  const clusterTrailing = showMeskenyAi
    ? aiClusterOffsetFromTrailingEdge(meskenyBlockWidth)
    : 0;
  const fabCollapsedRight = position.right + clusterTrailing;
  const barTotalWidth = showMeskenyAi ? addFabW + clusterTrailing : size;

  const navigateMeskeny = React.useCallback(() => {
    if (onPressMeskenyAi) {
      onPressMeskenyAi();
      return;
    }
    (navigation as any).navigate("MeskenyGPTLanding");
  }, [navigation, onPressMeskenyAi]);

  // ========================================================================
  // Shared Values - Animation State
  // ========================================================================

  const animationProgress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const menuItemOpacities = actions.map(() => useSharedValue(0));
  const menuItemTranslates = actions.map(() => useSharedValue(20));

  // ========================================================================
  // Position Calculations
  // ========================================================================

  const CARD_FINAL_WIDTH = Math.max(320, SCREEN_WIDTH * 0.9);

  const fabInitialX = SCREEN_WIDTH - fabCollapsedRight - addFabW / 2;
  const fabInitialY = SCREEN_HEIGHT - position.bottom - size / 2;

  const cardFinalX = SCREEN_WIDTH / 2 - CARD_FINAL_WIDTH / 2;
  const cardFinalY =
    SCREEN_HEIGHT * CARD_VERTICAL_POSITION_PERCENT - CARD_FINAL_HEIGHT / 2;

  const headerPadding = 20;
  const closeButtonSize = 62;
  const fabFinalX =
    cardFinalX + CARD_FINAL_WIDTH - headerPadding - closeButtonSize / 2;
  const fabFinalY = cardFinalY + headerPadding + closeButtonSize / 2;

  // ========================================================================
  // Animation Functions
  // ========================================================================

  const toggleMenu = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);

    animationProgress.value = withTiming(newState ? 1 : 0, {
      duration: CARD_EXPANSION_DURATION,
      easing: CARD_EXPANSION_EASING,
    });

    overlayOpacity.value = withTiming(newState ? 1 : 0, {
      duration: OVERLAY_FADE_DURATION,
      easing: OVERLAY_EASING,
    });

    const menuItemStartDelay = newState ? 100 : 0;
    actions.forEach((_, index) => {
      const delay = newState
        ? menuItemStartDelay + index * STAGGER_DELAY_MS
        : 0;

      setTimeout(() => {
        menuItemOpacities[index].value = withTiming(newState ? 1 : 0, {
          duration: MENU_ITEM_FADE_DURATION,
          easing: MENU_ITEM_EASING,
        });
        menuItemTranslates[index].value = withTiming(newState ? 0 : 20, {
          duration: MENU_ITEM_FADE_DURATION,
          easing: MENU_ITEM_EASING,
        });
      }, delay);
    });
  };

  const collapseMenu = React.useCallback(() => {
    if (!isExpanded) return;
    setIsExpanded(false);
    animationProgress.value = withTiming(0, {
      duration: OVERLAY_FADE_DURATION,
      easing: OVERLAY_EASING,
    });
    overlayOpacity.value = withTiming(0, {
      duration: OVERLAY_FADE_DURATION,
      easing: OVERLAY_EASING,
    });
    actions.forEach((_, index) => {
      menuItemOpacities[index].value = withTiming(0, {
        duration: MENU_ITEM_FADE_DURATION,
        easing: MENU_ITEM_EASING,
      });
      menuItemTranslates[index].value = withTiming(20, {
        duration: MENU_ITEM_FADE_DURATION,
        easing: MENU_ITEM_EASING,
      });
    });
  }, [actions, animationProgress, isExpanded, menuItemOpacities, menuItemTranslates, overlayOpacity]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        collapseMenu();
      };
    }, [collapseMenu]),
  );

  const handleActionPress = (action: FABAction) => {
    toggleMenu();
    setTimeout(() => {
      action.onPress();
    }, CARD_EXPANSION_DURATION / 2);
  };

  const handleBackdropPress = () => {
    if (isExpanded) {
      toggleMenu();
    }
  };

  const backdropTap = Gesture.Tap().onEnd(() => {
    runOnJS(handleBackdropPress)();
  });

  // ========================================================================
  // Animated Styles
  // ========================================================================

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const cardScale = interpolate(
      animationProgress.value,
      [0, 1],
      [0.1, 1.0],
      Extrapolate.CLAMP,
    );

    const cardWidth = interpolate(
      animationProgress.value,
      [0, 1],
      [showMeskenyAi ? addFabW : size, CARD_FINAL_WIDTH],
      Extrapolate.CLAMP,
    );

    const cardHeight = interpolate(
      animationProgress.value,
      [0, 1],
      [size, CARD_FINAL_HEIGHT],
      Extrapolate.CLAMP,
    );

    const cardX = interpolate(
      animationProgress.value,
      [0, 1],
      [fabInitialX, cardFinalX],
      Extrapolate.CLAMP,
    );

    const cardY = interpolate(
      animationProgress.value,
      [0, 1],
      [fabInitialY, cardFinalY],
      Extrapolate.CLAMP,
    );

    const borderRadius = interpolate(
      animationProgress.value,
      [0, 1],
      [size / 2, CARD_BORDER_RADIUS],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      animationProgress.value,
      [0, 0.2, 1],
      [0, 0.95, 1],
      Extrapolate.CLAMP,
    );

    return {
      position: "absolute",
      left: cardX,
      top: cardY,
      width: cardWidth,
      height: cardHeight,
      opacity,
      borderRadius,
      transform: [{ scale: cardScale }],
    };
  });

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const finalBottom = SCREEN_HEIGHT - fabFinalY - closeButtonSize / 2;
    const finalRight = SCREEN_WIDTH - fabFinalX - closeButtonSize / 2;

    const fabBottom = interpolate(
      animationProgress.value,
      [0, 1],
      [position.bottom, finalBottom],
      Extrapolate.CLAMP,
    );

    const fabRight = interpolate(
      animationProgress.value,
      [0, 1],
      [fabCollapsedRight, finalRight],
      Extrapolate.CLAMP,
    );

    const p = animationProgress.value;
    const startW = showMeskenyAi ? addFabW : size;

    const fabWidth = interpolate(
      p,
      [0, 1],
      [startW, closeButtonSize],
      Extrapolate.CLAMP,
    );
    const fabHeight = interpolate(
      p,
      [0, 1],
      [size, closeButtonSize],
      Extrapolate.CLAMP,
    );

    const iconRotation = interpolate(p, [0, 1], [0, 45], Extrapolate.CLAMP);

    const endR = closeButtonSize / 2;
    const flatEdge = showMeskenyAi ? 0 : size / 2;
    const borderTopLeft = interpolate(
      p,
      [0, 1],
      [size / 2, endR],
      Extrapolate.CLAMP,
    );
    const borderBottomLeft = interpolate(
      p,
      [0, 1],
      [size / 2, endR],
      Extrapolate.CLAMP,
    );
    const borderTopRight = interpolate(
      p,
      [0, 1],
      [flatEdge, endR],
      Extrapolate.CLAMP,
    );
    const borderBottomRight = interpolate(
      p,
      [0, 1],
      [flatEdge, endR],
      Extrapolate.CLAMP,
    );

    return {
      position: "absolute",
      bottom: fabBottom,
      right: fabRight,
      width: fabWidth,
      height: fabHeight,
      borderTopLeftRadius: borderTopLeft,
      borderTopRightRadius: borderTopRight,
      borderBottomLeftRadius: borderBottomLeft,
      borderBottomRightRadius: borderBottomRight,
      overflow: "hidden",
      transform: [{ rotate: `${iconRotation}deg` }],
    };
  });

  const addLabelAnimatedStyle = useAnimatedStyle(() => {
    const p = animationProgress.value;
    return {
      opacity: showMeskenyAi
        ? interpolate(p, [0, 0.38], [1, 0], Extrapolate.CLAMP)
        : 0,
    };
  });

  const fabPlusIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const iconScaleAnimatedStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(
      animationProgress.value,
      [0, 1],
      [1, 0.85],
      Extrapolate.CLAMP,
    );
    return {
      transform: [{ scale: iconScale }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
      pointerEvents: isExpanded ? "auto" : "none",
    };
  });

  const aiClusterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animationProgress.value,
      [0, 0.15, 1],
      [1, 0, 0],
      Extrapolate.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          animationProgress.value,
          [0, 0.2],
          [0, 6],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  const getMenuItemAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      return {
        opacity: menuItemOpacities[index].value,
        transform: [
          {
            translateY: menuItemTranslates[index].value,
          },
        ],
      };
    });
  };

  // ========================================================================
  // Cleanup
  // ========================================================================

  useEffect(() => {
    return () => {
      animationProgress.value = 0;
      overlayOpacity.value = 0;
      menuItemOpacities.forEach((item) => {
        item.value = 0;
      });
      menuItemTranslates.forEach((item) => {
        item.value = 20;
      });
    };
  }, []);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      {/* Backdrop Overlay */}
      <Animated.View
        style={[styles.backdrop, overlayAnimatedStyle]}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        <GestureDetector gesture={backdropTap}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        </GestureDetector>
      </Animated.View>

      {/* Expanded Card - Grows from FAB to lower section */}
      <Animated.View
        style={[styles.cardContainer, cardAnimatedStyle]}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        <View style={styles.card}>
          {/* Card Header with Close Button Space */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t("fab.addListing", "Add Listing")}
            </Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>
          <View style={styles.menuItemsContainer}>
            {actions.map((action, index) => {
              const itemStyle = getMenuItemAnimatedStyle(index);
              return (
                <Animated.View key={`fab-action-${index}`} style={itemStyle}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleActionPress(action)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuItemIconContainer,
                        action.color && { backgroundColor: action.color },
                      ]}
                    >
                      {action.icon}
                    </View>
                    <Text style={styles.menuItemText}>{action.title}</Text>
                    <View style={styles.menuItemArrow}>
                      <Text style={styles.menuItemArrowText}>›</Text>
                    </View>
                  </TouchableOpacity>
                  {index < actions.length - 1 && (
                    <View style={styles.menuItemDivider} />
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Add surface (no glow) + Meskeny segment with traveling outline only on the right */}
      {showMeskenyAi && (
        <Animated.View
          style={[
            styles.sharedPillWrap,
            {
              bottom: position.bottom,
              right: position.right,
              width: barTotalWidth,
              height: size, // this is the PILL HEIGHT: to decrease, lower DEFAULT_FAB_SIZE or pass a smaller size prop!
            },
            aiClusterAnimatedStyle,
          ]}
          pointerEvents={isExpanded ? "none" : "box-none"}
        >
          <View style={styles.fabClusterRow}>
            <View
              style={[
                styles.addSegment,
                {
                  width: addFabW,
                  height: size, // the height of the ADD segment (left part of the shared pill)
                  borderTopLeftRadius: size / 2,
                  borderBottomLeftRadius: size / 2,
                },
              ]}
              pointerEvents="none"
            />

            <View
              style={[
                styles.meskenySegmentOuter,
                { width: meskenyBlockWidth },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.meskenySegmentFill,
                  {
                    width: meskenyBlockWidth,
                    height: size,
                    borderTopRightRadius: size / 2,
                    borderBottomRightRadius: size / 2,
                  },
                ]}
              />
              <MeskenyTravelingGlow width={meskenyBlockWidth} height={size} />
              <Pressable
                onPress={navigateMeskeny}
                accessibilityRole="button"
                accessibilityLabel={t("fab.meskenyGpt", "MeskenyGPT")}
                hitSlop={8}
                android_ripple={{
                  color: "rgba(209, 96, 36, 0.12)",
                  foreground: true,
                }}
                style={({ pressed }) => [styles.meskenyPillPress]}
              >
                <Text
                  style={styles.meskenyPillLabel}
                  numberOfLines={1}
                  onLayout={onMeskenyLabelLayout}
                >
                  <Text style={styles.meskenyBrand}>Meskeny</Text>
                  <Text style={styles.meskenySuffix}>GPT</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Add FAB — transforms into card header close button (transparent when on shared pill) */}
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <TouchableOpacity
          style={[
            styles.fabButton,
            showMeskenyAi ? styles.fabButtonOnPill : null,
            showMeskenyAi && { borderRadius: 0 },
            {
              backgroundColor: showMeskenyAi ? "transparent" : backgroundColor,
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.9}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <View style={styles.fabButtonInner}>
            <Animated.Text
              style={[styles.fabAddLabel, addLabelAnimatedStyle]}
              numberOfLines={1}
              onLayout={onAddLabelLayout}
            >
              {addLabel}
            </Animated.Text>
            <Animated.View
              style={[
                styles.fabIconContainer,
                fabPlusIconAnimatedStyle,
                iconScaleAnimatedStyle,
              ]}
            >
              <View
                style={[
                  styles.fabIconLine,
                  { transform: [{ rotate: "0deg" }] },
                ]}
              />
              <View
                style={[
                  styles.fabIconLine,
                  { transform: [{ rotate: "90deg" }] },
                ]}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  fabContainer: {
    position: "absolute",
    zIndex: 10001,
    justifyContent: "center",
    alignItems: "center",
  },
  sharedPillWrap: {
    position: "absolute",
    zIndex: 10000,
    overflow: "visible",
    // If you want even less vertical space, you can add: paddingVertical: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.11,
        shadowRadius: 14,
      },
      android: { elevation: 7 },
    }),
  },
  fabClusterRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    // If you want less vertical space, you could add: alignItems: "center",
  },
  fabClusterGap: {
    width: FAB_CLUSTER_GAP,
  },
  addSegment: {
    backgroundColor: "#FFFFFF",
    // Optionally you could also reduce paddingVertical here if wanted
  },
  meskenySegmentOuter: {
    position: "relative",
    overflow: "visible",
    justifyContent: "center",
  },
  meskenySegmentFill: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 0,
  },
  fabDivider: {
    width: DIVIDER_WIDTH,
    alignSelf: "center",
    borderRadius: 1,
    backgroundColor: "rgba(15, 23, 42, 0.07)",
  },
  meskenyPillPress: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: FAB_SEGMENT_H_PAD,
    zIndex: 2,
  },
  meskenyPillPressIOS: {
    backgroundColor: "rgba(209, 96, 36, 0.06)",
  },
  meskenyPillLabel: {
    fontSize: 15,

    fontWeight: "600",
    letterSpacing: -0.18,
    includeFontPadding: false,
    // If you want the label to appear even tighter, you can drop the fontSize
  },
  meskenyBrand: {
    fontSize: 15,
    fontWeight: "700",
    color: theme["color-temporary-primary"],
    letterSpacing: -0.18,
  },
  meskenySuffix: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(51, 65, 85, 0.72)",
    letterSpacing: -0.14,
  },
  fabButton: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    borderRadius: 999,
    backgroundColor: "#FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonInner: {
    flex: 1,
    width: "100%",
    height: "100%",
    flexDirection: "row",
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  fabAddLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  fabButtonOnPill: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  fabIconContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  fabIconLine: {
    position: "absolute",
    width: 12,
    height: 2.5,
    backgroundColor: theme["color-temporary-primary"],
    borderRadius: 1,
  },
  cardContainer: {
    position: "absolute",
    zIndex: 10001,
    overflow: "hidden",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 0,
    borderBottomColor: "#FFF",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
    flex: 1,
  },
  closeButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  menuItemsContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: MENU_ITEM_HEIGHT,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  menuItemArrow: {
    marginLeft: 8,
  },
  menuItemArrowText: {
    fontSize: 24,
    color: "#9CA3AF",
    fontWeight: "300",
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: "#FFF",
    marginLeft: 72,
  },
});

export default FloatingActionButton;

/**
 * --- WHERE TO CONTINUE DECREASING shared pill HEIGHT ---
 *
 * 1. Lower DEFAULT_FAB_SIZE even more, or pass a smaller size prop to <FloatingActionButton /> for instant visual change.
 * 2. In render: the "height: size" in styles.sharedPillWrap and inner sections governs true height.
 * 3. To reduce vertical padding further: ensure `styles.meskenyPillPress` and the outer pill container have *absolutely minimal* vertical padding/margin; avoid adding any `paddingVertical`.
 * 4. If you want to also shrink label fontSize, edit `styles.meskenyPillLabel`, `meskenyBrand`, `meskenySuffix`.
 * 5. For even less vertical space, set MESKENY_BLOCK_H_PAD lower, but this mostly affects width.
 *
 * TLDR:
 * - Lower DEFAULT_FAB_SIZE, and use the "size" prop for finer control.
 * - Keep paddingVertical = 0 for all wrappers, and don't give minHeight > needed.
 * - The above has already made it shorter; repeat those steps to go even smaller.
 */
