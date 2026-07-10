/**
 * PropertyDetailCard Component
 * Airbnb-style floating card (no backdrop). Close button sends onClose({ force: true }) for immediate close.
 * INSTANT: Uses instantCardStore + useSyncExternalStore so only this component re-renders on show/hide.
 * Bypasses MapUIState → heavy SearchScreen re-render (~340ms delay).
 */

import React, { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated as RNAnimated,
  Easing,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { logElapsedSinceTap } from "../utils/debugMarkerTap";
import { instantCardStore } from "../stores/instantCardStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HIDE_DURATION_MS = 120;
const ENTER_DURATION_MS = 240;
const ENTER_TRANSLATE_Y = 80;

const getServerSnapshot = () => ({ visible: false, property: null as any });

interface PropertyDetailCardProps {
  property?: any;
  visible?: boolean;
  onClose: (opts?: { force?: boolean }) => void;
  onCardPress?: () => void;
}

export const PropertyDetailCard: React.FC<PropertyDetailCardProps> = ({
  onClose,
  onCardPress
}) => {
  const storeState = useSyncExternalStore(
    instantCardStore.subscribe,
    instantCardStore.getSnapshot,
    getServerSnapshot
  );
  const visible = storeState.visible;
  const property = storeState.property;

  const opacity = useRef(new RNAnimated.Value(1)).current;
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const scale = useRef(new RNAnimated.Value(1)).current;
  const [exiting, setExiting] = useState(false);
  const mounted = useRef(true);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (visible) {
      const totalMs = logElapsedSinceTap("CARD_SHOWN (PropertyDetailCard visible=true)");
      if (__DEV__) console.log(`[MARKER_DEBUG] ✅ TOTAL TIME BEFORE CARD SHOWN: ${totalMs.toFixed(2)}ms`);
      setExiting(false);
      opacity.setValue(0);
      translateY.setValue(ENTER_TRANSLATE_Y);
      scale.setValue(0.97);
      RNAnimated.parallel([
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration: ENTER_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        RNAnimated.timing(translateY, {
          toValue: 0,
          duration: ENTER_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        RNAnimated.timing(scale, {
          toValue: 1,
          duration: ENTER_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]).start();
    } else {
      if (!mounted.current) return;
      setExiting(true);
      opacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      RNAnimated.parallel([
        RNAnimated.timing(opacity, {
          toValue: 0,
          duration: HIDE_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        }),
        RNAnimated.timing(translateY, {
          toValue: 60,
          duration: HIDE_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        }),
        RNAnimated.timing(scale, {
          toValue: 0.98,
          duration: HIDE_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        })
      ]).start(() => {
        if (mounted.current) setExiting(false);
      });
    }
  }, [visible, opacity, translateY, scale]);

  const img =
    Array.isArray(property?.images) && property.images.length > 0
      ? String(property.images[0])
      : null;

  useLayoutEffect(() => {
    if (visible && img) Image.prefetch(img).catch(() => {});
  }, [visible, img]);

  const show = visible || exiting;
  if (!show) return null;

  const isExiting = !visible && exiting;

  const price =
    property?.listing_price ?? property?.price ?? property?.amount ?? null;
  const formattedPrice =
    price != null
      ? new Intl.NumberFormat("fr-FR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Number(price))
      : "";

  const Wrapper = RNAnimated.View;
  const wrapperStyle = [styles.container, { opacity, transform: [{ translateY }, { scale }] }];

  return (
    <Wrapper
      pointerEvents={visible ? "auto" : "none"}
      style={wrapperStyle as any}
    >
      {/* Close Button - CLEAR AND VISIBLE - Easy to click */}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onClose?.({ force: true });
        }}
        style={styles.closeButton}
        hitSlop={40} // Larger hit area for easier clicking
        android_ripple={{ color: "rgba(0,0,0,0.15)", borderless: false }}
      >
        <MaterialIcons name="close" size={22} color="#000000" />
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => {
          onCardPress?.();
        }}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      >
        <View style={styles.imageContainer}>
          {img ? (
            <Image
              source={{ uri: img, cache: "force-cache" as const }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="home" size={28} color="#D1D5DB" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.brandTag}>Meskeny</Text>
          <View style={styles.row}>
            <Text style={styles.priceText}>
              {formattedPrice ? `${formattedPrice} MRU` : "—"}
            </Text>
            {typeof property?.rating === "number" &&
            Number.isFinite(property.rating) &&
            property.rating > 0 ? (
              <View style={styles.rating}>
                <MaterialIcons name="star" size={12} color="#FFC107" />
                <Text style={styles.ratingText}>
                  {property.rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons name="location-on" size={12} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {property?.address || property?.city || property?.location || ""}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            {property?.bedrooms != null && (
              <Text style={styles.detailCompact}>{property.bedrooms} bd</Text>
            )}
            {property?.bathrooms != null && (
              <Text style={styles.detailCompact}>{property.bathrooms} ba</Text>
            )}
            {(property?.square_footage || property?.area) != null && (
              <Text style={styles.detailCompact}>
                {property.square_footage ?? property.area} m²
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Wrapper>
  );
};
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 56,
    zIndex: 999,
    elevation: 12,
    maxWidth: 360,
    alignSelf: "flex-end"
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB"
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  imageContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#F3F4F6"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center"
  },
  brandTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827"
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4
  },
  locationText: {
    color: "#6B7280",
    fontSize: 11,
    flex: 1,
    fontWeight: "400"
  },
  detailsRow: {
    flexDirection: "row",
    gap: 8
  },
  detailCompact: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500"
  }
});
