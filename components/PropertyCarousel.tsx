/**
 * PropertyCarousel.tsx
 *
 * Horizontal scrolling carousel for properties (for sale or rent)
 * High performance with virtualization and image caching
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { Heart, MapPin } from "phosphor-react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  seeAllText: {
    fontSize: 12,
    color: "#121212",
    fontWeight: "600",
  },
  carouselContainer: {
    paddingHorizontal: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 12,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
    color: "#121212",
  },
  heartButton: {
    padding: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#717171",
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: "#717171",
    flex: 1,
  },
  emptyState: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
  },
});

interface PropertyCarouselProps {
  title: string;
  properties: any[];
  isLoading: boolean;
  onPropertyPress: (propertyId: number) => void;
  onSeeAll?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const PropertyCarousel = React.memo(
  ({
    title,
    properties,
    isLoading,
    onPropertyPress,
    onSeeAll,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
  }: PropertyCarouselProps) => {
    const safeProperties = Array.isArray(properties) ? properties : [];

    // Format price
    const formatPrice = useCallback((price?: number) => {
      if (!price) return "N/A";
      if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)}M MRU`;
      }
      if (price >= 1000) {
        return `${(price / 1000).toFixed(0)}K MRU`;
      }
      return `${price} MRU`;
    }, []);

    // Render property card
    const renderCard = useCallback(
      ({ item }: { item: any }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => onPropertyPress(item.id)}
          activeOpacity={0.8}
        >
          {/* Thumbnail */}
          {item.thumbnailUrl || item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnailUrl || item.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnail,
                { justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={{ fontSize: 12, color: "#999" }}>No image</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={styles.titleText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title || "Untitled"}
            </Text>

            {/* Price & Like */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => {
                  // Like functionality would go here
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Heart
                  size={18}
                  weight="fill"
                  color={item.liked ? "#FF385C" : "#CCC"}
                />
              </TouchableOpacity>
            </View>

            {/* Meta info */}
            {(item.bedrooms || item.bathrooms) && (
              <View style={styles.meta}>
                {item.bedrooms && (
                  <Text style={styles.metaText}>{item.bedrooms} bd</Text>
                )}
                {item.bathrooms && <Text style={styles.metaText}>·</Text>}
                {item.bathrooms && (
                  <Text style={styles.metaText}>{item.bathrooms} ba</Text>
                )}
              </View>
            )}

            {/* Location */}
            {(item.geo?.city || item.geo?.zone) && (
              <View style={styles.location}>
                <MapPin size={12} color="#717171" weight="fill" />
                <Text
                  style={styles.locationText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.geo.city || item.geo.zone}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ),
      [onPropertyPress, formatPrice],
    );

    // Empty state
    if (!isLoading && safeProperties.length === 0) {
      return (
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No properties available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {onSeeAll && safeProperties.length > 0 && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={onSeeAll}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Carousel or Loading */}
        {isLoading ? (
          <View
            style={[
              styles.carouselContainer,
              {
                height: CARD_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <ActivityIndicator size="small" color="#121212" />
          </View>
        ) : (
          <FlatList
            horizontal
            data={safeProperties}
            renderItem={renderCard}
            keyExtractor={(item) => `prop-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            scrollEventThrottle={16}
            removeClippedSubviews
            onEndReached={() => {
              if (onLoadMore && hasMore && !isLoadingMore) {
                onLoadMore();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={{ marginLeft: 8, justifyContent: "center" }}>
                  <ActivityIndicator size="small" color="#121212" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    );
  },
);

PropertyCarousel.displayName = "PropertyCarousel";
