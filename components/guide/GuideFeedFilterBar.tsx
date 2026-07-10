import React, { useMemo } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { IconProps } from "phosphor-react-native";
import {
  BellRinging,
  SquaresFour,
  Flame,
  Lightbulb,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { guideTheme as G } from "./guideTheme";

export type GuideFeedFilterKey = "all" | "needs_action" | "urgent" | "action";

type FilterTone = {
  icon: string;
  iconBg: string;
  activeBg: string;
  activeBorder: string;
  activeLabel: string;
};

type FilterDef = {
  key: GuideFeedFilterKey;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<IconProps>;
  tone: FilterTone;
};

type Props = {
  value: GuideFeedFilterKey;
  onChange: (key: GuideFeedFilterKey) => void;
};

const GRID_GAP = 10;
const H_PAD = 16;

function buildFilters(t: (key: string, def: string) => string): FilterDef[] {
  return [
    {
      key: "needs_action",
      label: t("meskenyGuide.filterNeeds", "Needs action"),
      subtitle: t(
        "meskenyGuide.filterNeedsSub",
        "Waiting on you",
      ),
      Icon: BellRinging,
      tone: {
        icon: G.accent,
        iconBg: G.accentSoft,
        activeBg: "#FFFFFF",
        activeBorder: G.accent,
        activeLabel: G.accent,
      },
    },
    {
      key: "all",
      label: t("meskenyGuide.filterAll", "All"),
      subtitle: t("meskenyGuide.filterAllSub", "Every insight"),
      Icon: SquaresFour,
      tone: {
        icon: G.inkSoft,
        iconBg: G.surface,
        activeBg: "#FFFFFF",
        activeBorder: G.ink,
        activeLabel: G.ink,
      },
    },
    {
      key: "urgent",
      label: t("meskenyGuide.filterUrgent", "Urgent"),
      subtitle: t(
        "meskenyGuide.filterUrgentSub",
        "Time-sensitive",
      ),
      Icon: Flame,
      tone: {
        icon: G.urgent,
        iconBg: "#FEF2F2",
        activeBg: "#FFFFFF",
        activeBorder: G.urgent,
        activeLabel: G.urgent,
      },
    },
    {
      key: "action",
      label: t("meskenyGuide.filterAction", "Action"),
      subtitle: t(
        "meskenyGuide.filterActionSub",
        "Suggested fixes",
      ),
      Icon: Lightbulb,
      tone: {
        icon: G.action,
        iconBg: "#FFFBEB",
        activeBg: "#FFFFFF",
        activeBorder: G.action,
        activeLabel: G.action,
      },
    },
  ];
}

function FilterCard({
  def,
  active,
  width,
  onPress,
}: {
  def: FilterDef;
  active: boolean;
  width: number;
  onPress: () => void;
}) {
  const { Icon, tone } = def;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        { width },
        active && {
          backgroundColor: tone.activeBg,
          borderColor: tone.activeBorder,
          ...Platform.select({
            ios: {
              shadowColor: tone.activeBorder,
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            },
            android: { elevation: 2 },
            default: {},
          }),
        },
        !active && styles.cardIdle,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${def.label}. ${def.subtitle}`}
    >
      {active ? <View style={[styles.activeBar, { backgroundColor: tone.activeBorder }]} /> : null}

      <View
        style={[
          styles.iconWrap,
          { backgroundColor: active ? tone.iconBg : G.surface },
        ]}
      >
        <Icon
          size={18}
          color={active ? tone.icon : G.muted}
          weight={active ? "fill" : "duotone"}
        />
      </View>

      <View style={styles.cardText}>
        <Text
          style={[
            styles.cardLabel,
            active && { color: tone.activeLabel },
          ]}
          numberOfLines={1}
        >
          {def.label}
        </Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {def.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export const GuideFeedFilterBar = React.memo(function GuideFeedFilterBar({
  value,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const filters = useMemo(() => buildFilters(t), [t]);

  const cardWidth = useMemo(() => {
    const screenW = Dimensions.get("window").width;
    return (screenW - H_PAD * 2 - GRID_GAP) / 2;
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>
        {t("meskenyGuide.filterSection", "Show")}
      </Text>
      <View style={styles.grid}>
        {filters.map((def) => (
          <FilterCard
            key={def.key}
            def={def}
            active={value === def.key}
            width={cardWidth}
            onPress={() => onChange(def.key)}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: G.line,
    backgroundColor: G.bg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: G.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: G.radius,
    borderWidth: 1.5,
    overflow: "hidden",
    minHeight: 64,
  },
  cardIdle: {
    backgroundColor: G.surface,
    borderColor: G.line,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: G.radius,
    borderBottomLeftRadius: G.radius,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: G.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 11,
    fontWeight: "500",
    color: G.muted,
    marginTop: 2,
  },
});
