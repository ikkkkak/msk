import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
  SafeAreaView,
  Share,
  TextInput,
  StatusBar,
  Platform
} from "react-native";
import { Text, Button } from "@ui-kitten/components";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useNavigation } from "@react-navigation/native";
import { endpoints } from "../constants";
import MapView, { Marker } from "react-native-maps";
import { getMapProvider } from "../utils/mapProvider";
import { getPlatformMapViewConfig } from "../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "../components/map/PlatformMapTileLayer";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useUser } from "../hooks/useUser";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop
} from "@gorhom/bottom-sheet";
import {
  Bed,
  Bathtub,
  Play,
  Pause,
  RulerIcon,
  Info
} from "phosphor-react-native";
import { theme } from "../theme";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { getAppLanguage } from "../utils/translation";
// Removed shared element import

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const HERO_HEIGHT = 400;

// Loading Skeleton Component
const Skeleton = ({
  width = "100%",
  height = 20,
  style = {}
}: {
  width?: number | string;
  height?: number;
  style?: any;
}) => <View style={[styles.skeleton, { width, height } as any, style]} />;

// Empty State Component
const EmptyState = ({
  icon,
  title,
  subtitle
}: {
  icon: string;
  title: string;
  subtitle: string;
}) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

export const PropertySaleDetailsScreenNew = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useUser();
  const id = Number(route?.params?.propertyId);
  const { t } = useTranslation();

  const { currentLanguage } = useLanguage();
  const lang = (currentLanguage || getAppLanguage()).toLowerCase();
  const { data, isLoading, error } = useQuery({
    queryKey: ["property-sale", id, lang],
    queryFn: async () => {
      console.log("🔍 Fetching property sale with ID:", id, "Lang:", lang);
      const res = await axios.get(
        `${endpoints.propertySales}/public/${id}?lang=${lang}`
      );
      console.log("📦 Raw response:", res.data);
      const propertyData =
        res.data?.property || res.data?.property_sale || res.data;
      console.log("🏠 Property data:", propertyData);
      return propertyData;
    },
    enabled: !!id
  });

  const images: string[] = useMemo(() => {
    const arr = Array.isArray(data?.images) ? data.images : [];
    return arr.filter(Boolean);
  }, [data]);

  const { data: nearby, isLoading: nearbyLoading } = useQuery({
    queryKey: ["nearby", data?.latitude, data?.longitude],
    queryFn: async () => {
      if (
        typeof data?.latitude !== "number" ||
        typeof data?.longitude !== "number"
      )
        return null;
      const res = await axios.get(
        `${endpoints.nearby}?lat=${data.latitude}&lng=${data.longitude}&radius=3000`
      );
      return res.data;
    },
    enabled:
      typeof data?.latitude === "number" && typeof data?.longitude === "number"
  });

  const [imgIndex, setImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "schools" | "hospitals" | "restaurants"
  >("schools");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  // Bottom Sheet refs
  const contactSheetRef = useRef<BottomSheet>(null);
  const tourSheetRef = useRef<BottomSheet>(null);
  const shareSheetRef = useRef<BottomSheet>(null);
  const floorSheetRef = useRef<BottomSheet>(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any | null>(null);
  const offerSheetRef = useRef<BottomSheet>(null);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.6, HERO_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: "clamp"
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.3, HERO_HEIGHT * 0.7],
    outputRange: [1, 1, 0.3],
    extrapolate: "clamp"
  });

  const contentTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT * 0.3],
    extrapolate: "clamp"
  });

  // Backdrop component for bottom sheets
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>‹</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <Skeleton height={HERO_HEIGHT} style={{ borderRadius: 0 }} />
        <View style={styles.contentPadding}>
          <Skeleton width="70%" height={28} style={{ marginTop: 20 }} />
          <Skeleton width="40%" height={24} style={{ marginTop: 8 }} />
          <Skeleton width="90%" height={16} style={{ marginTop: 12 }} />
          <View style={styles.statsRow}>
            <Skeleton width={80} height={60} style={styles.statCard} />
            <Skeleton width={80} height={60} style={styles.statCard} />
            <Skeleton width={80} height={60} style={styles.statCard} />
          </View>
        </View>
      </View>
    );
  }

  // Error State
  if (error || !data) {
    console.log("❌ Property sale error:", error);
    console.log("📊 Data received:", data);
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerBtnText}>‹</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <EmptyState
          icon="🏠"
          title="Property Not Found"
          subtitle={
            error
              ? `Error: ${error.message}`
              : "We couldn't load this property. Please try again later."
          }
        />
      </View>
    );
  }

  const displayImages =
    images.length > 0 ? images : [data?.image].filter(Boolean);
  const hasCoordinates =
    typeof data?.latitude === "number" && typeof data?.longitude === "number";

  // Debug logging
  console.log("🏠 Property Sale Details - Data:", {
    id: data?.id,
    title: data?.title,
    price: data?.listing_price,
    address: data?.address,
    images: displayImages.length,
    hasCoordinates,
    dataKeys: data ? Object.keys(data) : "No data"
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Animated Header */}
      <Animated.View
        style={[styles.floatingHeader, { opacity: headerOpacity }]}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {data.title || "Property Details"}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn}>
                <Text style={styles.headerIcon}>♡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn}>
                <Text style={styles.headerIcon}>↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Transparent Header for Hero */}
      <View style={styles.transparentHeader}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.headerBtn, styles.transparentBtn]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerBtn, styles.transparentBtn]}
              >
                <Text style={styles.headerIcon}>♡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, styles.transparentBtn]}
              >
                <Text style={styles.headerIcon}>↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image Section */}
        <Animated.View style={[styles.hero, { opacity: imageOpacity }]}>
          <View style={styles.heroImageContainer}>
            {displayImages.length > 0 ? (
              <Image
                source={{ uri: displayImages[imgIndex] }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.hero, styles.noImage]}>
                <Text style={styles.noImageText}>🏠</Text>
                <Text style={styles.noImageSubtext}>No images available</Text>
              </View>
            )}
          </View>

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {imgIndex + 1} / {displayImages.length}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Content Section with Smooth Reveal */}
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateY: contentTranslateY }] }
          ]}
        >
          {/* Price and Title Section */}
          <View style={styles.section}>
            <Text style={styles.priceTag}>
              {data?.listing_price
                ? `$${data.listing_price.toLocaleString()}`
                : "Price on request"}
            </Text>

            <Text style={styles.propertyTitle}>
              {data?.title || "Property"}
            </Text>

            <Text style={styles.address}>
              {data?.address ||
                [data?.city, data?.state, data?.country]
                  .filter(Boolean)
                  .join(", ")}
            </Text>
          </View>

          {/* Property Stats */}
          <View style={styles.section}>
            <View style={styles.statsRow}>
              {data?.bedrooms && (
                <View style={styles.statCard}>
                  <Bed size={20} color="#6B7280" />
                  <Text style={styles.statValue}>{data.bedrooms}</Text>
                  <Text style={styles.statLabel}>Bedrooms</Text>
                </View>
              )}
              {data?.bathrooms && (
                <View style={styles.statCard}>
                  <Bathtub size={20} color="#6B7280" />
                  <Text style={styles.statValue}>{data.bathrooms}</Text>
                  <Text style={styles.statLabel}>Bathrooms</Text>
                </View>
              )}
              {data?.square_footage && (
                <View style={styles.statCard}>
                  <RulerIcon size={20} color="#6B7280" />
                  <Text style={styles.statValue}>{data.square_footage}</Text>
                  <Text style={styles.statLabel}>Sq Ft</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {data?.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this property</Text>
              <Text style={styles.description}>{data.description}</Text>
            </View>
          )}

          {/* Features */}
          {data?.amenities && data.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features & Amenities</Text>
              <View style={styles.featureGrid}>
                {data.amenities
                  .slice(0, 6)
                  .map((amenity: string, index: number) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.featureIcon}>✓</Text>
                      <Text style={styles.featureText}>{amenity}</Text>
                    </View>
                  ))}
                {data.amenities.length > 6 && (
                  <Text style={styles.moreFeatures}>
                    +{data.amenities.length - 6} more features
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Video Section */}
          {data?.video_url && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Video</Text>
              <View style={styles.videoContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: data.video_url }}
                  style={styles.video}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={isVideoPlaying}
                  isLooping
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (status.isLoaded) {
                      setIsVideoPlaying(status.isPlaying);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.videoPlayButton}
                  onPress={() => {
                    if (isVideoPlaying) {
                      videoRef.current?.pauseAsync();
                    } else {
                      videoRef.current?.playAsync();
                    }
                  }}
                >
                  <View style={styles.videoPlayCircle}>
                    {isVideoPlaying ? (
                      <Pause size={24} color="#FFFFFF" />
                    ) : (
                      <Play size={24} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Map Section */}
          {hasCoordinates && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <MapView
                provider={getMapProvider()}
                style={styles.map}
                mapType={getPlatformMapViewConfig("standard").mapType}
                initialRegion={{
                  latitude: data?.latitude || 0,
                  longitude: data?.longitude || 0,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <PlatformMapTileLayer mapStyle="standard" />
                <Marker
                  coordinate={{
                    latitude: data?.latitude || 0,
                    longitude: data?.longitude || 0
                  }}
                  title={data?.title || "Property"}
                />
              </MapView>
              <Text style={styles.mapAddress}>
                {data?.address ||
                  [data?.city, data?.state, data?.country]
                    .filter(Boolean)
                    .join(", ")}
              </Text>
            </View>
          )}

          {/* Nearby Places */}
          {nearby && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's nearby</Text>

              {/* Tab Bar */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "schools" && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab("schools")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "schools" && styles.tabButtonTextActive
                    ]}
                  >
                    Schools
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "hospitals" && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab("hospitals")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "hospitals" && styles.tabButtonTextActive
                    ]}
                  >
                    Hospitals
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "restaurants" && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab("restaurants")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "restaurants" && styles.tabButtonTextActive
                    ]}
                  >
                    Restaurants
                  </Text>
                </TouchableOpacity>
              </View>

              {/* POI List */}
              <View style={styles.poiContainer}>
                {nearby[activeTab]
                  ?.slice(0, 3)
                  .map((poi: any, index: number) => (
                    <View key={index} style={styles.poiCard}>
                      <View style={styles.poiImage}>
                        <Text style={styles.poiEmptyIcon}>📍</Text>
                      </View>
                      <View style={styles.poiContent}>
                        <Text style={styles.poiName}>{poi.name}</Text>
                        <Text style={styles.poiDistance}>{poi.distance}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Agent/Organization Section */}
          {data?.organization && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Agent</Text>
              <View style={styles.agentCard}>
                <View style={styles.agentAvatar}>
                  {data?.organization?.banner_image ? (
                    <Image
                      source={{ uri: data.organization.banner_image }}
                      style={styles.agentAvatar}
                    />
                  ) : (
                    <View style={styles.agentAvatarEmpty}>
                      <Text style={styles.agentAvatarText}>
                        {data?.organization?.name?.charAt(0) || "A"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>
                    {data?.organization?.name || "Agent"}
                  </Text>
                  {data?.organization?.phone && (
                    <Text style={styles.agentContact}>
                      {data.organization.phone}
                    </Text>
                  )}
                  {data?.organization?.website && (
                    <Text style={styles.agentWebsite}>
                      {data.organization.website}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.agentActions}>
                <TouchableOpacity
                  style={styles.agentActionBtn}
                  onPress={() =>
                    Linking.openURL(`tel:${data?.organization?.phone || ""}`)
                  }
                >
                  <Text style={styles.agentActionIcon}>📞</Text>
                  <Text style={styles.agentActionText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.agentActionBtn}
                  onPress={() =>
                    Linking.openURL(
                      `mailto:${data?.organization?.website || ""}`
                    )
                  }
                >
                  <Text style={styles.agentActionIcon}>✉️</Text>
                  <Text style={styles.agentActionText}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity
            style={styles.ctaButtonSecondary}
            onPress={() => contactSheetRef.current?.expand()}
          >
            <Text style={styles.ctaButtonSecondaryText}>Contact Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaButtonPrimary}
            onPress={() => tourSheetRef.current?.expand()}
          >
            <Text style={styles.ctaButtonPrimaryText}>Schedule Tour</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Bottom Sheet */}
      <BottomSheet
        ref={contactSheetRef}
        index={-1}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Contact Agent</Text>
          <Text style={styles.sheetSubtitle}>
            Get in touch with {data?.organization?.name || "the agent"} for more
            information
          </Text>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() =>
              Linking.openURL(`tel:${data?.organization?.phone || ""}`)
            }
          >
            <Text style={styles.sheetOptionIcon}>📞</Text>
            <View style={styles.sheetOptionContent}>
              <Text style={styles.sheetOptionTitle}>Call</Text>
              <Text style={styles.sheetOptionSubtitle}>
                {data?.organization?.phone || "No phone"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() =>
              Linking.openURL(`mailto:${data?.organization?.website || ""}`)
            }
          >
            <Text style={styles.sheetOptionIcon}>✉️</Text>
            <View style={styles.sheetOptionContent}>
              <Text style={styles.sheetOptionTitle}>Email</Text>
              <Text style={styles.sheetOptionSubtitle}>
                {data?.organization?.website || "No email"}
              </Text>
            </View>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      {/* Tour Booking Bottom Sheet */}
      <BottomSheet
        ref={tourSheetRef}
        index={-1}
        snapPoints={["60%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Schedule a Tour</Text>
          <Text style={styles.sheetSubtitle}>
            Book a private viewing of this property
          </Text>

          <TouchableOpacity
            style={styles.ctaButtonPrimary}
            onPress={() => {
              // Handle tour booking
              tourSheetRef.current?.close();
            }}
          >
            <Text style={styles.ctaButtonPrimaryText}>Book Tour</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  safeArea: {
    flex: 0
  },

  // Header Styles
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB"
  },
  transparentHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  transparentBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.95)"
  },
  headerBtnText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827"
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center"
  },
  headerIcon: {
    fontSize: 18,
    color: "#111827"
  },
  headerActions: {
    flexDirection: "row",
    gap: 8
  },

  // Hero Image Styles
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: "#F3F4F6"
  },
  heroImageContainer: {
    flex: 1
  },
  heroImage: {
    width: "100%",
    height: "100%"
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center"
  },
  noImageText: {
    fontSize: 64,
    marginBottom: 8
  },
  noImageSubtext: {
    fontSize: 14,
    color: "#6B7280"
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  imageCounterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF"
  },

  // Content Styles
  scrollView: {
    flex: 1
  },
  content: {
    backgroundColor: "#FFFFFF"
  },
  contentPadding: {
    paddingHorizontal: 20
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20
  },
  divider: {
    height: 8,
    backgroundColor: "#F9FAFB"
  },

  // Price & Title Section
  priceTag: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    lineHeight: 28
  },
  address: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap"
  },
  statCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: "#F9FAFB",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    gap: 6
  },
  statIcon: {
    fontSize: 20
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500"
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#374151"
  },

  // Features Grid
  featureGrid: {
    gap: 12
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4
  },
  featureIcon: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "700"
  },
  featureText: {
    fontSize: 15,
    color: "#374151",
    flex: 1
  },
  moreFeatures: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 8
  },

  // Video Styles
  videoContainer: {
    position: "relative",
    width: "100%",
    height: 220,
    backgroundColor: "#000000",
    borderRadius: 16,
    overflow: "hidden"
  },
  video: {
    width: "100%",
    height: "100%"
  },
  videoPlayButton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  videoPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)"
  },

  // Map Styles
  map: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  mapAddress: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginTop: 4,
    marginBottom: 16
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center"
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280"
  },
  tabButtonTextActive: {
    color: "#111827"
  },

  // POI (Points of Interest) Styles
  poiContainer: {
    gap: 12
  },
  poiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  poiImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center"
  },
  poiEmptyIcon: {
    fontSize: 24
  },
  poiContent: {
    flex: 1
  },
  poiName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4
  },
  poiDistance: {
    fontSize: 13,
    color: "#6B7280"
  },

  // Agent Card Styles
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  agentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E7EB"
  },
  agentAvatarEmpty: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6"
  },
  agentAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  agentInfo: {
    flex: 1
  },
  agentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4
  },
  agentContact: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2
  },
  agentWebsite: {
    fontSize: 13,
    color: "#3B82F6"
  },
  agentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16
  },
  agentActionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  agentActionIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  agentActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151"
  },

  // Bottom CTA Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  bottomBarContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12
  },
  ctaButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center"
  },
  ctaButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827"
  },
  ctaButtonPrimary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center"
  },
  ctaButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF"
  },

  // Bottom Sheet Styles
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8
  },
  sheetSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  sheetOptionIcon: {
    fontSize: 28
  },
  sheetOptionContent: {
    flex: 1
  },
  sheetOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4
  },
  sheetOptionSubtitle: {
    fontSize: 14,
    color: "#6B7280"
  },

  // Loading Skeleton
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden"
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center"
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20
  },

  bottomSpacer: {
    height: 120
  }
});

// Removed shared element configuration
