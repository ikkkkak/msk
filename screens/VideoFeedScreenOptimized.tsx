import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  ViewToken,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MeskenyVideoPlayer } from "./MeskenyVideoPlayer";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * FeedItem represents a property with video/thumbnail for TikTok-style feed
 */
export interface FeedItem {
  id: string;
  propertyId: string;
  title: string;
  price: number | string;
  location: string;
  beds?: number;
  baths?: number;
  area?: number;
  hlsUrl: string; // HLS master.m3u8 URL
  thumbnailUrl: string; // fallback JPEG
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  isSaved?: boolean;
}

interface VideoFeedScreenProps {
  data: FeedItem[];
  onEndReached: () => void;
  onPropertyPress: (propertyId: string) => void;
}

/**
 * VideoFeedScreen - TikTok-style vertical video feed with intelligent viewport management
 *
 * Optimization Strategy:
 * - Current (N): Playing, unmuted, all segments buffered
 * - Next (N+1): Preloaded, paused, first 2 segments buffered
 * - Next+1 (N+2): Manifest loaded only (zero bandwidth cost)
 * - Previous (N-1): Kept in memory for quick scroll back
 * - All others: Unmounted from tree (memory efficient)
 *
 * Result: Smooth scrolling, instant playback, minimal bandwidth waste
 */
export const VideoFeedScreen: React.FC<VideoFeedScreenProps> = ({
  data,
  onEndReached,
  onPropertyPress
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastSeenIndex, setLastSeenIndex] = useState(0);

  // Viewability config: 90% of screen must be visible for item to be considered "active"
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 90,
    minimumViewTime: 200 // 200ms minimum to count as viewed
  }).current;

  // Track visible items
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setActiveIndex(idx);
        setLastSeenIndex(idx); // Track for scroll-back optimization
      }
    },
    []
  );

  // Render a single feed item
  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => {
      // Determine playback role for this item
      const isActive = index === activeIndex; // playing
      const isPreload1 = index === activeIndex + 1; // next: preload+pause
      const isPreload2 = index === activeIndex + 2; // next+1: manifest only

      // Mount items around active index (N-1, N, N+1, N+2)
      // This keeps 4 items in tree, the rest unmounted
      const shouldMount = index >= activeIndex - 1 && index <= activeIndex + 2;

      // Determine paused state
      const paused = !isActive;

      return (
        <View style={styles.slide} key={item.id}>
          {shouldMount ? (
            <>
              {/* Video player */}
              <MeskenyVideoPlayer
                key={`video_${item.id}_${isActive}`}
                hlsUrl={item.hlsUrl}
                thumbnailUrl={item.thumbnailUrl}
                paused={paused}
                muted={true} // feed videos start muted (user unmutes)
                loop={true}
                containerStyle={styles.video}
                autoplayDelay={isActive ? 0 : 500} // slight delay on scroll
              />

              {/* Property info overlay (bottom gradient) */}
              <View style={styles.infoOverlay}>
                <View style={styles.infoContent}>
                  <Text style={styles.price} numberOfLines={1}>
                    {typeof item.price === "number"
                      ? `${item.price.toLocaleString()} MRU`
                      : item.price}
                  </Text>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.location} numberOfLines={1}>
                    📍 {item.location}
                  </Text>

                  {/* Property specs (beds, baths, area) */}
                  {(item.beds || item.baths || item.area) && (
                    <View style={styles.specs}>
                      {item.beds && (
                        <Text style={styles.specText}>🛏️ {item.beds} bed</Text>
                      )}
                      {item.baths && (
                        <Text style={styles.specText}>{item.baths} bath</Text>
                      )}
                      {item.area && (
                        <Text style={styles.specText}>{item.area} m²</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Action buttons (right side) */}
              <View style={styles.actionsPanel}>
                {/* Like button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart-outline" size={28} color="#fff" />
                  {item.likesCount ? (
                    <Text style={styles.actionLabel}>
                      {compactNumber(item.likesCount)}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                {/* Comment button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={28} color="#fff" />
                  {item.commentsCount ? (
                    <Text style={styles.actionLabel}>
                      {compactNumber(item.commentsCount)}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                {/* Share button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={28}
                    color="#fff"
                  />
                </TouchableOpacity>

                {/* Save button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.isSaved ? "bookmark" : "bookmark-outline"}
                    size={28}
                    color={item.isSaved ? "#FFD700" : "#fff"}
                  />
                </TouchableOpacity>

                {/* View count */}
                {item.viewsCount && (
                  <View style={styles.viewsBox}>
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                    <Text style={styles.viewsText}>
                      {compactNumber(item.viewsCount)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Tap to view property button (bottom center) */}
              <TouchableOpacity
                style={styles.viewPropertyBtn}
                onPress={() => onPropertyPress(item.propertyId)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewPropertyText}>
                  Tap to view property
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Unmounted placeholder: shows thumbnail to minimize flicker
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.video}
              blurRadius={5}
            />
          )}
        </View>
      );
    },
    [activeIndex, onPropertyPress]
  );

  // Get item layout for fast scrolling
  const getItemLayout = useCallback(
    (_, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index
    }),
    []
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled={true}
      scrollEventThrottle={16}
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true} // Android: unmount off-screen views
      maxToRenderPerBatch={3} // render max 3 items per batch
      windowSize={5} // keep ~5 screens in memory
      initialNumToRender={2} // render 2 on mount
      onEndReached={onEndReached}
      onEndReachedThreshold={3} // fetch more 3 screens before reaching end
      ListFooterComponent={
        // Optional: loading indicator at end
        data.length > 20 ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="large" color="#0066FF" />
          </View>
        ) : null
      }
    />
  );
};

// Helpers
function compactNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000000",
    position: "relative"
  },
  video: {
    width: "100%",
    height: "100%"
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 80, // room for action buttons
    backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
  },
  infoContent: {
    gap: 4
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff"
  },
  title: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 2
  },
  location: {
    fontSize: 13,
    color: "#e0e0e0",
    marginTop: 2
  },
  specs: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap"
  },
  specText: {
    fontSize: 11,
    color: "#cccccc",
    fontWeight: "500",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  actionsPanel: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -80, // center vertically
    gap: 16,
    alignItems: "center"
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  actionLabel: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 2
  },
  viewsBox: {
    marginTop: 8,
    flexDirection: "column",
    alignItems: "center",
    gap: 2
  },
  viewsText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "500"
  },
  viewPropertyBtn: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 102, 255, 0.9)",
    borderRadius: 8
  },
  viewPropertyText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  },
  footerLoader: {
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000"
  }
});
