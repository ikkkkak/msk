import React, { memo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

const BRAND = theme["color-temporary-primary"];

type Props = {
  imageUrl?: string | null;
  priceLabel?: string;
  selected?: boolean;
};

export const LandMapPriceMarker = memo(function LandMapPriceMarker({
  imageUrl,
  priceLabel,
  selected = false,
}: Props) {
  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.card, selected && styles.cardSelected]}>
        <View style={styles.thumb}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumbImg} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <MaterialIcons name="landscape" size={18} color="#FFF" />
            </View>
          )}
        </View>
        {priceLabel ? (
          <View style={styles.priceWrap}>
            <Text style={[styles.price, selected && styles.priceSelected]} numberOfLines={1}>
              {priceLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.arrow, selected && styles.arrowSelected]} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  wrapSelected: {
    transform: [{ scale: 1.06 }],
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },
  cardSelected: {
    borderColor: BRAND,
    borderWidth: 2,
  },
  thumb: {
    width: 42,
    height: 42,
    backgroundColor: "#E5E7EB",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
  },
  priceWrap: {
    paddingHorizontal: 8,
    maxWidth: 96,
  },
  price: {
    fontSize: 11,
    fontWeight: "800",
    color: "#111827",
  },
  priceSelected: {
    color: BRAND,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFF",
    marginTop: -1,
  },
  arrowSelected: {
    borderTopColor: BRAND,
  },
});
