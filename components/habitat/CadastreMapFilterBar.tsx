// /**
//  * Cadastre map header panel — map overlay only (sheet is hoisted in SearchScreen).
//  */
// import React, { memo } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Pressable,
//   Platform,
//   TextInput
// } from "react-native";
// import { CaretDown, MagnifyingGlass, X } from "phosphor-react-native";
// import * as Haptics from "expo-haptics";
// import { useTranslation } from "react-i18next";

// type Props = {
//   selectedZoneLabel?: string;
//   selectedSectorLabel?: string;
//   onOpenZone: () => void;
//   onOpenSector: () => void;
//   plotNumberValue: string;
//   onPlotNumberChange: (value: string) => void;
//   onPlotSearch: () => void;
//   plotSearching?: boolean;
//   onClear: () => void;
// };

// export const CadastreMapFilterBar = memo(function CadastreMapFilterBar({
//   selectedZoneLabel,
//   selectedSectorLabel,
//   onOpenZone,
//   onOpenSector,
//   plotNumberValue,
//   onPlotNumberChange,
//   onPlotSearch,
//   plotSearching = false,
//   onClear
// }: Props) {
//   const { t } = useTranslation();

//   return (
//     <View style={styles.mapChrome} pointerEvents="box-none">
//       <View style={styles.panel}>
//         <View style={styles.headerRow}>
//           <Text style={styles.headerTitle}>
//             {t("habitatCadastre.sheetTitle", "Where should the map focus?")}
//           </Text>
//           <Pressable
//             onPress={onClear}
//             hitSlop={8}
//             style={({ pressed }) => [
//               styles.clearBtn,
//               pressed && { opacity: 0.7 }
//             ]}
//             accessibilityRole="button"
//             accessibilityLabel={t("habitatCadastre.clearAll")}
//           >
//             <X size={12} color="#374151" weight="bold" />
//           </Pressable>
//         </View>

//         <Pressable
//           style={({ pressed }) => [styles.rowBtn, pressed && { opacity: 0.86 }]}
//           onPress={() => {
//             Haptics.selectionAsync().catch(() => {});
//             onOpenZone();
//           }}
//           accessibilityRole="button"
//           accessibilityLabel={t("habitatCadastre.zoneLabel")}
//         >
//           <Text style={styles.rowLabel}>{t("habitatCadastre.zoneLabel")}</Text>
//           <Text style={styles.rowValue} numberOfLines={1}>
//             {selectedZoneLabel || t("habitatCadastre.anyZone")}
//           </Text>
//           <CaretDown size={12} color="#6B7280" weight="bold" />
//         </Pressable>

//         <Pressable
//           style={({ pressed }) => [
//             styles.rowBtn,
//             !selectedZoneLabel && styles.rowBtnDisabled,
//             pressed && { opacity: 0.86 }
//           ]}
//           onPress={() => {
//             Haptics.selectionAsync().catch(() => {});
//             onOpenSector();
//           }}
//           accessibilityRole="button"
//           accessibilityLabel={t("habitatCadastre.quartierLabel")}
//         >
//           <Text style={styles.rowLabel}>
//             {t("habitatCadastre.quartierLabel")}
//           </Text>
//           <Text style={styles.rowValue} numberOfLines={1}>
//             {selectedSectorLabel ||
//               (selectedZoneLabel
//                 ? t("habitatCadastre.anyQuartier")
//                 : t("habitatCadastre.pickZoneFirst"))}
//           </Text>
//           <CaretDown size={12} color="#6B7280" weight="bold" />
//         </Pressable>

