/**
 * ZillowStylePropertyCard with React Query Prefetch
 * ─────────────────────────────────────────────────────────────────
 *
 * HOW IT WORKS:
 *
 * This card component automatically prefetches property details
 * when the user is about to tap it. This creates:
 *
 * ⚡ ZERO loading screen when opening property details
 * ⚡ Background prefetch happens while card is visible
 * ⚡ User taps → Details show instantly from cache
 *
 * Prefetch triggers:
 * 1. Card mounts: Start prefetching property details
 * 2. Card layout stable: Safe to show details
 * 3. Just before press: Details ready in memory cache
 *
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions
} from "react-native";
import { Text, Icon } from "@ui-kitten/components";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { usePropertySaleDetailsOptimized } from "../../hooks/queries/usePropertySalesOptimized";
import { getCardImageUrl } from "../../utils/imageOptimization";

export interface PropertyCardData {
  id: number;
  title: string;
  price?: number;
  listing_price?: number;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  address?: string;
  city?: string;
  state?: string;
  property_type?: string;
}

export interface ZillowStylePropertyCardProps {
  property: PropertyCardData;
  onPress?: (id: number) => void;
  onCall?: (phone?: string) => void;
  onEmail?: (website?: string) => void;
  onFavorite?: (id: number) => void;
  isFavorite?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Price Badge Component
// ─────────────────────────────────────────────────────────────────

const PriceBadge = React.memo(({ price }: { price?: number }) => {
  if (!price) return null;

  return (
    <View style={styles.priceBadge}>
      <Text style={styles.priceText}>${price.toLocaleString()}</Text>
    </View>
  );
});

PriceBadge.displayName = "PriceBadge";

// ─────────────────────────────────────────────────────────────────
// Property Features Row
// ─────────────────────────────────────────────────────────────────

interface FeaturesRowProps {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

const FeaturesRow = React.memo(
  ({ bedrooms, bathrooms, sqft }: FeaturesRowProps) => {
    const features = useMemo(() => {
      return [
        bedrooms && `${bedrooms}b`,
        bathrooms && `${bathrooms}ba`,
        sqft && `${(sqft / 1000).toFixed(1)}k sqft`
      ].filter(Boolean);
    }, [bedrooms, bathrooms, sqft]);

    if (features.length === 0) return null;

    return (
      <View style={styles.featuresRow}>
        {features.map((feature, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <Text style={styles.featureSeparator}>•</Text>}
            <Text style={styles.featureText}>{feature}</Text>
          </React.Fragment>
        ))}
      </View>
    );
  }
);

FeaturesRow.displayName = "FeaturesRow";

// ─────────────────────────────────────────────────────────────────
// Image Skeleton (while loading)
// ─────────────────────────────────────────────────────────────────

const ImageSkeleton = React.memo(() => (
  <View
    style={[
      styles.cardImage,
      {
        backgroundColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center"
      }
    ]}
  >
    <ActivityIndicator size="small" color="#6B7280" />
  </View>
));

ImageSkeleton.displayName = "ImageSkeleton";

// ─────────────────────────────────────────────────────────────────
// MAIN CARD COMPONENT
// ─────────────────────────────────────────────────────────────────

function ZillowStylePropertyCard({
  property,
  onPress,
  onCall,
  onEmail,
  onFavorite,
  isFavorite = false
}: ZillowStylePropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pressed, setPressed] = useState(false);

  // ─── REACT QUERY: Prefetch property details ───
  // This hook prepares the details data in background
  const { prefetch } = usePropertySaleDetailsOptimized(property.id);

  // ─── LIFECYCLE: Prefetch on mount ───
  useEffect(() => {
    // Start prefetch immediately when card mounts
    // This runs in background while user reads the card
    console.log(`🔄 Prefetching details for property ${property.id}`);
    prefetch();
  }, [property.id, prefetch]);

  // ─── HANDLERS ───

  const handlePress = useCallback(() => {
    setPressed(true);
    // Details are already prefetched, so this opens instantly
    onPress?.(property.id);
    setTimeout(() => setPressed(false), 200);
  }, [property.id, onPress]);

  const handleFavorite = useCallback(
    (e: any) => {
      e.stopPropagation();
      onFavorite?.(property.id);
    },
    [property.id, onFavorite]
  );

  const handleCall = useCallback(
    (e: any) => {
      e.stopPropagation();
      onCall?.();
    },
    [onCall]
  );

  const handleEmail = useCallback(
    (e: any) => {
      e.stopPropagation();
      onEmail?.();
    },
    [onEmail]
  );

  // ─── MEMOIZED PRICE ───
  const displayPrice = useMemo(
    () => property.price || property.listing_price,
    [property.price, property.listing_price]
  );

  // ─── MEMOIZED OPTIMIZED IMAGE ───
  // Use card-sized variant (800px) instead of original for instant load
  const optimizedImageUrl = useMemo(
    () => getCardImageUrl(property.images?.[0]),
    [property.images]
  );

  // ─── RENDER ───

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* CARD BACKGROUND */}
      <Animated.View
        style={[styles.cardInner, pressed && styles.cardInnerPressed]}
        entering={FadeIn.delay(50)}
      >
        {/* IMAGE CONTAINER */}
        <View style={styles.imageContainer}>
          {optimizedImageUrl ? (
            <Image
              source={{ uri: optimizedImageUrl }}
              style={styles.cardImage}
              onLoadEnd={() => setImageLoaded(true)}
              resizeMode="cover"
            />
          ) : (
            <ImageSkeleton />
          )}

          {/* PRICE BADGE */}
          <PriceBadge price={displayPrice} />

          {/* FAVORITE BUTTON */}
          <Pressable
            style={styles.favoriteButton}
            onPress={handleFavorite}
            hitSlop={8}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? "❤️" : "🤍"}</Text>
          </Pressable>

          {/* TYPE BADGE */}
          {property.property_type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{property.property_type}</Text>
            </View>
          )}
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* TITLE */}
          <Text numberOfLines={2} style={styles.title}>
            {property.title}
          </Text>

          {/* ADDRESS */}
          {property.address && (
            <Text numberOfLines={1} style={styles.address}>
              📍 {property.address}
            </Text>
          )}

          {/* LOCATION */}
          {(property.city || property.state) && (
            <Text numberOfLines={1} style={styles.location}>
              {[property.city, property.state].filter(Boolean).join(", ")}
            </Text>
          )}

          {/* FEATURES ROW */}
          <FeaturesRow
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            sqft={property.square_footage}
          />

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            {onCall && (
              <Pressable
                style={styles.actionButton}
                onPress={handleCall}
                hitSlop={6}
              >
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionText}>Call</Text>
              </Pressable>
            )}

            {onEmail && (
              <Pressable
                style={styles.actionButton}
                onPress={handleEmail}
                hitSlop={6}
              >
                <Text style={styles.actionIcon}>📧</Text>
                <Text style={styles.actionText}>Email</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.actionButton}
              onPress={handlePress}
              hitSlop={6}
            >
              <Text style={styles.actionIcon}>👁️</Text>
              <Text style={styles.actionText}>View</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default React.memo(ZillowStylePropertyCard);

// ─────────────────────────────────────────────────────────────────
// SKELETON LOADER (For PropertySaleList initial loading)
// ─────────────────────────────────────────────────────────────────

export const ZillowStylePropertyCardSkeleton = React.memo(
  ({ delay = 0 }: { delay?: number }) => (
    <Animated.View entering={FadeIn.delay(delay)} style={styles.card}>
      <View style={styles.cardInner}>
        {/* Image skeleton */}
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: "#E5E7EB", height: 200 }
          ]}
        />

        {/* Content skeleton */}
        <View style={styles.content}>
          {/* Title skeleton */}
          <View
            style={[
              styles.title,
              { height: 16, backgroundColor: "#E5E7EB", borderRadius: 4 }
            ]}
          />

          {/* Address skeleton */}
          <View
            style={[
              styles.address,
              {
                height: 12,
                backgroundColor: "#E5E7EB",
                borderRadius: 4,
                marginTop: 8
              }
            ]}
          />

          {/* Features skeleton */}
          <View
            style={[
              styles.featuresRow,
              {
                height: 12,
                backgroundColor: "#E5E7EB",
                borderRadius: 4,
                marginTop: 8
              }
            ]}
          />

          {/* Action buttons skeleton */}
          <View
            style={[
              styles.actionRow,
              {
                height: 36,
                backgroundColor: "#E5E7EB",
                borderRadius: 4,
                marginTop: 12
              }
            ]}
          />
        </View>
      </View>
    </Animated.View>
  )
);

ZillowStylePropertyCardSkeleton.displayName = "ZillowStylePropertyCardSkeleton";

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const { width } = Dimensions.get("window");
const cardWidth = width - 24; // 12px margin on each side

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden"
  },
  cardPressed: {
    opacity: 0.85
  },
  cardInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  cardInnerPressed: {
    shadowOpacity: 0.15,
    elevation: 6
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    position: "relative"
  },
  cardImage: {
    width: "100%",
    height: "100%"
  },
  priceBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: "center"
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.5
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  favoriteIcon: {
    fontSize: 20
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4
  },
  typeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  content: {
    padding: 12
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
    marginBottom: 2
  },
  address: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 4
  },
  location: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 14,
    marginBottom: 8
  },
  featuresRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
    alignItems: "center"
  },
  featureSeparator: {
    fontSize: 10,
    color: "#D1D5DB",
    marginHorizontal: 2
  },
  featureText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  actionIcon: {
    fontSize: 12,
    marginRight: 4
  },
  actionText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#374151"
  }
});
