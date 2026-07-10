import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { ListingAiKind } from "../../types/listingAi";
import {
  useAmenities,
  usePropertyCategories,
  type Amenity,
  type Category,
} from "../../hooks/queries/useCategories";
import { PhosphorIcon } from "../PhosphorIcon";
import { SALE_PROPERTY_TYPES } from "./listingAiComposeConstants";
import { LAI, laiStyles } from "./listingAiTheme";

type Props = {
  kind: ListingAiKind;
  propertyType: string;
  onPropertyTypeChange: (key: string) => void;
  yearBuilt: string;
  onYearBuiltChange: (value: string) => void;
  amenityIds: number[];
  onAmenityIdsChange: (ids: number[]) => void;
  showMissingHints: boolean;
  disabled?: boolean;
};

function amenityLabel(amenity: Amenity, lang: string): string {
  const n = amenity.name;
  if (lang.startsWith("ar") && n.ar) return n.ar;
  if (lang.startsWith("fr") && n.fr) return n.fr;
  return n.en || n.fr || n.ar || "";
}

function categoryLabel(cat: Category, lang: string): string {
  const n = cat.name;
  if (lang.startsWith("ar") && n.ar) return n.ar;
  if (lang.startsWith("fr") && n.fr) return n.fr;
  return n.en || n.fr || n.ar || "";
}

export function ListingAiComposeExtras({
  kind,
  propertyType,
  onPropertyTypeChange,
  yearBuilt,
  onYearBuiltChange,
  amenityIds,
  onAmenityIdsChange,
  showMissingHints,
  disabled,
}: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").toLowerCase();
  const { data: amenitiesData = [], isLoading: amenitiesLoading } =
    useAmenities();
  const { data: rentCategories = [], isLoading: categoriesLoading } =
    usePropertyCategories();
  const amenities = Array.isArray(amenitiesData) ? amenitiesData : [];

  const salePropertyTypes = useMemo(() => SALE_PROPERTY_TYPES, []);

  const toggleAmenity = (id: number) => {
    const active = amenityIds.includes(id);
    onAmenityIdsChange(
      active ? amenityIds.filter((x) => x !== id) : [...amenityIds, id],
    );
  };

  const showYear = kind === "sale";

  return (
    <View style={styles.wrap}>
      <Text style={laiStyles.label}>
        {t("listingAi.propertyTypeLabel", { defaultValue: "Property type" })}
      </Text>
      {showMissingHints && !propertyType ? (
        <Text style={styles.missing}>
          {t("listingAi.missingPropertyType", {
            defaultValue: "Select a property type.",
          })}
        </Text>
      ) : null}

      {kind === "rent" ? (
        categoriesLoading ? (
          <ActivityIndicator color={LAI.brand} style={styles.loader} />
        ) : rentCategories.length > 0 ? (
          <View style={styles.categoryList}>
            {rentCategories.map((cat) => {
              const key = String(cat.id);
              const active = propertyType === key;
              const label = categoryLabel(cat, lang);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryRow, active && styles.categoryRowActive]}
                  onPress={() => onPropertyTypeChange(key)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <PhosphorIcon
                    name={(cat.icon as never) || "House"}
                    size={22}
                    color={active ? LAI.text : LAI.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      active && styles.categoryLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.empty}>
            {t("listingAi.categoriesUnavailable", {
              defaultValue: "Could not load property types.",
            })}
          </Text>
        )
      ) : (
        <View style={styles.chipsWrap}>
          {salePropertyTypes.map((pt) => {
            const active = propertyType === pt.key;
            const label = t(pt.labelKey, { defaultValue: pt.key });
            return (
              <TouchableOpacity
                key={pt.key}
                style={[laiStyles.chip, active && laiStyles.chipActive]}
                onPress={() => onPropertyTypeChange(pt.key)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[laiStyles.chipText, active && laiStyles.chipTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showYear ? (
        <>
          <Text style={laiStyles.label}>
            {t("listingAi.yearBuiltLabel", { defaultValue: "Year built" })}
          </Text>
          {showMissingHints && !yearBuilt.trim() ? (
            <Text style={styles.missing}>
              {t("listingAi.missingYearBuilt", {
                defaultValue: "Enter the year built.",
              })}
            </Text>
          ) : null}
          <TextInput
            style={laiStyles.field}
            placeholder={t("listingAi.yearBuiltPlaceholder", {
              defaultValue: "e.g. 2018",
            })}
            placeholderTextColor={LAI.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            value={yearBuilt}
            onChangeText={onYearBuiltChange}
            editable={!disabled}
          />
        </>
      ) : null}

      <Text style={[laiStyles.label, styles.amenityLabel]}>
        {t("listingAi.amenitiesLabel", { defaultValue: "Amenities" })}
      </Text>
      {showMissingHints && amenityIds.length === 0 ? (
        <Text style={styles.missing}>
          {t("listingAi.missingAmenities", {
            defaultValue: "Select at least one amenity.",
          })}
        </Text>
      ) : null}
      {amenitiesLoading ? (
        <ActivityIndicator color={LAI.brand} style={styles.loader} />
      ) : amenities.length > 0 ? (
        <View style={styles.chipsWrap}>
          {amenities.map((amenity) => {
            const active = amenityIds.includes(amenity.id);
            const label = amenityLabel(amenity, lang);
            return (
              <TouchableOpacity
                key={amenity.id}
                style={[laiStyles.chip, styles.amenityChip, active && laiStyles.chipActive]}
                onPress={() => toggleAmenity(amenity.id)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <PhosphorIcon
                  name={(amenity.icon as never) || "Question"}
                  size={14}
                  color={active ? LAI.text : LAI.textSecondary}
                />
                <Text
                  style={[laiStyles.chipText, active && laiStyles.chipTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={styles.empty}>
          {t("listingAi.amenitiesUnavailable", {
            defaultValue: "Could not load amenities.",
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryList: {
    gap: 8,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LAI.border,
    backgroundColor: LAI.surface,
  },
  categoryRowActive: {
    borderColor: LAI.brand,
    backgroundColor: "#F7F7F8",
  },
  categoryLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: LAI.textSecondary,
  },
  categoryLabelActive: {
    color: LAI.text,
    fontWeight: "600",
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  amenityLabel: { marginTop: 4 },
  missing: {
    fontSize: 12,
    color: LAI.danger,
    marginBottom: 6,
  },
  loader: { marginVertical: 12 },
  empty: {
    fontSize: 13,
    color: LAI.textSecondary,
    marginBottom: 12,
  },
});