//         <View style={styles.searchRow}>
//           <TextInput
//             style={styles.searchInput}
//             value={plotNumberValue}
//             onChangeText={onPlotNumberChange}
//             placeholder={t(
//               "habitatCadastre.plotNumberPlaceholder",
//               "Type a plot number (within this area)…"
//             )}
//             placeholderTextColor="#94A3B8"
//             autoCorrect={false}
//             autoCapitalize="none"
//             returnKeyType="search"
//             onSubmitEditing={() => {
//               if (!plotNumberValue.trim() || plotSearching) return;
//               Haptics.selectionAsync().catch(() => {});
//               onPlotSearch();
//             }}
//           />
//           {plotNumberValue.trim().length > 0 ? (
//             <Pressable
//               style={({ pressed }) => [
//                 styles.searchBtn,
//                 pressed && { opacity: 0.86 },
//                 plotSearching && styles.searchBtnDisabled
//               ]}
//               onPress={() => {
//                 if (plotSearching) return;
//                 Haptics.selectionAsync().catch(() => {});
//                 onPlotSearch();
//               }}
//               accessibilityRole="button"
//               accessibilityLabel={t(
//                 "habitatCadastre.plotNumberSearch",
//                 "Search plot"
//               )}
//             >
//               <MagnifyingGlass size={12} color="#FFFFFF" weight="bold" />
//               <Text style={styles.searchBtnText}>
//                 {t("habitatCadastre.plotNumberSearch", "Search")}
//               </Text>
//             </Pressable>
//           ) : null}
//         </View>
//       </View>
//     </View>
//   );
// });

// const styles = StyleSheet.create({
//   mapChrome: {
//     position: "absolute",
//     left: 10,
//     right: 10,
//     top: 10,
//     zIndex: 10210,
//     elevation: 10210
//   },
//   panel: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(0,0,0,0.08)",
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//     gap: 8,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.12,
//         shadowRadius: 8
//       },
//       android: { elevation: 5 }
//     })
//   },
//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between"
//   },
//   headerTitle: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#222222"
//   },
//   clearBtn: {
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#F3F4F6"
//   },
//   rowBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     backgroundColor: "#F8FAFC",
//     borderRadius: 10,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "#E5E7EB",
//     paddingHorizontal: 10,
//     paddingVertical: 10
//   },
//   rowBtnDisabled: {
//     opacity: 0.74
//   },
//   rowLabel: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#4B5563"
//   },
//   rowValue: {
//     flex: 1,
//     minWidth: 0,
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#111827"
//   },
//   searchRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     borderRadius: 10,
//     backgroundColor: "#FFF",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "#BFDBFE",
//     paddingHorizontal: 8,
//     paddingVertical: 7
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 11,
//     color: "#FFF",
//     fontWeight: "600",
//     paddingVertical: Platform.OS === "ios" ? 4 : 2
//   },
//   searchBtn: {
//     height: 26,
//     borderRadius: 8,
//     backgroundColor: "#111827",
//     paddingHorizontal: 9,
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     gap: 4
//   },
//   searchBtnDisabled: {
//     opacity: 0.6
//   },
//   searchBtnText: {
//     color: "#FFFFFF",
//     fontSize: 11,
//     fontWeight: "700",
//     letterSpacing: -0.15
//   }
// });

/**
 * Cadastre map header panel — Airbnb-style redesign.
 * Map overlay only (sheet is hoisted in SearchScreen).
 */
import React, { memo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  CaretDown,
  MagnifyingGlass,
  X,
  MapTrifold,
  Buildings,
  Hash,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

type Props = {
  selectedZoneLabel?: string;
  selectedSectorLabel?: string;
  zoneSelected?: boolean;
  sectorSelected?: boolean;
  onOpenZone: () => void;
  onOpenSector: () => void;
  plotNumberValue: string;
  onPlotNumberChange: (value: string) => void;
  onPlotSearch: () => void;
  plotSearching?: boolean;
  onClear: () => void;
  /** Collapsed chips while a plot callout is open. */
  compact?: boolean;
  /** Render inside SearchCadastreMapView top stack (no absolute positioning). */
  embedded?: boolean;
};

/* ─── Zone / Sector row ───────────────────────────────────────────────── */
type RowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
};

