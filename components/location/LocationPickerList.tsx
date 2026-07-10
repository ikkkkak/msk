import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  matchesLocationSearch,
  type LocationCity,
  type LocationQuartier,
  type LocationZone,
} from "../../hooks/useListingLocationCatalog";
import {
  AI_LOCATION_PICKER_THEME,
  LISTING_LOCATION_PICKER_THEME,
  type LocationPickerTheme,
} from "./locationPickerTheme";

export type LocationPickerItem = LocationCity | LocationZone | LocationQuartier;

type Props = {
  items: LocationPickerItem[];
  selectedId?: number | null;
  search: string;
  onSearchChange: (q: string) => void;
  onSelect: (item: LocationPickerItem) => void;
  label: (item: LocationPickerItem) => string;
  loading?: boolean;
  emptyText?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  /** Flat list (default) or nested inside another scroll view */
  nested?: boolean;
  listStyle?: StyleProp<ViewStyle>;
  listMaxHeight?: number;
  theme?: LocationPickerTheme;
  variant?: "listing" | "ai";
  /** Optional row shown first (e.g. “Skip zone”) */
  leadingOption?: {
    key: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  };
  /** Show cadastre badge on sectors linked to habitat_sectors */
  showHabitatBadge?: boolean;
};

export function LocationPickerList({
  items,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  label,
  loading,
  emptyText,
  disabled,
  searchPlaceholder,
  nested,
  listStyle,
  listMaxHeight = 320,
  theme: themeProp,
  variant = "listing",
  leadingOption,
  showHabitatBadge,
}: Props) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const theme =
    themeProp ??
    (variant === "ai" ? AI_LOCATION_PICKER_THEME : LISTING_LOCATION_PICKER_THEME);
  const filtered = items.filter((item) => matchesLocationSearch(item, search));

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[
          styles.field,
          {
            backgroundColor: theme.fieldBg,
            borderColor: focused ? theme.borderFocus : theme.border,
            color: theme.text,
          },
          focused && styles.fieldFocused,
        ]}
        placeholder={
          searchPlaceholder ||
          t("listing.common.search", { defaultValue: "Search" })
        }
        placeholderTextColor={theme.textMuted}
        value={search}
        onChangeText={onSearchChange}
        autoCorrect={false}
        autoCapitalize="none"
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          style={[styles.list, { maxHeight: listMaxHeight }, listStyle]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={nested}
          nestedScrollEnabled={nested}
          keyboardShouldPersistTaps="handled"
        >
          {leadingOption ? (
            <TouchableOpacity
              style={styles.option}
              onPress={leadingOption.onPress}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.text },
                  leadingOption.selected && styles.optionTextActive,
                ]}
              >
                {leadingOption.label}
              </Text>
              {leadingOption.selected ? (
                <MaterialIcons name="check" size={20} color={theme.accent} />
              ) : null}
            </TouchableOpacity>
          ) : null}

          {filtered.map((item) => {
            const active = selectedId === item.id;
            const habitatLinked =
              showHabitatBadge &&
              "habitat_sector_id" in item &&
              Boolean((item as LocationQuartier).habitat_sector_id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.option}
                onPress={() => onSelect(item)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <View style={styles.optionLabelWrap}>
                  <Text
                    style={[
                      styles.optionText,
                      { color: theme.text },
                      active && styles.optionTextActive,
                    ]}
                  >
                    {label(item)}
                  </Text>
                  {habitatLinked ? (
                    <Text style={[styles.badge, { color: theme.textMuted }]}>
                      {t("listing.location.cadastre", { defaultValue: "Cadastre" })}
                    </Text>
                  ) : null}
                </View>
                {active ? (
                  <MaterialIcons name="check" size={20} color={theme.accent} />
                ) : null}
              </TouchableOpacity>
            );
          })}

          {!loading && filtered.length === 0 && !leadingOption ? (
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              {emptyText ||
                t("listing.common.noResults", { defaultValue: "No results" })}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1 },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldFocused: {},
  list: { marginTop: 12 },
  listContent: { paddingBottom: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EBEBEB",
  },
  optionLabelWrap: { flex: 1, gap: 2 },
  optionText: { fontSize: 15, flex: 1 },
  optionTextActive: { fontWeight: "600" },
  badge: { fontSize: 11, fontWeight: "500" },
  loading: { alignItems: "center", paddingVertical: 32 },
  empty: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 24,
  },
});
