import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  LayoutChangeEvent,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

// ─────────────────────────────────────────────
export type SearchTab = "sell" | "properties" | "landmarks";

export interface SearchScreenHeaderProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  headerRef: React.RefObject<View | null>;
  onLayout: (event: LayoutChangeEvent) => void;
  location?: string;
  searchPlaceholder: string;
  propertyFilters: {
    filters: Record<string, any>;
    applyFilters: (filters: any) => void;
  };
}

const TABS: { key: SearchTab; labelKey: string; fallback: string }[] = [
  { key: "properties", labelKey: "search.properties", fallback: "Buy" },
  { key: "sell", labelKey: "search.sell", fallback: "Sell" },
  { key: "landmarks", labelKey: "search.lands", fallback: "Lands" },
];

// ─── AI button animations ────────────────────────────────────────────────────
const useAIPulse = () => {
  const ring = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scale breath
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1.055,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Glow colour shift (useNativeDriver: false required for colour interpolation)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  return { ring, glow };
};

// ─── Main component ──────────────────────────────────────────────────────────
export const SearchScreenHeader: React.FC<SearchScreenHeaderProps> = ({
  activeTab,
  onTabChange,
  headerRef,
  onLayout,
  location,
  searchPlaceholder,
  propertyFilters,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { ring, glow } = useAIPulse();

  // Search bar press micro-bounce
  const searchScale = useRef(new Animated.Value(1)).current;

  // Fade-in on mount
  const mountOpacity = useRef(new Animated.Value(0)).current;
  const mountY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mountOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(mountY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabPress = useCallback(
    (tab: SearchTab) => {
      Haptics.selectionAsync().catch(() => {});
      onTabChange(tab);
    },
    [onTabChange],
  );

  const handleSearchPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(searchScale, {
        toValue: 0.97,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(searchScale, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start();
    (navigation as any).navigate("Filter", {
      initialFilters: propertyFilters.filters,
      onApply: (f: any) => propertyFilters.applyFilters(f),
    });
  }, [navigation, propertyFilters, searchScale]);

  const handleAIPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    (navigation as any).navigate("MeskenyGPTLanding");
  }, [navigation]);

  // Animated ring border: near-black ↔ soft indigo
  const ringBorderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(14,14,18,0.9)", "rgba(105,94,255,0.8)"],
  });

  return (
    <Animated.View
      ref={headerRef as any}
      onLayout={onLayout}
      style={[
        styles.wrapper,
        { opacity: mountOpacity, transform: [{ translateY: mountY }] },
      ]}
    >
      {/* ── Search bar + AI button ───────────────────────────── */}
      <View style={styles.searchRow}>
        {/* Search bar */}
        <Animated.View
          style={[
            styles.searchBarWrap,
            { transform: [{ scale: searchScale }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleSearchPress}
            style={styles.searchBar}
          >
            <MaterialIcons name="search" size={20} color="#ABABAB" />

            <Text style={styles.searchText} numberOfLines={1}>
              {location || searchPlaceholder}
            </Text>

            {/* Right: divider + filter icon */}
            <View style={styles.filterHint}>
              <View style={styles.filterDivider} />
              <MaterialIcons name="tune" size={16} color="#ABABAB" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* AI circle button */}
        <Animated.View
          style={[styles.aiWrap, { transform: [{ scale: ring }] }]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleAIPress}
            style={styles.aiShadowWrap}
          >
            <Animated.View
              style={[styles.aiRing, { borderColor: ringBorderColor }]}
            >
              <LinearGradient
                colors={["#161618", "#1D1D24"]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={styles.aiGradient}
              >
                <Text style={styles.aiSparkle}>✦</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.55}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.tabActive : styles.tabInactive,
                ]}
              >
                {t(tab.labelKey, tab.fallback)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const BTN = 46; // circle diameter

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 54 : 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
  },

  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },

  searchBarWrap: {
    flex: 1,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: BTN,
    backgroundColor: "#F4F4F4",
    borderRadius: BTN / 2,
    paddingHorizontal: 14,
    gap: 8,
    // Barely-there shadow so it feels elevated without being noisy
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  searchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: "#888888",
    letterSpacing: -0.1,
  },

  filterHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  filterDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: "#D0D0D0",
  },

  // AI button
  aiWrap: {
    width: BTN,
    height: BTN,
  },

  aiShadowWrap: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    // Shadow sits outside overflow:hidden, so placed here
    shadowColor: "#0F0F14",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },

  aiRing: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    borderWidth: 1.5,
    overflow: "hidden",
  },

  aiGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  aiSparkle: {
    fontSize: 18,
    color: "#FFFFFF",
    includeFontPadding: false,
    lineHeight: 22,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },

  tabItem: {
    paddingVertical: 11,
    paddingRight: 22,
  },

  tabText: {
    fontSize: 15,
    letterSpacing: -0.3,
  },

  tabActive: {
    fontWeight: "700",
    color: "#0A0A0A",
  },

  tabInactive: {
    fontWeight: "600",
    color: "#C2C2C2",
  },
});