const FilterRow = memo(function FilterRow({
  icon,
  label,
  value,
  onPress,
  disabled = false,
  active = false,
}: RowProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }

  function onPressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.rowPressable,
        pressed && { opacity: 0.88 },
      ]}
    >
      <Animated.View
        style={[
          styles.rowInner,
          disabled && styles.rowDisabled,
          { transform: [{ scale }] },
        ]}
      >
        {/* Icon pill */}
        <View style={[styles.iconPill, active && styles.iconPillActive]}>
          {icon}
        </View>

        {/* Labels */}
        <View style={styles.rowText}>
          <Text style={styles.rowFieldLabel}>{label.toUpperCase()}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        </View>

        <CaretDown size={14} color="#9CA3AF" weight="bold" />
      </Animated.View>
    </Pressable>
  );
});

/* ─── Main component ──────────────────────────────────────────────────── */
export const CadastreMapFilterBar = memo(function CadastreMapFilterBar({
  selectedZoneLabel,
  selectedSectorLabel,
  zoneSelected = false,
  sectorSelected = false,
  onOpenZone,
  onOpenSector,
  plotNumberValue,
  onPlotNumberChange,
  onPlotSearch,
  plotSearching = false,
  onClear,
  compact = false,
  embedded = false,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);

  const hasPlot = plotNumberValue.trim().length > 0;
  const guideText = !zoneSelected
    ? t("habitatCadastre.filterStepZone", "Start by choosing a zone")
    : !sectorSelected
      ? t(
          "habitatCadastre.filterStepQuartier",
          "Now pick a quartier to load plots",
        )
      : t("habitatCadastre.filterStepPlot", "Optional: search a plot number");

  if (compact) {
    return (
      <View style={styles.panelCompact}>
        <Pressable
          style={({ pressed }) => [
            styles.compactChip,
            pressed && { opacity: 0.86 },
          ]}
          onPress={onOpenZone}
        >
          <Text style={styles.compactLabel}>
            {t("habitatCadastre.zoneLabel", "Zone")}
          </Text>
          <Text style={styles.compactValue} numberOfLines={1}>
            {zoneSelected
              ? selectedZoneLabel || "—"
              : t("habitatCadastre.anyZone", "Any")}
          </Text>
        </Pressable>
        <Text style={styles.compactSep}>·</Text>
        <Pressable
          style={({ pressed }) => [
            styles.compactChip,
            !zoneSelected && styles.chipDisabled,
            pressed && zoneSelected && { opacity: 0.86 },
          ]}
          disabled={!zoneSelected}
          onPress={onOpenSector}
        >
          <Text style={styles.compactLabel}>
            {t("habitatCadastre.quartierLabel", "Quartier")}
          </Text>
          <Text style={styles.compactValue} numberOfLines={1}>
            {sectorSelected
              ? selectedSectorLabel || "—"
              : t("habitatCadastre.pickZoneFirst", "Select zone")}
          </Text>
        </Pressable>
        <Pressable onPress={onClear} hitSlop={8} style={styles.compactClear}>
          <X size={12} color="#374151" weight="bold" />
        </Pressable>
      </View>
    );
  }

  const panel = (
    <View style={styles.panel}>
      <View style={styles.guideRow}>
        <Text style={styles.guideText}>{guideText}</Text>
        {zoneSelected || sectorSelected || hasPlot ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(
              "habitatCadastre.clearAll",
              "Clear selection",
            )}
          >
            <X size={12} color="#374151" weight="bold" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={({ pressed }) => [
            styles.chip,
            zoneSelected && styles.chipActive,
            pressed && { opacity: 0.86 },
          ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onOpenZone();
          }}
        >
          <MapTrifold
            size={14}
            color={zoneSelected ? "#1E3A5F" : "#6B7280"}
            weight="duotone"
          />
          <View style={styles.chipTextWrap}>
            <Text style={styles.chipLabel}>
              {t("habitatCadastre.zoneLabel", "Zone")}
            </Text>
            <Text style={styles.chipValue} numberOfLines={1}>
              {zoneSelected
                ? selectedZoneLabel || t("habitatCadastre.anyZone", "Any")
                : t("habitatCadastre.tapToSelectZone", "Tap to select")}
            </Text>
          </View>
          <CaretDown size={12} color="#6B7280" weight="bold" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.chip,
            !zoneSelected && styles.chipDisabled,
            sectorSelected && styles.chipActive,
            pressed && zoneSelected && { opacity: 0.86 },
          ]}
          disabled={!zoneSelected}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onOpenSector();
          }}
        >
          <Buildings
            size={14}
            color={sectorSelected ? "#1E3A5F" : "#6B7280"}
            weight="duotone"
          />
          <View style={styles.chipTextWrap}>
            <Text style={styles.chipLabel}>
              {t("habitatCadastre.quartierLabel", "Quartier")}
            </Text>
            <Text style={styles.chipValue} numberOfLines={1}>
              {!zoneSelected
                ? t("habitatCadastre.pickZoneFirst", "Select a zone first")
                : sectorSelected
                  ? selectedSectorLabel ||
                    t("habitatCadastre.anyQuartier", "Any")
                  : t("habitatCadastre.tapToSelectQuartier", "Tap to select")}
            </Text>
          </View>
          <CaretDown size={12} color="#6B7280" weight="bold" />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            focused && styles.searchContainerFocused,
            !sectorSelected && styles.searchContainerMuted,
          ]}
        >
          <Hash size={14} color="#9CA3AF" weight="bold" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={plotNumberValue}
            onChangeText={onPlotNumberChange}
            placeholder={
              sectorSelected
                ? t("habitatCadastre.plotNumberPlaceholder", "Plot number…")
                : t(
                    "habitatCadastre.plotNumberHintSelectArea",
                    "Select an area first to search by plot number.",
                  )
            }
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            editable={sectorSelected}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => {
              if (!hasPlot || plotSearching || !sectorSelected) return;
              Haptics.selectionAsync().catch(() => {});
              onPlotSearch();
            }}
          />
          {hasPlot && sectorSelected ? (
            <Pressable
              style={({ pressed }) => [
                styles.searchBtn,
                pressed && { opacity: 0.82 },
                plotSearching && styles.searchBtnSearching,
              ]}
              onPress={() => {
                if (plotSearching) return;
                Haptics.selectionAsync().catch(() => {});
                onPlotSearch();
              }}
            >
              {plotSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MagnifyingGlass size={12} color="#FFFFFF" weight="bold" />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (embedded) {
    return panel;
  }

  return (
    <View style={styles.mapChrome} pointerEvents="box-none">
      {panel}
    </View>
  );
});

/* ─── Styles ──────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  mapChrome: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 12,
    zIndex: 10210,
    elevation: 10210,
  },

  panelCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.09)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  compactChip: {
    flex: 1,
    minWidth: 0,
  },
  compactLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  compactValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  compactSep: {
    fontSize: 14,
    color: "#D1D5DB",
    fontWeight: "700",
  },
  compactClear: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.09)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  guideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  guideText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: -0.1,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: 2,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  stepDotDone: {
    backgroundColor: "#1E3A5F",
    borderColor: "#1E3A5F",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: "#93C5FD",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: -0.1,
  },

  /* Dividers */
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 0,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },

  /* Filter rows */
  rowPressable: {
    paddingHorizontal: 8,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  rowDisabled: {
    opacity: 0.55,
  },

  /* Icon pill */
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconPillActive: {
    backgroundColor: "#EFF6FF",
  },

  /* Row text */
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowFieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    letterSpacing: -0.1,
  },

  /* Search */
  searchRow: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
  },
  searchContainerFocused: {
    borderColor: "#93C5FD",
    backgroundColor: "#FFFFFF",
  },
  searchContainerMuted: {
    opacity: 0.72,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "400",
    paddingVertical: Platform.OS === "ios" ? 0 : 2,
  },

  /* Search button */
  searchBtn: {
    width: 32,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    minWidth: 72,
  },
  searchBtnSearching: {
    opacity: 0.7,
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
});
