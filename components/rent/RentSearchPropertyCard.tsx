import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type Props = {
  property: any;
  onPress: () => void;
};

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const u = images[0];
  return typeof u === "string" && u.trim() ? u.trim() : null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-MR", {
    maximumFractionDigits: 0,
  }).format(price);
}

export function RentSearchPropertyCard({ property, onPress }: Props) {
  const { t } = useTranslation();

  const title =
    property?.title || property?.Title || t("property.details.titlePlaceholder", "Home");
  const nightly =
    Number(property?.nightlyPrice ?? property?.nightly_price ?? 0) || 0;
  const bedrooms = property?.bedrooms ?? property?.beds;
  const bathrooms = property?.bathrooms;
  const propertyType = property?.propertyType ?? property?.property_type;
  const imageUri = firstImage(property?.images);

  const locationParts = useMemo(() => {
    const parts = [
      property?.quartier_name || property?.quartierName,
      property?.zone_name || property?.zoneName,
      property?.city_name || property?.city,
      property?.country,
    ].filter(Boolean);
    return [...new Set(parts.map(String))];
  }, [property]);

  const typeLabel = propertyType
    ? t(`property.type.${propertyType}`, String(propertyType))
    : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="home" size={36} color="#D1D5DB" />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {nightly > 0 ? (
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{formatPrice(nightly)}</Text>
              <Text style={styles.priceUnit}>
                {t("contactHost.perNight", "/night")}
              </Text>
            </View>
          ) : null}
        </View>

        {locationParts.length > 0 ? (
          <Text style={styles.location} numberOfLines={1}>
            {locationParts.join(" · ")}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {bedrooms != null && Number(bedrooms) > 0 ? (
            <View style={styles.metaChip}>
              <MaterialIcons name="bed" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{bedrooms}</Text>
            </View>
          ) : null}
          {bathrooms != null && Number(bathrooms) > 0 ? (
            <View style={styles.metaChip}>
              <MaterialIcons name="bathtub" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{bathrooms}</Text>
            </View>
          ) : null}
          {typeLabel ? (
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText} numberOfLines={1}>
                {typeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardPressed: {
    opacity: 0.94,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  location: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  typeChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: "55%",
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
});
