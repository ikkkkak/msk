import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Property } from "../types/location";

interface LocationPropertyCardProps {
  property: Property;
  onPress?: () => void;
}

const { width } = Dimensions.get("window");
const cardWidth = width * 0.4;

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export const LocationPropertyCard: React.FC<LocationPropertyCardProps> = ({
  property,
  onPress,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      (navigation as any).navigate("PropertyDetails", {
        propertyID: property.id,
      });
    }
  };

  const nightlyPrice = asNumber(property.nightlyPrice);
  const rating = asNumber(property.rating);
  const beds = asNumber(property.beds);
  const bathrooms = asNumber(property.bathrooms);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-MR", {
      style: "currency",
      currency: "MRU",
      minimumFractionDigits: 0,
    }).format(price);

  const propertyTypeKey = property.propertyType
    ? `property.type.${property.propertyType}`
    : "";
  const propertyTypeText = propertyTypeKey
    ? t(propertyTypeKey, property.propertyType)
    : t("property.details.titlePlaceholder", "Home");

  const locationParts = [property.city, property.country].filter(Boolean);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {property.images && property.images.length > 0 ? (
          <Image
            source={{ uri: property.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="home" size={48} color="#E0E0E0" />
          </View>
        )}

        {nightlyPrice != null ? (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(nightlyPrice)}</Text>
            <Text style={styles.priceUnit}>
              {t("contactHost.perNight", "/night")}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {property.title}
          </Text>
          {rating != null ? (
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.propertyType} numberOfLines={1}>
          {propertyTypeText}
        </Text>

        {(beds != null || bathrooms != null) && (
          <View style={styles.details}>
            {beds != null ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="bed" size={16} color="#717171" />
                <Text style={styles.detailText}>
                  {beds} {t("property.bedroomsShort", "Beds")}
                </Text>
              </View>
            ) : null}

            {bathrooms != null ? (
              <View style={styles.detailItem}>
                <MaterialIcons name="bathtub" size={16} color="#717171" />
                <Text style={styles.detailText}>{bathrooms}</Text>
              </View>
            ) : null}
          </View>
        )}

        {locationParts.length > 0 ? (
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#717171" />
            <Text style={styles.location} numberOfLines={1}>
              {locationParts.join(", ")}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 240,
    marginRight: 12,
    shadowColor: "#000",
    marginTop: 10,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    height: 130,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  priceContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  priceUnit: {
    fontSize: 10,
    color: "#FFFFFF",
    marginLeft: 1,
  },
  content: {
    padding: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222222",
    flex: 1,
    marginRight: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 11,
    color: "#222222",
    marginLeft: 2,
    fontWeight: "500",
  },
  propertyType: {
    fontSize: 11,
    color: "#717171",
    marginBottom: 4,
  },
  details: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  detailText: {
    fontSize: 10,
    color: "#717171",
    marginLeft: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 10,
    color: "#717171",
    marginLeft: 2,
    flex: 1,
  },
});
