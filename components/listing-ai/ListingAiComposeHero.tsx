import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { formatThousandsDisplay } from "./listingAiFormatters";
import { ListingAiField } from "./ListingAiField";

type Props = {
  price: string;
  onPriceChange: (v: string) => void;
  area: string;
  onAreaChange: (v: string) => void;
  areaRequired: boolean;
  showRooms: boolean;
  bedrooms: string;
  bathrooms: string;
  onBedroomsChange: (v: string) => void;
  onBathroomsChange: (v: string) => void;
  disabled?: boolean;
};

export function ListingAiComposeHero({
  price,
  onPriceChange,
  area,
  onAreaChange,
  areaRequired,
  showRooms,
  bedrooms,
  bathrooms,
  onBedroomsChange,
  onBathroomsChange,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <ListingAiField
        label={t("listingAi.priceHeroLabel", { defaultValue: "Price (MRU)" })}
        value={price}
        onChangeText={(v) => onPriceChange(formatThousandsDisplay(v))}
        keyboardType="numeric"
        placeholder="0"
        editable={!disabled}
        maxLength={16}
      />

      <ListingAiField
        label={
          areaRequired
            ? t("listingAi.areaHeroRequired", { defaultValue: "Area (m²)" })
            : t("listingAi.areaHeroLabel", { defaultValue: "Area (m²)" })
        }
        value={area}
        onChangeText={(v) => onAreaChange(formatThousandsDisplay(v))}
        keyboardType="numeric"
        placeholder="0"
        editable={!disabled}
        maxLength={12}
      />

      {showRooms ? (
        <View style={styles.roomsRow}>
          <View style={styles.roomCol}>
            <ListingAiField
              label={t("listingAi.bedrooms", { defaultValue: "Bedrooms" })}
              value={bedrooms}
              onChangeText={onBedroomsChange}
              keyboardType="number-pad"
              placeholder="–"
              editable={!disabled}
            />
          </View>
          <View style={styles.roomCol}>
            <ListingAiField
              label={t("listingAi.bathrooms", { defaultValue: "Bathrooms" })}
              value={bathrooms}
              onChangeText={onBathroomsChange}
              keyboardType="number-pad"
              placeholder="–"
              editable={!disabled}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  roomsRow: { flexDirection: "row", gap: 12 },
  roomCol: { flex: 1 },
});
