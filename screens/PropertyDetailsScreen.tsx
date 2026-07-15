import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { PhosphorIcon } from "../components/PhosphorIcon";
import {
  usePropertyAmenitiesById,
  useAmenities,
} from "../hooks/queries/useCategories";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { getMapProvider } from "../utils/mapProvider";
import { getPlatformMapViewConfig } from "../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "../components/map/PlatformMapTileLayer";
import { LinearGradient } from "expo-linear-gradient";

import { ModernImageCarousel } from "../components/ModernImageCarousel";
import { Screen } from "../components/Screen";
import { theme } from "../theme";
import { useSelectedPropertyQuery } from "../hooks/queries/useSelectedPropertyQuery";
import { useUser } from "../hooks/useUser";
import { BottomSheet } from "../components/BottomSheet";
import { useMyGroups } from "../hooks/queries/useExperienceInvites";
import { api } from "../services/api";
import { endpoints, groupEndpoints } from "../constants";
import { usePropertyLocationCriteria } from "../hooks/queries/usePropertyLocationCriteria";
import { useSharePropertyToGroup } from "../hooks/queries/useChat";
import {
  usePropertyReviews,
  useCreatePropertyReview,
} from "../hooks/queries/usePropertyReviews";
import { useHostProperties } from "../hooks/queries/useHostProperties";
import { useEnsurePushDeviceRegistration } from "../hooks/useEnsurePushDeviceRegistration";
import { ReviewModal } from "../components/ReviewModal";
import { BrokerHostProfileCard } from "../components/broker/BrokerHostProfileCard";
import {
  brokerProfileVisible,
  hostIsVerifiedBroker,
  isVerifiedBrokerUser,
  resolveBrokerPerson,
} from "../components/broker/BrokerVerifiedBadge";
import { ReviewCard } from "../components/ReviewCard";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  ChatIcon,
  FlagIcon,
  HeartIcon,
  UserPlusIcon,
  XIcon,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
// Translation hooks removed - backend handles all translations
import { useLanguage } from "../contexts/LanguageContext";
import Toast from "../components/CustomToast";
import {
  useHideProperty,
  useReportProperty,
  useBlockHost,
} from "../hooks/mutations/usePropertyModeration";
import { useListingWishlist } from "../hooks/useListingWishlist";
import { BlurView } from "expo-blur";
import { Video, ResizeMode } from "expo-av";
import { useQuery } from "@tanstack/react-query";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Simplified image carousel for parallax effect
const ParallaxImageCarousel = ({
  images,
  width,
  height,
}: {
  images: string[];
  width: number;
  height: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {},
  );
  const scrollViewRef = useRef<ScrollView>(null);

  if (!images || images.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: "#F5F5F5",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialIcons name="image" size={64} color="#CCCCCC" />
        <Text style={{ fontSize: 16, color: "#999999", marginTop: 12 }}>
          No images available
        </Text>
      </View>
    );
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index: number) => {};

  return (
    <View style={{ width, height }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(contentOffsetX / width);
          setCurrentIndex(index);
        }}
        style={{ flex: 1 }}
      >
        {images.map((imageUrl, index) => (
          <View key={`image-${index}`} style={{ width, height }}>
            {imageErrors[index] ? (
              <View
                style={{
                  width,
                  height,
                  backgroundColor: "#F5F5F5",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="broken-image" size={48} color="#CCCCCC" />
                <Text style={{ fontSize: 14, color: "#999999", marginTop: 8 }}>
                  Failed to load
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={{ width, height }}
                resizeMode="cover"
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageError(index)}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dots indicator */}
      {images.length > 1 && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {images.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  index === currentIndex ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Sections will be defined inside the component to use translations

export const PropertyDetailsScreen = ({
  route,
}: {
  route: { params: { propertyID: number } };
}) => {
  const { t } = useTranslation();
  // Translation will be handled with useTranslatedText hook where needed
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation();
  const property = useSelectedPropertyQuery(route.params.propertyID);
  const { data: propertyAmenities = [] } = usePropertyAmenitiesById(
    route.params.propertyID,
  );
  const { data: allAmenities = [] } = useAmenities();
  // `property.data` is guarded by early returns below, but it's referenced across
  // many callbacks/sections. Use a permissive type here to avoid TS false-positives.
  const item = property.data as any;
  const propertyIdForVideo = Number(route.params.propertyID);

  // IMPORTANT: Must be declared before any early returns to preserve hook order.
  const propertyVideosQuery = useQuery({
    queryKey: ["propertyVideosForDetails", propertyIdForVideo, currentLanguage],
    enabled: Number.isFinite(propertyIdForVideo) && propertyIdForVideo > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const lang = (currentLanguage || "en").slice(0, 2).toLowerCase();

      const extractVideoUrl = (video: any): string | null => {
        const candidates = [
          video?.video_url,
          video?.videoUrl,
          video?.VideoURL,
          video?.url,
          video?.URL,
          video?.video,
        ];
        for (const c of candidates) {
          if (typeof c === "string" && c.trim().length > 0) return c.trim();
        }
        return null;
      };

      const belongsToProperty = (video: any, pid: number) => {
        const linked = Number(
          video?.property_id ??
            video?.propertyID ??
            video?.PropertyID ??
            video?.Property?.ID ??
            video?.Property?.id,
        );
        return Number.isFinite(linked) && linked === pid;
      };

      // 1) Try direct property filter (backend videos table relation).
      try {
        const direct = await api.get("/video/feed", {
          params: {
            limit: 30,
            lang,
            property_id: propertyIdForVideo,
            propertyID: propertyIdForVideo,
          },
          timeout: 20000,
        });
        const directList = Array.isArray(direct?.data?.videos)
          ? direct.data.videos
          : [];
        const directHit =
          directList.find((v: any) =>
            belongsToProperty(v, propertyIdForVideo),
          ) ?? directList[0];
        const directUrl = extractVideoUrl(directHit);
        if (directUrl) return directUrl;
      } catch {
        // Fall back to broad feed below.
      }

      // 2) Fallback: fetch feed and filter client-side by property relation.
      const broad = await api.get("/video/feed", {
        params: { limit: 80, lang },
        timeout: 20000,
      });
      const broadList = Array.isArray(broad?.data?.videos)
        ? broad.data.videos
        : [];
      const related = broadList.find((v: any) =>
        belongsToProperty(v, propertyIdForVideo),
      );
      return extractVideoUrl(related);
    },
  });

  // Use backend-translated fields directly (no frontend translation needed)
  const propertyTitle = item?.title || "";
  const propertyDescription = item?.description || "";
  const hostBio = item?.host?.bio || "";

  const [showToast, setShowToast] = useState(false);
  const [, setReloadTrigger] = useState(0); // For reload detection

  console.log("🏠 App mounted/reloaded!"); // Debug: App lifecycle

  // Auto-show on mount OR reload
  useEffect(() => {
    console.log("🔄 useEffect triggered - showing toast!"); // Debug: Effect fires
    setShowToast(true);
  }, [setReloadTrigger]); // Changes on reloads

  const handleHide = () => {
    console.log("🛑 Hiding toast from parent"); // Debug
    setShowToast(false);
  };

  const getLocalizedAmenityName = (amenity: any, language: string) => {
    if (!amenity) return "";
    const name =
      amenity.name ?? amenity.label ?? amenity.displayName ?? amenity.title;

    if (typeof name === "string") {
      return name;
    }

    if (name && typeof name === "object") {
      const normalized = (language || "").split("-")[0];
      const priorityOrder = [language, normalized, "ar", "en", "fr"];

      for (const key of priorityOrder) {
        if (key && name[key]) {
          return name[key];
        }
      }

      const firstValue = Object.values(name).find(
        (value) => typeof value === "string" && value.length > 0,
      );
      if (firstValue) {
        return firstValue as string;
      }
    }

    return "";
  };

  const sections = [
    { id: "details", title: t("property.details.details") },
    { id: "host", title: t("property.details.host") },
    { id: "neighborhood", title: t("property.details.neighborhood") },
    { id: "amenities", title: t("property.details.amenities") },
    { id: "rules", title: t("property.details.rules") },
    { id: "cancellation", title: t("property.details.cancellation") },
    { id: "policies", title: t("property.details.policies") },
    { id: "reviews", title: t("property.details.reviews") },
    { id: "location", title: t("property.details.location") },
  ];
  const rawAmenityIds: any[] = Array.isArray(item?.amenities)
    ? (item?.amenities as any[])
    : [];
  const amenityIds = rawAmenityIds
    .map((v: any) => (typeof v === "string" ? parseInt(v, 10) : Number(v)))
    .filter((n: any) => Number.isFinite(n));
  const fromJoin = Array.isArray(propertyAmenities) ? propertyAmenities : [];
  const fromIds =
    amenityIds.length > 0 && Array.isArray(allAmenities)
      ? allAmenities.filter((a: any) => amenityIds.includes(Number(a.id)))
      : [];
  const amenitiesList = (fromJoin.length > 0 ? fromJoin : fromIds) || [];
  const { user } = useUser();
  const { run: ensurePushDeviceRegistration } =
    useEnsurePushDeviceRegistration();
  const rentWishlist = useListingWishlist("rent", route.params.propertyID, {
    showToast: true,
  });

  // Refetch when screen is focused + silent push/device registration when eligible
  useFocusEffect(
    React.useCallback(() => {
      property.refetch();
      const p = property.data;
      if (user?.ID && p) {
        void ensurePushDeviceRegistration({
          city: p.city,
          latitude: p.lat,
          longitude: p.lng,
        });
      }
    }, [
      route.params.propertyID,
      property.refetch,
      property.data,
      user?.ID,
      user?.allowsNotifications,
      ensurePushDeviceRegistration,
    ]),
  );
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  const [sectionPositions, setSectionPositions] = useState<{
    [key: string]: number;
  }>({});
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success",
  );
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { data: myGroups = [] } = useMyGroups();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const shareToGroup = useSharePropertyToGroup(0 as any);

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };
  const { data: locationCriteria } = usePropertyLocationCriteria(
    route.params.propertyID,
  );
  const { data: reviewsData, refetch: refetchReviews } = usePropertyReviews(
    route.params.propertyID,
  );
  const hostUserId =
    (item as any)?.host?.ID ||
    (item as any)?.host?.id ||
    (item as any)?.hostId ||
    (item as any)?.host?.UserID;
  const currentPropertyId = (item as any)?.ID || (item as any)?.id;
  const { data: hostProperties = [], isLoading: isLoadingHostProperties } =
    useHostProperties(
      hostUserId,
      currentPropertyId,
      currentPropertyId, // let server resolve host by property id
    );
  const createReview = useCreatePropertyReview(route.params.propertyID);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const hideProperty = useHideProperty();
  const reportProperty = useReportProperty();
  const blockHost = useBlockHost();
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const current = value + 200; // Approximate offset for header
      let currentSection = sections[0].id;
      let maxY = -Infinity;
      sections.forEach(({ id }) => {
        const y = sectionPositions[id] || 0;
        if (y <= current && y > maxY) {
          maxY = y;
          currentSection = id;
        }
      });
      setActiveSection(currentSection);
    });
    return () => scrollY.removeListener(listener);
  }, [sectionPositions]);

  const handleSectionPress = (id: string) => {
    const y = sectionPositions[id] || 0;
    scrollViewRef.current?.scrollTo({ y: y - 100, animated: true }); // Offset for header
  };

  if (property.isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
        </View>
      </View>
    );
  }

  if (property.error || !property.data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF385C" />
          <Text style={styles.errorTitle}>Unable to load property</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleHeartPress = async () => {
    if (!user || !item) {
      Alert.alert("Login Required", "Please log in to save properties");
      return;
    }
    await rentWishlist.toggle();
  };

  const handleShare = async () => {
    if (!item) return;

    try {
      await Share.share({
        message: `${item.title} - ${item.city}`,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share property");
    }
  };

  const handleAddToGroupWishlist = async (groupId: number) => {
    if (!item) return;
    try {
      await api.post(groupEndpoints.wishlist(groupId), { propertyID: item.ID });
      setShowGroupPicker(false);
    } catch (e) {}
  };

  const getImages = () => {
    if (!item) {
      console.log("PropertyDetailsScreen: No item data");
      return [];
    }

    const rawImages: any[] = Array.isArray((item as any).images)
      ? ((item as any).images as any[])
      : [];

    if (rawImages.length === 0) {
      console.log("PropertyDetailsScreen: No images property on item");
      return [];
    }

    console.log("PropertyDetailsScreen: Raw images array:", rawImages);

    const validImages = rawImages
      .filter((img) => {
        if (typeof img === "string") {
          const isValid =
            img.trim().length > 0 &&
            (img.startsWith("http") || img.startsWith("https"));
          console.log(
            `PropertyDetailsScreen: String image "${img}" - Valid: ${isValid}`,
          );
          return isValid;
        }
        if (
          typeof img === "object" &&
          img &&
          typeof (img as any).url === "string"
        ) {
          const url = String((img as any).url);
          const isValid =
            url.trim().length > 0 &&
            (url.startsWith("http") || url.startsWith("https"));
          console.log(
            `PropertyDetailsScreen: Object image "${url}" - Valid: ${isValid}`,
          );
          return isValid;
        }
        console.log(
          "PropertyDetailsScreen: Invalid image format:",
          typeof img,
          img,
        );
        return false;
      })
      .map((img) => {
        // Ensure we return just the URL string
        if (typeof img === "string") {
          return img;
        }
        if (
          typeof img === "object" &&
          img &&
          typeof (img as any).url === "string"
        ) {
          return String((img as any).url);
        }
        return img;
      });

    return validImages;
  };

  const getPropertyVideoUrl = () => {
    if (
      typeof propertyVideosQuery.data === "string" &&
      propertyVideosQuery.data.trim()
    ) {
      return propertyVideosQuery.data.trim();
    }
    if (!item) return null;
    const candidates = [
      (item as any).video_url,
      (item as any).videoUrl,
      (item as any).video,
      Array.isArray((item as any).videos) ? (item as any).videos[0] : undefined,
      Array.isArray((item as any).video_urls)
        ? (item as any).video_urls[0]
        : undefined,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return null;
  };
  const propertyVideoUrl = getPropertyVideoUrl();

  const getHostName = () => {
    if (!item?.host) return "Host";
    const firstName = item.host.firstName?.trim() || "";
    const lastName = item.host.lastName?.trim() || "";
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : "Host";
  };

  const rentHostBrokerData = item?.host
    ? { owner: item.host as Record<string, unknown> }
    : null;
  const rentVerifiedBroker = hostIsVerifiedBroker(rentHostBrokerData as any);
  const rentBrokerPerson = resolveBrokerPerson(rentHostBrokerData as any);
  const rentShowBrokerProfile = brokerProfileVisible(rentBrokerPerson);

  const getAmenities = () => {
    if (!item?.amenities) return [];
    return Array.isArray(item.amenities) ? item.amenities.slice(0, 6) : [];
  };

  const getCancellationPolicyText = (policy: string) => {
    switch (policy.toLowerCase()) {
      case "flexible":
        return "Free cancellation up to 24 hours before check-in";
      case "moderate":
        return "Free cancellation up to 5 days before check-in";
      case "strict":
        return "Free cancellation up to 7 days before check-in";
      case "super_strict":
        return "Free cancellation up to 30 days before check-in";
      case "long_term":
        return "Free cancellation up to 30 days before check-in";
      default:
        return `Cancellation policy: ${policy}`;
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Parallax effect for hero image
  const imageHeight = screenHeight * 0.4;
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-imageHeight, 0, imageHeight],
    outputRange: [imageHeight / 2, 0, -imageHeight / 3],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-imageHeight, 0, imageHeight],
    outputRange: [2, 1, 0.8],
    extrapolate: "clamp",
  });

  // Floating actions opacity based on scroll
  const floatingActionsOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [1, 0.8, 0.3],
    extrapolate: "clamp",
  });

  // Main content parallax effect
  const mainContentTranslateY = scrollY.interpolate({
    inputRange: [0, imageHeight * 0.6],
    outputRange: [0, -imageHeight * 0.1],
    extrapolate: "clamp",
  });

  const handleLayout = (id: string) => (event: any) => {
    const y = event.nativeEvent.layout.y;
    setSectionPositions((prev) => ({ ...prev, [id]: y }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Default Back Button with BlurView background when no scroll */}
      <View style={styles.defaultBackButton}>
        <BlurView
          intensity={200}
          tint="light"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 99,
              overflow: "hidden",
            },
          ]}
        />
        <TouchableOpacity
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 99,
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          {/* Header Back Button with BlurView background when no scroll */}
          <View style={styles.headerButton}>
            <BlurView
              intensity={200}
              tint="light"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 99,
                  overflow: "hidden",
                },
              ]}
            />
            <TouchableOpacity
              style={[
                StyleSheet.absoluteFill,
                {
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 99,
                },
              ]}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            {/* Favorite/Heart Button with BlurView background when no scroll */}
            <View style={styles.headerButton}>
              <BlurView
                intensity={200}
                tint="light"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 99,
                    overflow: "hidden",
                  },
                ]}
              />
              <TouchableOpacity
                style={[
                  StyleSheet.absoluteFill,
                  {
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 99,
                  },
                ]}
                onPress={handleHeartPress}
              >
                <HeartIcon
                  size={20}
                  color={rentWishlist.isSaved ? "#FF385C" : "#000000"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Tab bar with BlurView background */}
        <View style={{ position: "relative" }}>
          <BlurView
            intensity={200}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              {
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                overflow: "hidden",
                zIndex: 0,
              },
            ]}
          />
          <View style={[styles.tabBar, { zIndex: 1 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            >
              {sections.map(({ id, title }) => (
                <TouchableOpacity
                  key={id}
                  style={styles.tabItem}
                  onPress={() => handleSectionPress(id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeSection === id && styles.activeTabText,
                    ]}
                  >
                    {title}
                  </Text>
                  {activeSection === id && <View style={styles.underline} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.parallaxImageContainer,
              {
                transform: [
                  { translateY: imageTranslateY },
                  { scale: imageScale },
                ],
              },
            ]}
          >
            <ParallaxImageCarousel
              images={getImages()}
              width={screenWidth}
              height={screenHeight * 0.4}
            />
          </Animated.View>
          {propertyVideoUrl ? (
            <TouchableOpacity
              style={styles.heroVideoButton}
              onPress={() => setShowVideoModal(true)}
            >
              <MaterialIcons
                name="play-circle-filled"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.heroVideoButtonText}>
                {t("propertyCard.video", "Video")}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Animated.View
            style={[
              styles.floatingActions,
              { opacity: floatingActionsOpacity },
            ]}
          >
            <BlurView
              intensity={200}
              tint="light"
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: 32, overflow: "hidden" }, // adjust radius as needed for floating button container
              ]}
            />
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleHeartPress}
            >
              <HeartIcon
                size={20}
                color={rentWishlist.isSaved ? "#FF385C" : "#000000"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setShowGroupPicker(true)}
            >
              <UserPlusIcon size={20} color="#000000" />
            </TouchableOpacity>
          </Animated.View>

          {/* Gradient overlay for better text readability */}
          <Animated.View
            style={[
              styles.heroGradientOverlay,
              { opacity: floatingActionsOpacity },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.3)"]}
              style={styles.gradientFill}
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.mainContent,
            {
              transform: [{ translateY: mainContentTranslateY }],
            },
          ]}
        >
          {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}> */}

          {/* Details Section */}
          <View
            onLayout={handleLayout("details")}
            ref={(ref) => {
              sectionRefs.current["details"] = ref;
            }}
          >
            {/* <Text style={styles.sectionTitle}>Details</Text> */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{propertyTitle}</Text>
              <View style={styles.locationRow}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "#EBEBEB",
                  }}
                >
                  <Image
                    source={require("../assets/location-criteria.png")}
                    style={{
                      width: 100,
                      height: 100,
                      position: "absolute",
                      left: -20,
                      top: -20,
                      resizeMode: "cover",
                    }}
                  />
                </View>
                <Text style={styles.location}>
                  {item.city}, {item.state}
                </Text>
              </View>
              {item.rating && item.rating > 0 && (
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={14} color="#FF385C" />
                  <Text style={styles.ratingText}>
                    {item.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>({0} reviews)</Text>
                </View>
              )}
              {reviewsData?.canReview && (
                <TouchableOpacity
                  style={styles.reviewCta}
                  onPress={() => setShowReviewModal(true)}
                >
                  <MaterialIcons name="rate-review" size={16} color="#FFFFFF" />
                  <Text style={styles.reviewCtaText}>Write a review</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="bed" size={20} color="#222222" />
                <Text style={styles.statText}>
                  {item.bedrooms}
                  {t("search.filterModal.bedrooms")} {` `}
                  {item.bedrooms > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="shower"
                  size={20}
                  color="#222222"
                />
                <Text style={styles.statText}>
                  {item.bathrooms}
                  {t("search.filterModal.bathrooms")} {` `}
                  {item.bathrooms > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color="#222222"
                />
                <Text style={styles.statText}>
                  {item.capacity} guest{item.capacity > 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {item.nightlyPrice}
                  {" MRU"}
                </Text>
                <Text style={styles.priceUnit}>/ night</Text>
              </View>
              {/* <Vs */}
            </View>

            <View style={styles.divider} />

            {item.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {" "}
                  {t("property.details.aboutThisPlace")}
                </Text>
                <Text style={styles.description}>{propertyDescription}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Host Section */}
          <View
            onLayout={handleLayout("host")}
            ref={(ref) => {
              sectionRefs.current["host"] = ref;
            }}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              {" "}
              {t("property.details.host")}
            </Text>
            <View style={{ alignItems: "flex-end", marginTop: 6 }}>
              <View
                style={{
                  backgroundColor: "#111",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  maxWidth: 220,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}
                >
                  {t(
                    "property.details.contactHint",
                    "Contact the host for more details",
                  )}
                </Text>
              </View>
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderTopWidth: 8,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: "#111",
                  marginRight: 18,
                }}
              />
            </View>
            {rentVerifiedBroker ? (
              <BrokerHostProfileCard
                data={rentHostBrokerData as any}
                fallbackName={getHostName()}
                compact
              />
            ) : null}
            <View style={styles.hostCard}>
              <View style={styles.hostRow}>
                {!rentVerifiedBroker ? (
                  item.host?.avatarURL ? (
                    <Image
                      source={{ uri: item.host.avatarURL }}
                      style={styles.hostAvatar}
                    />
                  ) : (
                    <View style={styles.hostAvatarPlaceholder}>
                      <MaterialIcons name="person" size={24} color="#484848" />
                    </View>
                  )
                ) : rentShowBrokerProfile ? null : (
                  <View style={styles.hostAvatarPlaceholder}>
                    <MaterialIcons
                      name="verified-user"
                      size={22}
                      color="#008489"
                    />
                  </View>
                )}

                <View style={styles.hostInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {!rentVerifiedBroker ? (
                      <Text style={styles.hostName}>{getHostName()}</Text>
                    ) : !rentShowBrokerProfile ? (
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.hostName}>
                          {t("sale.listedBy", "Listed by")}
                        </Text>
                        <Text style={styles.hostJoined}>
                          {t(
                            "broker.profileHiddenPublic",
                            "Photo hidden. Identity verified by Meskeny.",
                          )}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    <View style={styles.hostActions}>
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={async () => {
                          try {
                            if (!user?.ID) {
                              (navigation as any).navigate("UnifiedAuth", {
                                returnToPropertyId: item.ID,
                              });
                              return;
                            }
                            let text = t(
                              "property.messageToHost",
                              "Hi! I'm interested in your property. Can I book?",
                            );
                            if (typeof prompt === "function") {
                              const p = prompt(
                                t(
                                  "property.messageToHostPlaceholder",
                                  "Hi! I'm interested in your property. Can I book?",
                                ),
                                text,
                              );
                              if (typeof p === "string") text = p;
                            }
                            const ownerID = item?.host?.ID;
                            const tenantID = user.ID;
                            if (!ownerID) {
                              Alert.alert(
                                t("error.missingUserInfo"),
                                t("error.missingUserInfoDescription"),
                              );
                              return;
                            }
                            (navigation as any).navigate("ContactHostReview", {
                              propertyId: item.ID,
                              propertyTitle: item.title,
                              propertyCity: item.city,
                              propertyImage:
                                Array.isArray(item.images) &&
                                item.images.length > 0
                                  ? item.images[0]
                                  : "",
                              ownerID,
                              tenantID,
                              prefillMessage: text,
                              recipientName: getHostName(),
                              hostName: getHostName(),
                              hostAvatarURL: item?.host?.avatarURL || "",
                            });
                          } catch {}
                        }}
                      >
                        <ChatIcon size={16} color="#FFFFFF" />
                        <Text style={styles.contactButtonText}>
                          {" "}
                          {t("property.details.contact")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.hostJoined}>
                    {item.host?.joinedDate
                      ? `Joined in ${new Date(item.host.joinedDate).getFullYear()}`
                      : t("property.details.newMember")}
                  </Text>
                  {item.host?.isVerified &&
                  !isVerifiedBrokerUser(item.host as any) ? (
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons
                        name="verified"
                        size={14}
                        color="#008489"
                      />
                      <Text style={styles.verifiedText}>
                        {t("property.details.verifiedHost")}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Host Bio and Languages */}
              {(item.host?.bio || item.host?.languages) && (
                <View style={styles.hostDetails}>
                  {item.host?.bio && (
                    <View style={styles.hostBioSection}>
                      <Text style={styles.hostBioTitle}>
                        {" "}
                        {t("property.details.aboutTheHost")}
                      </Text>
                      <Text style={styles.hostBioText}>{item.host.bio}</Text>
                    </View>
                  )}

                  {item.host?.languages && item.host.languages.length > 0 && (
                    <View style={styles.hostLanguagesSection}>
                      <Text style={styles.hostLanguagesTitle}>
                        {" "}
                        {t("property.details.languagesSpoken")}
                      </Text>
                      <View style={styles.hostLanguagesList}>
                        {item.host.languages.map(
                          (language: string, index: number) => (
                            <View key={index} style={styles.hostLanguageTag}>
                              <MaterialIcons
                                name="language"
                                size={16}
                                color="#008489"
                              />
                              <Text style={styles.hostLanguageText}>
                                {language}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Moderation actions (hide/report/block host) */}

          {/* ADD A SECTION CALLED REPORT OF BLOCK ADN IF CLICKED SHOW THE BOTTOM SHEET WITH THIS THING THAT WERE HERE */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 5,
            }}
          >
            {/* IT HOULD BE LIEK A FLAG ON THE RIGTH ADN A TEXT CALLED REPORT OR BLOCK THIS HOST OR PROEPRTY AND IF CLICKED THEN IT SHOWS TEH SHEET  */}
            <TouchableOpacity
              style={[
                styles.reportButton,
                { justifyContent: "space-between", width: "100%" },
              ]}
              onPress={() => setShowReportModal(true)}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 10,
                }}
              >
                <FlagIcon size={20} color="#000000" />
                <Text style={styles.reportButtonText}>
                  Report This property or host
                </Text>
              </View>
              <ArrowRightIcon
                size={20}
                color="#000000"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          </View>

          {/* Amenities (Airbnb style) */}
          {amenitiesList.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("property.details.amenities")}
              </Text>
              <View style={styles.amenitiesGrid}>
                {amenitiesList.slice(0, 5).map((amenity: any) => (
                  <View key={amenity.id} style={styles.amenityItem}>
                    <PhosphorIcon name={amenity.icon} size={20} color="#222" />
                    <Text style={styles.amenityText}>
                      {getLocalizedAmenityName(amenity, currentLanguage) ||
                        amenity.name?.en ||
                        amenity.name?.fr ||
                        ""}
                    </Text>
                  </View>
                ))}
              </View>
              {amenitiesList.length > 5 && (
                <TouchableOpacity
                  style={{ marginTop: 12, alignSelf: "flex-start" }}
                  onPress={() =>
                    (navigation as any).navigate("PropertyAmenities", {
                      propertyID: item.ID,
                    })
                  }
                >
                  <Text
                    style={{
                      color: "#222",
                      textDecorationLine: "underline",
                      fontFamily: "CircularStd-Medium",
                    }}
                  >
                    {t("property.details.viewAllAmenities", {
                      count: amenitiesList.length,
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.divider} />

          {/*  */}

          <View style={styles.divider} />

          {/* Rules Section */}
          {item.houseRules && (
            <View
              onLayout={handleLayout("rules")}
              ref={(ref) => {
                sectionRefs.current["rules"] = ref;
              }}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>
                {t("property.details.houseRules")}
              </Text>
              <Text style={styles.ruleText}>
                {item.houseRules.replace("_", " ")}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Cancellation Section */}
          {/* {item.cancellationPolicy && (
            <View
              onLayout={handleLayout("cancellation")}
              ref={(ref) => {
                sectionRefs.current["cancellation"] = ref;
              }}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>
                {t("property.details.cancellationPolicy")}
              </Text>
              <Text style={styles.cancellationText}>
                {getCancellationPolicyText(item.cancellationPolicy)}
              </Text>
            </View>
          )} */}

          <View style={styles.divider} />

          <View style={styles.divider} />

          {/* Reviews Section */}
          {/* <View
            onLayout={handleLayout("reviews")}
            ref={(ref) => {
              sectionRefs.current["reviews"] = ref;
            }}
            style={styles.section}
          > */}
          {/* <Text style={styles.sectionTitle}>
              {t("property.details.reviews")}
            </Text> */}
          {/* Reviews Header with Overall Rating */}
          {/* <View style={styles.reviewsHeader}>
              <View style={styles.overallRatingSection}>
                <View style={styles.ratingDisplay}>
                  <MaterialIcons name="star" size={20} color="#000000" />
                  <Text style={styles.overallRating}>
                    {reviewsData?.averageRating?.toFixed(2) || "0.00"} */}
          {/* </Text>
                  <Text style={styles.ratingDot}>•</Text>
                  <Text style={styles.reviewCount}>
                    {reviewsData?.reviewCount || 0}{" "}
                    {t("property.details.reviews")} */}
          {/* </Text>
                </View>
              </View>
            </View> */}

          {/* Horizontal Scrollable Review Cards */}
          {/* {!reviewsData ||
            !reviewsData.reviews ||
            reviewsData.reviews.length === 0 ? (
              <View style={styles.noReviews}>
                <View style={styles.emptyStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcons
                      key={i}
                      name="star-border"
                      size={18}
                      color="#E0E0E0"
                    />
                  ))}
                </View>
                <Text style={styles.noReviewsText}> */}
          {/* {t("property.details.noReviews")}
                </Text>
                <Text style={styles.noReviewsSubtext}>
                  Be the first to review this property
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalReviews}
                > */}
          {/* {reviewsData.reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewCardHeader}>
                        <Image
                          source={{
                            uri:
                              review.user.avatarURL ||
                              "https://via.placeholder.com/150",
                          }}
                          style={styles.reviewCardAvatar}
                        />
                        <View style={styles.reviewCardInfo}>
                          <Text style={styles.reviewCardName}>
                            {review.user.firstName} {review.user.lastName}
                          </Text>
                          <Text style={styles.reviewCardDate}>
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            ago */}
          {/* </Text>
                        </View>
                      </View>
                      <Text style={styles.reviewCardText} numberOfLines={3}>
                        {review.body || review.title}
                      </Text>
                      <TouchableOpacity style={styles.showMoreButton}>
                        <Text style={styles.showMoreText}>
                          {t("property.details.showMore")}
                        </Text>
                        <MaterialIcons
                          name="keyboard-arrow-right"
                          size={16}
                          color="#000000"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView> */}

          {/* Show All Reviews Button */}
          {/* <TouchableOpacity
                  style={styles.showAllReviewsButton}
                  onPress={() => setShowAllReviewsModal(true)}
                >
                  <Text style={styles.showAllReviewsText}>
                    {t("property.details.showAllReviews", {
                      count: reviewsData.reviews.length,
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {reviewsData?.canReview && (
              <TouchableOpacity
                style={styles.reviewCta}
                onPress={() => setShowReviewModal(true)}
              >
                <MaterialIcons name="rate-review" size={16} color="#FFFFFF" />
                <Text style={styles.reviewCtaText}>
                  {t("property.details.writeReview")}
                </Text> */}
          {/* </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} /> */}

          {/* Location Section */}
          {/* <View */}
          {/* onLayout={handleLayout("location")}
            ref={(ref) => {
              sectionRefs.current["location"] = ref;
            }}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              {t("property.details.whereYoullBe")}
            </Text>
            <View style={styles.mapContainer}>
              <MapView
                provider={getMapProvider()}
                style={styles.map}
                mapType={getPlatformMapViewConfig("standard").mapType}
                initialRegion={{
                  latitude: item.lat || 18.0735,
                  longitude: item.lng || -15.9582,
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                showsPointsOfInterest={false}
                showsBuildings={false}
                showsTraffic={false}
                showsIndoors={false}
                showsCompass={false}
                showsScale={false}
                toolbarEnabled={false}
                cacheEnabled={true}
                loadingEnabled={true}
                loadingIndicatorColor={theme["color-temporary-primary"]}
                loadingBackgroundColor="#FFF"
                liteMode={false}
                maxZoomLevel={18}
                minZoomLevel={10}
              >
                <PlatformMapTileLayer mapStyle="standard" />
                <Marker
                  coordinate={{
                    latitude: item.lat || 18.0735,
                    longitude: item.lng || -15.9582,
                  }}
                  title={item.title}
                  description={item.city}
                  tracksViewChanges={false}
                />
              </MapView>
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>
                  {t("property.details.approximateLocation")}
                </Text>
              </View>
            </View>

            {locationCriteria && (
              <View style={styles.locationCriteriaContainer}>
                <View style={styles.locationCriteriaInfo}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={require("../assets/location-criteria.png")}
                      style={{
                        width: 80,
                        height: 80,
                        position: "absolute",
                        left: -20,
                        top: -20,
                        resizeMode: "cover",
                      }}
                    />
                  </View>
                  <Text style={styles.locationCriteriaText}>
                    {locationCriteria.displayName}
                  </Text>
                </View>
                <Text style={styles.distanceText}>
                  {locationCriteria.distance.toFixed(1)} km away
                </Text>
              </View>
            )} */}
          {/* </View> */}

          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("property.details.moreByHost", "More by this host")}
            </Text>
            {isLoadingHostProperties ? (
              <ActivityIndicator size="small" color="#222" />
            ) : hostProperties && hostProperties.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hostPropertiesScroll}
              >
                {hostProperties.map((hostProperty: any, index: number) => {
                  const propertyImages = Array.isArray(hostProperty.images)
                    ? hostProperty.images
                    : typeof hostProperty.images === "string"
                      ? JSON.parse(hostProperty.images)
                      : [];
                  const propertyPrice =
                    hostProperty.nightlyPrice || hostProperty.NightlyPrice || 0;
                  const propertyRating =
                    hostProperty.rating || hostProperty.Rating || 0;
                  const propertyCity =
                    hostProperty.city || hostProperty.City || "";
                  const hostPropertyTitle =
                    hostProperty.title || hostProperty.Title || "";

                  return (
                    <TouchableOpacity
                      key={hostProperty.ID || hostProperty.id || index}
                      style={[
                        styles.hostPropertyCard,
                        index === 0 && styles.firstHostPropertyCard,
                        index === hostProperties.length - 1 &&
                          styles.lastHostPropertyCard,
                      ]}
                      onPress={() => {
                        const id = Number(hostProperty.ID || hostProperty.id);
                        if (!Number.isFinite(id)) return;
                        (navigation as any).push("PropertyDetails", {
                          propertyID: id,
                        });
                      }}
                      activeOpacity={0.9}
                    >
                      <View style={styles.hostPropertyImageContainer}>
                        {propertyImages && propertyImages.length > 0 ? (
                          <View
                            style={{
                              flexDirection: "row",
                              width: "100%",
                              height: 180,
                            }}
                          >
                            <View
                              style={{
                                flex: 1,
                                flexDirection: "column",
                                marginRight: 2,
                              }}
                            >
                              <Image
                                source={{ uri: propertyImages[0] }}
                                style={{
                                  width: "100%",
                                  height: 89,
                                  borderTopLeftRadius: 12,
                                  borderTopRightRadius: 0,
                                  borderBottomLeftRadius: 0,
                                  borderBottomRightRadius: 0,
                                }}
                                resizeMode="cover"
                              />
                              {propertyImages[2] ? (
                                <Image
                                  source={{ uri: propertyImages[2] }}
                                  style={{
                                    width: "100%",
                                    height: 89,
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    borderBottomLeftRadius: 12,
                                    borderBottomRightRadius: 0,
                                    marginTop: 2,
                                  }}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.hostPropertyPlaceholderImage,
                                    { height: 89, marginTop: 2 },
                                  ]}
                                />
                              )}
                            </View>
                            <View
                              style={{
                                flex: 1,
                                flexDirection: "column",
                                marginLeft: 2,
                              }}
                            >
                              {propertyImages[1] ? (
                                <Image
                                  source={{ uri: propertyImages[1] }}
                                  style={{
                                    width: "100%",
                                    height: 89,
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 12,
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 0,
                                  }}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.hostPropertyPlaceholderImage,
                                    { height: 89 },
                                  ]}
                                />
                              )}
                              {propertyImages[3] ? (
                                <Image
                                  source={{ uri: propertyImages[3] }}
                                  style={{
                                    width: "100%",
                                    height: 89,
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 12,
                                    marginTop: 2,
                                  }}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.hostPropertyPlaceholderImage,
                                    { height: 89, marginTop: 2 },
                                  ]}
                                />
                              )}
                            </View>
                          </View>
                        ) : (
                          <View style={styles.hostPropertyPlaceholderImage}>
                            <MaterialIcons
                              name="home"
                              size={32}
                              color="#E0E0E0"
                            />
                          </View>
                        )}
                      </View>

                      <View style={styles.hostPropertyContent}>
                        <HostPropertyTitle
                          title={hostPropertyTitle}
                          city={propertyCity}
                        />
                        <Text style={styles.hostPropertyPrice}>
                          {new Intl.NumberFormat("fr-MR", {
                            style: "currency",
                            currency: "MRU",
                            minimumFractionDigits: 0,
                          }).format(propertyPrice)}{" "}
                          1 {t("common.night")}
                        </Text>
                        {propertyRating > 0 && (
                          <View style={styles.hostPropertyRating}>
                            <MaterialIcons
                              name="star"
                              size={14}
                              color="#222222"
                            />
                            <Text style={styles.hostPropertyRatingText}>
                              {propertyRating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={{ color: "#717171" }}>
                {t(
                  "property.details.noMoreByHost",
                  "No other properties by this host yet",
                )}
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* About Our App Section */}
          {/* <View style={styles.footerSection}>
            <View style={styles.footerContent}>
              <Text style={styles.footerTitle}>
                {t("property.details.habitatAppPourAvoirDesNouvelles")}
              </Text> */}
          {/* <HeartIcon size={35} color="#FF385C" duotoneColor="#FF385C" weight="duotone" /> */}
          {/* </View>
          </View> */}

          {/* More by this host - bottom placement */}

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </Animated.ScrollView>

      <View style={styles.stickyBottom}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPrice}>
            {item.nightlyPrice}
            {" MRU"}
          </Text>
          <Text style={styles.bottomPriceUnit}>
            / {t("property.details.night")}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={() => {
            const hostID =
              (item as any)?.host?.ID ||
              (item as any)?.host?.id ||
              (item as any)?.hostId ||
              (item as any)?.host?.UserID;
            const hostName = getHostName();
            const hostAvatarURL =
              (item as any)?.host?.avatarURL || (item as any)?.host?.AvatarURL;

            (navigation as any).navigate("ContactHost", {
              propertyID: item.ID,
              propertyTitle: item.title,
              propertyImage: item.images?.[0] || undefined,
              hostID: hostID,
              hostName: hostName,
              hostAvatarURL: hostAvatarURL,
              nightlyPrice: item.nightlyPrice,
            });
          }}
        >
          <Text style={styles.reserveButtonText}>
            {t("property.details.reserve")}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheet
        visible={showGroupPicker}
        onClose={() => setShowGroupPicker(false)}
      >
        <Text style={styles.bottomSheetTitle}>
          {t("property.details.addToGroup")}
        </Text>
        <Text style={styles.bottomSheetSubtitle}>
          {t("property.details.chooseAGroupToSaveThisToTheSharedWishlist")}
        </Text>
        {myGroups.length === 0 ? (
          <View style={styles.bottomSheetEmpty}>
            <Text style={styles.bottomSheetEmptyText}>
              {t("property.details.youAreNotPartOfAnyGroupsYet")}
            </Text>
          </View>
        ) : (
          myGroups.map((g: any) => (
            <TouchableOpacity
              key={String(g.id || g.ID)}
              style={styles.bottomSheetItem}
              onPress={() => handleAddToGroupWishlist(g.id || g.ID)}
            >
              <Text style={styles.bottomSheetItemText}>
                {g.name || g.Name || t("property.details.group")}
              </Text>
              <Text style={styles.bottomSheetItemSubtext}>
                {g.status || g.Status || ""}
              </Text>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          style={styles.bottomSheetCancel}
          onPress={() => setShowGroupPicker(false)}
        >
          <Text style={styles.bottomSheetCancelText}>
            {t("property.details.cancel")}
          </Text>
        </TouchableOpacity>
      </BottomSheet>

      <BottomSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
      >
        <Text style={styles.bottomSheetTitle}>
          {t("property.details.shareToGroup")}
        </Text>
        <Text style={styles.bottomSheetSubtitle}>
          {t("property.details.chooseAGroupToShareThisPropertyInChat")}
        </Text>
        {myGroups.length === 0 ? (
          <View style={styles.bottomSheetEmpty}>
            <Text style={styles.bottomSheetEmptyText}>
              {t("property.details.youAreNotPartOfAnyGroupsYet")}
            </Text>
          </View>
        ) : (
          myGroups.map((g: any) => (
            <TouchableOpacity
              key={String(g.id || g.ID)}
              style={styles.bottomSheetItem}
              onPress={async () => {
                try {
                  const gid = g.id || g.ID;
                  await api.post(groupEndpoints.shareProperty(gid), {
                    propertyID: item.ID,
                  });
                  setShowShareSheet(false);
                } catch {}
              }}
            >
              <Text style={styles.bottomSheetItemText}>
                {g.name || g.Name || t("property.details.group")}
              </Text>
              <Text style={styles.bottomSheetItemSubtext}>
                {g.status || g.Status || ""}
              </Text>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          style={styles.bottomSheetCancel}
          onPress={() => setShowShareSheet(false)}
        >
          <Text style={styles.bottomSheetCancelText}>
            {t("property.details.cancel")}
          </Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Review Modal */}
      {reviewsData?.canReview && reviewsData?.userReservationID && (
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          propertyId={route.params.propertyID}
          reservationId={reviewsData.userReservationID}
          onSuccess={() => {
            refetchReviews();
            setShowReviewModal(false);
          }}
        />
      )}

      {/* All Reviews Modal */}
      {showAllReviewsModal && reviewsData?.reviews && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAllReviewsModal}
          onRequestClose={() => setShowAllReviewsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.allReviewsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("property.details.allReviews", {
                    count: reviewsData.reviews.length,
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowAllReviewsModal(false)}
                >
                  <MaterialIcons name="close" size={24} color="#222" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {reviewsData.reviews.map((review) => (
                  <View key={review.id} style={styles.fullReviewCard}>
                    <View style={styles.fullReviewHeader}>
                      <Image
                        source={{
                          uri:
                            review.user.avatarURL ||
                            "https://via.placeholder.com/150",
                        }}
                        style={styles.fullReviewAvatar}
                      />
                      <View style={styles.fullReviewInfo}>
                        <Text style={styles.fullReviewName}>
                          {review.user.firstName} {review.user.lastName}
                        </Text>
                        <Text style={styles.fullReviewDate}>
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </Text>
                      </View>
                      <View style={styles.fullReviewStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <MaterialIcons
                            key={i}
                            name="star"
                            size={16}
                            color={i < review.stars ? "#FFD700" : "#E0E0E0"}
                          />
                        ))}
                      </View>
                    </View>
                    {review.title && (
                      <Text style={styles.fullReviewTitle}>{review.title}</Text>
                    )}
                    {review.body && (
                      <Text style={styles.fullReviewBody}>{review.body}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Policy Details Modal */}
      <Modal
        visible={showPolicyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.policyModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("property.details.hostPolicyCompliance")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPolicyModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#484848" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.policyModalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Secure Compound Policy */}
              <View style={styles.policyModalItem}>
                <View style={styles.policyModalHeader}>
                  <MaterialIcons
                    name="security"
                    size={24}
                    color={
                      item.secureCompoundAcknowledged ? "#008489" : "#FF6B35"
                    }
                  />
                  <View style={styles.policyModalTitleContainer}>
                    <Text style={styles.policyModalTitle}>
                      {t("property.details.secureCompoundPolicy")}
                    </Text>
                    <Text
                      style={[
                        styles.policyModalStatus,
                        {
                          color: item.secureCompoundAcknowledged
                            ? "#008489"
                            : "#FF6B35",
                        },
                      ]}
                    >
                      {item.secureCompoundAcknowledged
                        ? "✅ " + t("property.details.acknowledged")
                        : "❌ " + t("property.details.notAcknowledged")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.policyModalDescription}>
                  {t("property.details.secureCompoundPolicyDescription")}
                </Text>
              </View>

              {/* Equipment Violation Policy */}
              <View style={styles.policyModalItem}>
                <View style={styles.policyModalHeader}>
                  <MaterialIcons
                    name="build"
                    size={24}
                    color={
                      item.equipmentViolationPolicyAccepted
                        ? "#008489"
                        : "#FF6B35"
                    }
                  />
                  <View style={styles.policyModalTitleContainer}>
                    <Text style={styles.policyModalTitle}>
                      {t("property.details.equipmentViolationPolicy")}
                    </Text>
                    <Text
                      style={[
                        styles.policyModalStatus,
                        {
                          color: item.equipmentViolationPolicyAccepted
                            ? "#008489"
                            : "#FF6B35",
                        },
                      ]}
                    >
                      {item.equipmentViolationPolicyAccepted
                        ? "✅ Accepted"
                        : "❌ Not Accepted"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.policyModalDescription}>
                  {t("property.details.equipmentViolationPolicyDescription")}
                </Text>
              </View>

              {/* User Safety Policy */}
              <View style={styles.policyModalItem}>
                <View style={styles.policyModalHeader}>
                  <MaterialIcons
                    name="safety-check"
                    size={24}
                    color={
                      item.userSafetyPolicyAccepted ? "#008489" : "#FF6B35"
                    }
                  />
                  <View style={styles.policyModalTitleContainer}>
                    <Text style={styles.policyModalTitle}>
                      {t("property.details.userSafetyPolicy")}
                    </Text>
                    <Text
                      style={[
                        styles.policyModalStatus,
                        {
                          color: item.userSafetyPolicyAccepted
                            ? "#008489"
                            : "#FF6B35",
                        },
                      ]}
                    >
                      {item.userSafetyPolicyAccepted
                        ? "✅ " + t("property.details.accepted")
                        : "❌ " + t("property.details.notAccepted")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.policyModalDescription}>
                  {t("property.details.userSafetyPolicyDescription")}
                </Text>
              </View>

              {/* Property Policy */}
              <View style={styles.policyModalItem}>
                <View style={styles.policyModalHeader}>
                  <MaterialIcons
                    name="home"
                    size={24}
                    color={item.propertyPolicyAccepted ? "#008489" : "#FF6B35"}
                  />
                  <View style={styles.policyModalTitleContainer}>
                    <Text style={styles.policyModalTitle}>
                      {t("property.details.propertyPolicy")}
                    </Text>
                    <Text
                      style={[
                        styles.policyModalStatus,
                        {
                          color: item.propertyPolicyAccepted
                            ? "#008489"
                            : "#FF6B35",
                        },
                      ]}
                    >
                      {item.propertyPolicyAccepted
                        ? "✅ " + t("property.details.accepted")
                        : "❌ " + t("property.details.notAccepted")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.policyModalDescription}>
                  {t("property.details.propertyPolicyDescription")}
                </Text>
              </View>
              {showToast && (
                <Toast
                  message={item?.title} // Airbnb-like success msg
                  duration={3000}
                  type="success" // Or 'error' for red icon
                  onHide={handleHide}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReportModal(false);
          setReportReason("");
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              gap: 10,
              paddingHorizontal: 15,
              marginTop: 12,
              marginBottom: 6,
              backgroundColor: "#FFF",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              paddingBottom: 50,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Report property or host
              </Text>
              {/* close x */}
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <XIcon size={20} color="#000000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: "#000" }]}
              onPress={async () => {
                try {
                  if (!user?.accessToken) {
                    Alert.alert(
                      "Login Required",
                      "Please log in to hide properties",
                    );
                    return;
                  }
                  await hideProperty.mutateAsync({
                    propertyId: item.ID,
                    reason: "not_interested",
                  });
                  setToastMsg(
                    t(
                      "video.hideSuccess",
                      "Hidden. This item won't appear again.",
                    ),
                  );
                  setToastType("success");
                  setShowToast(true);
                  try {
                    (navigation as any).goBack();
                  } catch {}
                } catch (e) {
                  setToastMsg(t("video.hideError", "Failed to hide."));
                  setToastType("error");
                  setShowToast(true);
                }
              }}
            >
              <MaterialIcons name="visibility-off" size={16} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>
                {t("search.filterModal.clearFilters", "Hide")}
              </Text>
            </TouchableOpacity>

            {/* {item.host?.ID && (
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#444' }]}
                onPress={async () => {
                  try {
                    if (!user?.accessToken) { Alert.alert('Login Required', 'Please log in to block hosts'); return; }
                    await blockHost.mutateAsync({ hostUserId: item.host.ID, reason: 'blocked_host' });
                    setToastMsg(t('video.hideSuccess', 'Hidden. This item won\'t appear again.'));
                    setToastType('success');
                    setShowToast(true);
                  } catch (e) {
                    setToastMsg(t('video.hideError', 'Failed to perform action.'));
                    setToastType('error');
                    setShowToast(true);
                  }
                }}
              >
                <MaterialIcons name="block" size={16} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>{t('property.details.blockHost', 'Block host')}</Text>
              </TouchableOpacity>
            )} */}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVideoModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.videoModalRoot}>
          <TouchableOpacity
            style={styles.videoModalClose}
            onPress={() => setShowVideoModal(false)}
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {propertyVideoUrl ? (
            <Video
              source={{ uri: propertyVideoUrl }}
              style={styles.videoModalPlayer}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
              isLooping={false}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

// Host Property Title Component - uses backend-translated title
const HostPropertyTitle = React.memo(
  ({ title, city }: { title: string; city: string }) => {
    // Title is already translated by backend based on device language
    const fullTitle = `${title}${city ? ` in ${city}` : ""}`;
    return (
      <Text style={hostPropertyTitleStyles.hostPropertyTitle} numberOfLines={1}>
        {fullTitle}
      </Text>
    );
  },
);

// Temporary styles for HostPropertyTitle component (will be merged with main styles)
const hostPropertyTitleStyles = StyleSheet.create({
  translationIconContainerSmall: {
    position: "absolute",
    top: -6,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 3,
    shadowColor: "#00A699",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "#00A699",
  },
  hostPropertyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
    flexWrap: "wrap",
  },
});

const styles = StyleSheet.create({
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Book",
  },
  retryButton: {
    backgroundColor: "#FF385C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "CircularStd-Medium",
  },
  defaultBackButton: {
    position: "absolute",
    top: 44,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 101,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#FFFFFF",
    paddingTop: 44,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  heroVideoButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(17,24,39,0.88)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroVideoButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  videoModalRoot: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalClose: {
    position: "absolute",
    top: 54,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  videoModalPlayer: {
    width: "100%",
    height: "100%",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    // paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
  },
  tabItem: {
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  tabText: {
    fontSize: 10,
    color: "#484848",
    fontFamily: "CircularStd-Medium",
  },
  activeTabText: {
    color: "#222222",
    fontWeight: "bold",
  },
  underline: {
    height: 2,
    backgroundColor: theme["color-temporary-primary"],
    width: "50%",
    marginTop: 4,
  },
  heroSection: {
    position: "relative",
    height: screenHeight * 0.4,
    overflow: "hidden",
  },
  parallaxImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5F5F5", // Fallback background
  },
  heroGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    zIndex: 1,
  },
  gradientFill: {
    flex: 1,
  },
  placeholderContainer: {
    width: screenWidth,
    height: screenHeight * 0.4,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 12,
    fontFamily: "CircularStd-Book",
  },
  floatingActions: {
    position: "absolute",
    top: 50,
    right: 16,
    flexDirection: "row",
    gap: 12,
    zIndex: 2,
  },
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 24,
  },
  translationIconContainer: {
    position: "absolute",
    top: -8,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#00A699",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "#00A699",
  },
  translationIconContainerDescription: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#00A699",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "#00A699",
  },
  translationIconContainerSmall: {
    position: "absolute",
    top: -6,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 3,
    shadowColor: "#00A699",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "#00A699",
  },
  title: {
    fontSize: 22, // Reduced from 26
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    lineHeight: 28, // Adjusted for better spacing
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 14, // Reduced from 16
    color: "#484848",
    fontFamily: "CircularStd-Book",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14, // Reduced from 16
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Medium",
  },
  ratingCount: {
    fontSize: 12, // Reduced from 14
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    // marginVertical: 24,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statText: {
    fontSize: 12, // Reduced from 14
    color: "#222222",
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
    textAlign: "center",
  },
  priceSection: {
    paddingVertical: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  price: {
    fontSize: 24, // Reduced from 28
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
  },
  priceUnit: {
    fontSize: 14, // Reduced from 16
    color: "#484848",
    fontFamily: "CircularStd-Book",
    marginLeft: 6,
  },
  priceDetails: {
    marginTop: 8,
  },
  priceDetailText: {
    fontSize: 14, // Reduced from 16
    color: "#222222",
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
  },
  priceDetailSubtext: {
    fontSize: 12, // Reduced from 14
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  sectionTitle: {
    fontSize: 22,
    marginTop: 24,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 16,
  },
  hostCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  hostAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 4,
  },
  hostJoined: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    color: "#008489",
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
  },
  hostDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  hostBioSection: {
    marginBottom: 16,
  },
  hostBioTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 8,
  },
  hostBioText: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
    lineHeight: 20,
  },
  hostLanguagesSection: {
    marginBottom: 8,
  },
  hostLanguagesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 8,
  },
  hostLanguagesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hostLanguageTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  hostLanguageText: {
    fontSize: 13,
    color: "#008489",
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
    marginLeft: 6,
  },
  hostActions: {},
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222222",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "CircularStd-Medium",
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#222222",
    fontFamily: "CircularStd-Book",
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    gap: 12,
  },
  amenityText: {
    fontSize: 16,
    color: "#222222",
    fontFamily: "CircularStd-Book",
    flex: 1,
  },
  ruleText: {
    fontSize: 16,
    color: "#222222",
    fontFamily: "CircularStd-Book",
    lineHeight: 24,
  },
  cancellationText: {
    fontSize: 16,
    color: "#222222",
    // padding: 16,
  },
  mapContainer: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapOverlayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
  },
  locationCriteriaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  locationCriteriaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationCriteriaText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222222",
    fontFamily: "CircularStd-Medium",
  },
  distanceText: {
    fontSize: 14,
    color: "#484848",
    fontWeight: "500",
    fontFamily: "CircularStd-Book",
  },
  footerSection: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
  },
  footerContent: {
    // flexDirection: 'row',
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    gap: 8,
  },
  footerTitle: {
    fontSize: 50,
    fontWeight: "600",
    color: "#aaa",
    fontFamily: "CircularStd-Bold",
    textAlign: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  footerLink: {
    fontSize: 14,
    color: "#008489",
    fontFamily: "CircularStd-Medium",
  },
  footerCopyright: {
    fontSize: 12,
    color: "#484848",
    fontFamily: "CircularStd-Book",
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 120, // Increased to account for sticky bottom
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
  },
  bottomPriceUnit: {
    fontSize: 16,
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  reserveButton: {
    backgroundColor: theme["color-temporary-primary"],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "CircularStd-Medium",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 8,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
    marginBottom: 16,
  },
  bottomSheetEmpty: {
    paddingVertical: 16,
  },
  bottomSheetEmptyText: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  bottomSheetItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  bottomSheetItemText: {
    fontSize: 16,
    color: "#222222",
    fontFamily: "CircularStd-Medium",
  },
  bottomSheetItemSubtext: {
    fontSize: 12,
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  bottomSheetCancel: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  bottomSheetCancelText: {
    color: "#222222",
    fontSize: 16,
    fontFamily: "CircularStd-Medium",
  },
  reviewCta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginHorizontal: "20%",
    justifyContent: "center",
    borderColor: "#000",
    borderWidth: 1,
  },
  reviewCtaText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "CircularStd-Medium",
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  ratingSummary: {
    marginTop: 8,
  },
  noReviews: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyStars: {
    flexDirection: "row",
    marginBottom: 12,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
    fontFamily: "CircularStd-Medium",
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: "#717171",
    fontFamily: "CircularStd-Book",
  },
  reviewsList: {
    marginTop: 8,
  },
  showAllReviews: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginTop: 8,
  },
  showAllText: {
    fontSize: 14,
    color: "#008489",
    fontFamily: "CircularStd-Medium",
    marginRight: 4,
  },
  // New Airbnb-style review UI styles
  overallRatingSection: {
    marginBottom: 16,
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  overallRating: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 4,
    fontFamily: "CircularStd-Medium",
  },
  ratingDot: {
    fontSize: 16,
    color: "#000000",
    marginHorizontal: 8,
  },
  reviewCount: {
    fontSize: 16,
    color: "#000000",
    fontFamily: "CircularStd-Book",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#222222",
    fontFamily: "CircularStd-Book",
  },
  categoryRatings: {
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500",
    width: 100,
    fontFamily: "CircularStd-Medium",
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  categoryScore: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600",
    width: 30,
    textAlign: "right",
    fontFamily: "CircularStd-Medium",
  },
  reviewsContainer: {
    marginTop: 8,
  },
  horizontalReviews: {
    paddingRight: 16,
  },
  reviewCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 10,
    marginHorizontal: 10,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#F0F0F0",
  },
  reviewCardInfo: {
    flex: 1,
  },
  reviewCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2,
    fontFamily: "CircularStd-Medium",
  },
  reviewCardDate: {
    fontSize: 14,
    color: "#717171",
    fontFamily: "CircularStd-Book",
  },
  reviewCardText: {
    fontSize: 14,
    color: "#222222",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: "CircularStd-Book",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  showMoreText: {
    fontSize: 14,
    color: "#000000",
    textDecorationLine: "underline",
    fontFamily: "CircularStd-Book",
  },
  showAllReviewsButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 16,
  },
  showAllReviewsText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
  },
  // All Reviews Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "flex-end",
  },
  allReviewsModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Medium",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fullReviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  fullReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fullReviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#F0F0F0",
  },
  fullReviewInfo: {
    flex: 1,
  },
  fullReviewName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
    fontFamily: "CircularStd-Medium",
  },
  fullReviewDate: {
    fontSize: 14,
    color: "#717171",
    fontFamily: "CircularStd-Book",
  },
  fullReviewStars: {
    flexDirection: "row",
  },
  fullReviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    fontFamily: "CircularStd-Medium",
  },
  fullReviewBody: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
    fontFamily: "CircularStd-Book",
  },

  // Policy Section Styles
  policyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  policyContent: {
    marginLeft: 12,
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 4,
  },
  policyText: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  policyAcceptances: {
    marginTop: 16,
    marginBottom: 20,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  policySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
  },
  policySummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  policySummaryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    fontFamily: "CircularStd-Medium",
  },
  policySummaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  policySummaryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "CircularStd-Bold",
  },
  disclaimerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    marginTop: 16,
  },
  disclaimerContent: {
    marginLeft: 12,
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E65100",
    fontFamily: "CircularStd-Bold",
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 14,
    color: "#BF360C",
    fontFamily: "CircularStd-Book",
    lineHeight: 20,
  },
  // Policy Modal Styles
  policyModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    marginTop: "auto",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  policyModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  policyModalItem: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  policyModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  policyModalTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  policyModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
    marginBottom: 4,
  },
  policyModalStatus: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "CircularStd-Medium",
  },
  policyModalDescription: {
    fontSize: 14,
    color: "#484848",
    fontFamily: "CircularStd-Book",
    lineHeight: 20,
    marginLeft: 36,
  },

  // Neighborhood Section Styles
  neighborhoodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  neighborhoodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  neighborhoodTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    fontFamily: "CircularStd-Bold",
  },
  neighborhoodDescription: {
    fontSize: 15,
    color: "#484848",
    lineHeight: 22,
    fontFamily: "CircularStd-Book",
    marginBottom: 16,
  },
  neighborhoodPlaceholder: {
    fontSize: 15,
    color: "#717171",
    fontStyle: "italic",
    fontFamily: "CircularStd-Book",
    marginBottom: 16,
  },
  nearbyAttractions: {
    marginTop: 8,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
    fontFamily: "CircularStd-Bold",
  },
  attractionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  attractionText: {
    fontSize: 14,
    color: "#484848",
    marginLeft: 8,
    fontFamily: "CircularStd-Book",
  },

  // Airbnb-style amenities (deduped — already defined earlier)

  // Timing Section Styles
  timingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  timingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginLeft: 8,
    fontFamily: "CircularStd-Bold",
  },
  timingDetails: {
    marginBottom: 12,
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  timingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2,
    fontFamily: "CircularStd-Bold",
  },
  timingValue: {
    fontSize: 15,
    color: "#484848",
    fontFamily: "CircularStd-Book",
  },
  timingNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  timingNoteText: {
    fontSize: 13,
    color: "#717171",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontFamily: "CircularStd-Book",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  reportButtonText: {
    fontSize: 14,
    color: "#000000",
    fontFamily: "CircularStd-Medium",
  },
  // More by this host styles
  hostPropertiesScroll: {
    paddingRight: 15,
  },
  hostPropertyCard: {
    width: 170,
    marginRight: 12,
  },
  firstHostPropertyCard: {
    marginLeft: 0,
  },
  lastHostPropertyCard: {
    marginRight: 0,
  },
  hostPropertyImageContainer: {
    height: 180,
    width: 170,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    borderColor: "#F5F5F5",
    borderWidth: 1,
  },
  hostPropertyPlaceholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  hostPropertyContent: {
    paddingHorizontal: 4,
  },
  hostPropertyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  hostPropertyPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
  },
  hostPropertyRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hostPropertyRatingText: {
    fontSize: 12,
    color: "#222222",
    fontWeight: "500",
  },
});
