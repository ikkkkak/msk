import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  Animated,
  Platform,
  Linking,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Video, ResizeMode } from "expo-av";
import {
  useLocationCriteria,
  useMultipleLocationProperties,
  type RentDiscoveryQueryFilters,
} from "../hooks/queries/useLocationDiscovery";
import { useLanguage } from "../contexts/LanguageContext";
import { useVideoFeedQuery } from "../hooks/queries/useVideoFeedQuery";
import { useUser } from "../hooks/useUser";
import { useEnsurePushDeviceRegistration } from "../hooks/useEnsurePushDeviceRegistration";
import { useListingWishlist } from "../hooks/useListingWishlist";
import { useTranslation } from "react-i18next";
import { theme } from "../theme";
import ShareSheet from "./ShareSheet";
import { Share, Play, Pause, Heart } from "phosphor-react-native";
import CustomToast from "./CustomToast";
import {
  getRentVideoPropertyId,
  getRentVideoPlaybackUrl,
  getRentVideoThumbnail,
  getRentVideoPropertyTitle,
  getRentVideoPropertyNightlyPrice,
  isLinkedRentListingVideo,
  getServerListingVideo,
} from "../utils/rentalVideo";
import { isRentPropertyPublic } from "../utils/rentPropertyVisibility";
import { resolvePropertyImages } from "../utils/propertyImages";
import {
  readRentPropertyCategoryId,
  useRentPropertyCategoryOptions,
} from "../hooks/useRentPropertyCategoryOptions";

const { width } = Dimensions.get("window");
const CARD_IMAGE_WIDTH = width - 32; // tighter padding for Chinese app style
const VIDEO_HOME_CARD_WIDTH = width * 0.52;
const VIDEO_HOME_CARD_GAP = 12;
const CHINESE_RED = theme["color-temporary-primary"];
const GOLD = "#D4AF37";

// ============================================================
// Info Table Component (Explanatory)
// ============================================================
const InfoTable = ({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: string; highlight?: boolean }[];
}) => (
  <View style={infoTableStyles.container}>
    <View style={infoTableStyles.header}>
      <Text style={infoTableStyles.headerText}>{title}</Text>
    </View>
    {data.map((item, idx) => (
      <View
        key={idx}
        style={[
          infoTableStyles.row,
          idx === data.length - 1 && infoTableStyles.lastRow,
          item.highlight && infoTableStyles.highlightRow,
        ]}
      >
        <Text style={infoTableStyles.label}>{item.label}</Text>
        <Text
          style={[
            infoTableStyles.value,
            item.highlight && infoTableStyles.highlightValue,
          ]}
        >
          {item.value}
        </Text>
      </View>
    ))}
  </View>
);

const infoTableStyles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 8,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
  },
  header: {
    backgroundColor: "#2C3E50",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE",
  },
  lastRow: { borderBottomWidth: 0 },
  highlightRow: { backgroundColor: "#FFF8E7" },
  label: { fontSize: 11, color: "#666", fontWeight: "500" },
  value: { fontSize: 11, color: "#1A1A1A", fontWeight: "600" },
  highlightValue: { color: CHINESE_RED, fontWeight: "700" },
});

const trustStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: { flex: 1 },
  title: { fontSize: 11, fontWeight: "700", color: GOLD, letterSpacing: 0.5 },
  subtitle: { fontSize: 9, color: "#AAA", marginTop: 1 },
});

// ============================================================
// Button Group with Parent Background
// ============================================================
const ActionButton = ({
  icon,
  label,
  onPress,
  variant = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "whatsapp";
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: CHINESE_RED,
          borderWidth: 0,
        };
      case "secondary":
        return { backgroundColor: "#2C3E50", borderWidth: 0 };
      case "whatsapp":
        return { backgroundColor: "#25D366", borderWidth: 0 };
      default:
        return {
          backgroundColor: "#FFF",
          borderWidth: 1,
          borderColor: "#E0E0E0",
        };
    }
  };
  const getTextStyle = () => {
    switch (variant) {
      case "primary":
        return { color: "#FFF" };
      case "secondary":
        return { color: "#FFF" };
      case "whatsapp":
        return { color: "#FFF" };
      default:
        return { color: "#1A1A1A" };
    }
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 6,
          flex: 1,
        },
        getButtonStyle(),
      ]}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={[{ fontSize: 15, fontWeight: "600" }, getTextStyle()]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const ButtonGroup = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      flexDirection: "row",
      gap: 8,
      borderRadius: 10,
      marginTop: 8,
    }}
  >
    {children}
  </View>
);

// ============================================================
// Skeleton Card (Enhanced)
// ============================================================
const SkeletonCard: React.FC<{
  isFirst?: boolean;
  isLast?: boolean;
  delay?: number;
}> = ({ isFirst, isLast, delay = 0 }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(
    new Animated.Value(Platform.OS === "android" ? 1 : 0),
  ).current;
  const scaleAnim = useRef(
    new Animated.Value(Platform.OS === "android" ? 1 : 0.95),
  ).current;

  useEffect(() => {
    if (Platform.OS === "android") {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      shimmerAnimation.setValue(0);
      return;
    }
    const fadeInTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    const startShimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => startShimmer());
    };
    const shimmerTimer = setTimeout(startShimmer, delay + 200);
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(shimmerTimer);
    };
  }, [delay]);

  const shimmerStyle = {
    opacity: shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0.8],
    }),
  };

  return (
    <Animated.View
      style={[
        styles.propertyCard,
        isFirst && styles.firstCard,
        isLast && styles.lastCard,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.propertyImageContainer}>
        <Animated.View style={[styles.skeletonImage, shimmerStyle]} />
      </View>
      <View style={styles.propertyContent}>
        <Animated.View style={[styles.skeletonText1, shimmerStyle]} />
        <Animated.View style={[styles.skeletonText2, shimmerStyle]} />
        <Animated.View style={[styles.skeletonText3, shimmerStyle]} />
      </View>
    </Animated.View>
  );
};

// ============================================================
// Floating PiP mini-player
// ============================================================
interface PipPlayerProps {
  video: any;
  onClose: () => void;
  onOpen: () => void;
  translateX: Animated.Value;
}
const PipPlayer: React.FC<PipPlayerProps> = ({
  video,
  onClose,
  onOpen,
  translateX,
}) => {
  const { t } = useTranslation();
  const thumbnail =
    video?.thumbnailURL ||
    video?.thumbnail ||
    video?.Thumbnail ||
    video?.previewImage;
  const title = video?.caption || video?.title || video?.Title || "";
  return (
    <Animated.View
      style={[styles.pipContainer, { transform: [{ translateX }] }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.pipCard}
        onPress={onOpen}
        activeOpacity={0.92}
      >
        <View style={styles.pipThumb}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={styles.pipImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.pipPlaceholder}>
              <MaterialIcons name="play-circle-filled" size={24} color="#FFF" />
            </View>
          )}
          <View style={styles.pipPlayOverlay}>
            <Play size={12} color="#FFF" weight="fill" />
          </View>
        </View>
        <View style={styles.pipInfo}>
          <Text style={styles.pipLabel}>{t("video.discover", "Discover")}</Text>
          <Text style={styles.pipTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.pipCta}>{t("common.viewMore", "View more")}</Text>
        </View>
        <TouchableOpacity
          style={styles.pipClose}
          onPress={onClose}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <MaterialIcons name="close" size={14} color="#555" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================
// Main Component
// ============================================================
interface AirbnbHomeDiscoveryProps {
  onViewAll?: (locationKey: string, locationName: string) => void;
  /** Passed from SearchScreen when the rent filter bar is fixed above this component */
  discoveryFilters?: RentDiscoveryQueryFilters;
  /** Hides StatusBar; filter bar is rendered on SearchScreen */
  embeddedInSearchScreen?: boolean;
}

function assignScrollViewRef<T>(
  ref: React.Ref<T> | undefined,
  value: T | null,
) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else {
    try {
      (ref as React.MutableRefObject<T | null>).current = value;
    } catch {
      /* noop */
    }
  }
}

export const AirbnbHomeDiscovery = forwardRef<
  ScrollView,
  AirbnbHomeDiscoveryProps
>(function AirbnbHomeDiscovery(
  { onViewAll, discoveryFilters = {}, embeddedInSearchScreen = false },
  forwardedRef,
) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useUser();
  const { run: ensurePushDeviceRegistration } =
    useEnsurePushDeviceRegistration();

  useFocusEffect(
    useCallback(() => {
      if (user?.ID) void ensurePushDeviceRegistration();
    }, [user?.ID, user?.allowsNotifications, ensurePushDeviceRegistration]),
  );

  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const setScrollViewRef = useCallback(
    (node: ScrollView | null) => {
      scrollViewRef.current = node;
      assignScrollViewRef(forwardedRef, node);
    },
    [forwardedRef],
  );
  const lastScrollY = useRef(0);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success",
  );
  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const pipTranslateX = useRef(new Animated.Value(320)).current;
  const [showPip, setShowPip] = useState(false);
  const pipVisible = useRef(false);
  const videoSectionY = useRef<number>(0);
  const [pipDismissed, setPipDismissed] = useState(false);

  const showPipPlayer = useCallback(() => {
    if (pipDismissed) return;
    setShowPip(true);
    Animated.spring(pipTranslateX, {
      toValue: 0,
      tension: 70,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [pipDismissed, pipTranslateX]);
  const hidePipPlayer = useCallback(
    (dismiss = false) => {
      Animated.spring(pipTranslateX, {
        toValue: 320,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }).start(() => {
        setShowPip(false);
        if (dismiss) setPipDismissed(true);
      });
    },
    [pipTranslateX],
  );

  const { currentLanguage } = useLanguage();
  const langParam = (currentLanguage || "en").toLowerCase();
  const {
    data: locationCriteria,
    isLoading: criteriaLoading,
    error: criteriaError,
  } = useLocationCriteria(langParam);
  const { data: videos, isLoading: videosLoading } = useVideoFeedQuery(1, 50);
  const firstVideo =
    videos?.find((v) => isLinkedRentListingVideo(v)) ?? videos?.[0];

  const handleViewAll = (locationKey: string, locationName: string) => {
    if (onViewAll) {
      onViewAll(locationKey, locationName);
      return;
    }
    const criteriaEntry = locationCriteria?.find(
      (c: any) =>
        c.name === locationKey ||
        c.displayName === locationKey ||
        c.name === locationKey.toLowerCase() ||
        c.displayName?.toLowerCase() === locationKey.toLowerCase(),
    );
    (navigation as any).navigate("LocationSearch", {
      location: locationKey,
      locationName,
      criteriaId: criteriaEntry?.id,
      lat: criteriaEntry?.centerLat,
      lng: criteriaEntry?.centerLng,
      radiusKm: criteriaEntry?.radius ?? 5,
      filterByLocationCriteria: true,
    });
  };

  const handleScrollToTop = () =>
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const isScrollingDown = scrollY > lastScrollY.current;
    const isScrollingUp = scrollY < lastScrollY.current;
    if (isScrollingDown && scrollY > 100) {
      setShowScrollToTop(true);
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isScrollingUp && scrollY < 50) {
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowScrollToTop(false));
    }
    const threshold = videoSectionY.current + 20;
    if (
      scrollY > threshold &&
      !pipVisible.current &&
      !pipDismissed &&
      firstVideo
    ) {
      pipVisible.current = true;
      showPipPlayer();
    } else if (scrollY <= threshold && pipVisible.current) {
      pipVisible.current = false;
      hidePipPlayer();
    }
    lastScrollY.current = scrollY;
  };

  const locationSections = useMemo(
    () =>
      (locationCriteria ?? [])
        .map((criteria: any) => ({
          title: criteria.displayName,
          locationKey: criteria.name,
          locationName: criteria.displayName,
          criteriaId: criteria.id,
          description: criteria.description,
          icon: criteria.icon,
          color: criteria.color,
          propertyCount: criteria.propertyCount,
        }))
        .filter((s: any) => s.propertyCount > 0),
    [locationCriteria],
  );
  const criteriaIds = useMemo(
    () => locationSections.map((s: any) => s.criteriaId),
    [locationSections],
  );

  const {
    data: allLocationData,
    isLoading: propertiesLoading,
    isFetching: propertiesFetching,
    isPlaceholderData: propertiesPlaceholder,
    isRefetching: propertiesRefetching,
    error: propertiesError,
  } = useMultipleLocationProperties(
    criteriaIds.length > 0 ? criteriaIds : [],
    50,
    langParam,
    discoveryFilters,
  );
  const stripStaleDiscoveryRows =
    propertiesPlaceholder && propertiesFetching && !propertiesRefetching;
  const allProperties = useMemo(() => {
    const combined: Array<{ property: any; locationCriteria: any }> = [];
    if (allLocationData && locationSections.length > 0) {
      allLocationData.forEach((locationData: any, index: number) => {
        const section = locationSections[index];
        if (section && locationData?.properties) {
          locationData.properties.forEach((property: any) => {
            if (!isRentPropertyPublic(property)) return;
            combined.push({
              property,
              locationCriteria: {
                displayName: section.locationName,
                locationKey: section.locationKey,
                criteriaId: section.criteriaId,
              },
            });
          });
        }
      });
    }
    return combined;
  }, [allLocationData, locationSections]);

  const displayProperties = stripStaleDiscoveryRows ? [] : allProperties;
  const isLoading =
    criteriaLoading ||
    ((propertiesLoading || propertiesFetching) &&
      displayProperties.length === 0);
  const hasError = criteriaError || propertiesError;

  return (
    <View style={styles.container}>
      {!embeddedInSearchScreen && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}
      <ScrollView
        ref={setScrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.verticalScrollContent}
      >
        {/*  TEMPORARY COMMENTED */}
        {/* <View
          onLayout={(e) => {
            videoSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <VideoFeedSection
            videos={videos}
            videosLoading={videosLoading}
            onNavigateToVideo={(videoId) =>
              (navigation as any).navigate("VideoFeed", {
                initialVideoId: videoId,
              })
            }
            onViewMore={() => (navigation as any).navigate("Videos")}
          />
        </View> */}
        {isLoading ? (
          <View style={styles.discoverySkeletonGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={`rent-sk-${i}`} style={styles.discoverySkeletonCard} />
            ))}
          </View>
        ) : hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {t(
                "homeDiscovery.error",
                "Unable to load properties. Please try again later.",
              )}
            </Text>
          </View>
        ) : displayProperties.length > 0 ? (
          <View style={styles.twoColumnContainer}>
            {displayProperties.map((item, index) => (
              <React.Fragment
                key={`${item.property.id || item.property.ID}-${item.locationCriteria.criteriaId}-${index}`}
              >
                <PropertyCard
                  property={item.property}
                  locationCriteria={item.locationCriteria}
                  delay={index * 50}
                  onToast={showToastMessage}
                />
                {index === 3 && (
                  <View style={styles.fullWidthPromo}>
                    <AddFreePromo
                      onPress={() =>
                        (navigation as any).navigate("AddListingGuide")
                      }
                    />
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {t("homeDiscovery.empty", "No properties found.")}
            </Text>
          </View>
        )}
      </ScrollView>
      {/*TEMPO COMMENTED */}
      {/* {showPip && firstVideo && (
        <PipPlayer
          video={firstVideo}
          translateX={pipTranslateX}
          onClose={() => hidePipPlayer(true)}
          onOpen={() => {
            hidePipPlayer(true);
            (navigation as any).navigate("VideoFeed", {
              initialVideoId: (firstVideo as any).id || (firstVideo as any).ID
            });
          }}
        />
      )} */}
      {showScrollToTop && (
        <Animated.View
          style={[styles.scrollToTopContainer, { opacity: buttonOpacity }]}
        >
          <TouchableOpacity
            style={styles.scrollToTopButton}
            onPress={handleScrollToTop}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="keyboard-arrow-up"
              size={20}
              color={CHINESE_RED}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
      {showToast && (
        <CustomToast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      )}
    </View>
  );
});

// ============================================================
// AddFreePromo (Enhanced)
// ============================================================
const AddFreePromo: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.promoCard}>
      <View style={styles.promoContent}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View>
            <Text style={styles.promoTitle}>
              {t("promo.addFree.title", "Add your listing free for 14 days")}
            </Text>
            <Text style={styles.promoSubtitle} numberOfLines={3}>
              {t(
                "promo.addFree.subtitle",
                "List for sale, rent, or land — wide reach, easy experience.",
              )}
            </Text>
            <TouchableOpacity style={styles.promoCta} onPress={onPress}>
              <Text style={styles.promoCtaText}>
                {t("promo.addFree.cta", "Start now")}
              </Text>
            </TouchableOpacity>
          </View>
          <Image
            width={50}
            height={50}
            style={{
              width: 80,
              height: 80,
              position: "absolute",
              right: 10,
              bottom: -10,
              maxWidth: 100,
              maxHeight: 100,
              minWidth: 60,
              minHeight: 60,
            }}
            resizeMode="contain"
            source={require("../assets/land1.jpg")}
          />
        </View>
      </View>
    </View>
  );
};

// ============================================================
// VideoFeedSection (Enhanced)
// ============================================================
interface VideoFeedSectionProps {
  videos?: any[];
  videosLoading?: boolean;
  onNavigateToVideo: (videoId: string) => void;
  onViewMore: () => void;
}
const VideoFeedSection: React.FC<VideoFeedSectionProps> = ({
  videos,
  videosLoading,
  onNavigateToVideo,
  onViewMore,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const displayVideos = useMemo(() => {
    const raw = videos ?? [];
    const linked = raw.filter((v) => isLinkedRentListingVideo(v));
    if (linked.length > 0) return linked;
    return raw.filter(
      (v) => getRentVideoPlaybackUrl(v) || getRentVideoThumbnail(v),
    );
  }, [videos]);

  const [isPlaying, setIsPlaying] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const videoCarouselIndexRef = useRef(0);

  useEffect(() => {
    if (!displayVideos || displayVideos.length === 0) return;
    const interval = setInterval(() => {
      if (!isPlaying) return;
      const next = (videoCarouselIndexRef.current + 1) % displayVideos.length;
      videoCarouselIndexRef.current = next;
      flatListRef.current?.scrollToIndex({
        index: next,
        animated: true,
        viewPosition: 0,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [displayVideos, isPlaying]);

  if (videosLoading) {
    return (
      <View style={styles.videoSection}>
        <View style={styles.videoSectionHeader}>
          <Text style={styles.videoSectionTitle}>
            {t("homeDiscovery.videoDiscover", "Discover videos")}
          </Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[1, 2, 3]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, gap: 12 }}
          renderItem={() => (
            <View style={styles.videoCardSkeleton}>
              <View style={styles.videoSkeleton} />
              <View style={styles.videoInfoSkeleton}>
                <View style={styles.videoTitleSkeleton} />
                <View style={styles.videoSubtitleSkeleton} />
              </View>
            </View>
          )}
        />
      </View>
    );
  }

  if (!displayVideos || displayVideos.length === 0) {
    return (
      <View style={styles.videoSection}>
        <View style={styles.videoSectionHeader}>
          <Text style={styles.videoSectionTitle}>
            {t("homeDiscovery.videoDiscover", "Discover videos")}
          </Text>
        </View>
        <View style={styles.videoEmptyWrap}>
          <MaterialIcons name="videocam-off" size={36} color="#C4C4C4" />
          <Text style={styles.videoEmptyText}>
            {t(
              "homeDiscovery.videoEmpty",
              "No property videos yet. Listings with an approved video tour will appear here.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.videoSection}>
      <View style={styles.videoSectionHeader}>
        <Text style={styles.videoSectionTitle}>
          {t("homeDiscovery.videoDiscover", "Discover videos")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setIsPlaying((p) => !p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.videoAutoToggle}
          >
            <MaterialIcons
              name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
              size={22}
              color="#222222"
            />
            <Text style={styles.videoAutoToggleText}>
              {isPlaying
                ? t("homeDiscovery.videoCarouselOn", "Auto-scroll on")
                : t("homeDiscovery.videoCarouselOff", "Auto-scroll off")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
            <Text style={styles.viewMoreText}>
              {t("common.viewMore", "View more")}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color="#222222" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={displayVideos}
        keyExtractor={(item: any, i) =>
          String(item?.id ?? item?.ID ?? `v-${i}`)
        }
        contentContainerStyle={{
          paddingLeft: 16,
          paddingRight: 16,
          gap: VIDEO_HOME_CARD_GAP,
        }}
        snapToInterval={VIDEO_HOME_CARD_WIDTH + VIDEO_HOME_CARD_GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const idx = Math.round(
            x / (VIDEO_HOME_CARD_WIDTH + VIDEO_HOME_CARD_GAP),
          );
          if (idx >= 0 && idx < displayVideos.length) {
            videoCarouselIndexRef.current = idx;
          }
        }}
        onScrollToIndexFailed={({ index }) => {
          flatListRef.current?.scrollToOffset({
            offset:
              Math.max(0, index) *
              (VIDEO_HOME_CARD_WIDTH + VIDEO_HOME_CARD_GAP),
            animated: true,
          });
        }}
        getItemLayout={(_, index) => ({
          length: VIDEO_HOME_CARD_WIDTH + VIDEO_HOME_CARD_GAP,
          offset: (VIDEO_HOME_CARD_WIDTH + VIDEO_HOME_CARD_GAP) * index,
          index,
        })}
        renderItem={({ item }) => {
          const thumb = getRentVideoThumbnail(item);
          const title = getRentVideoPropertyTitle(item);
          const price = getRentVideoPropertyNightlyPrice(item);
          const pid = getRentVideoPropertyId(item);
          const vid = String(item?.id ?? item?.ID ?? "");
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.videoCard, { width: VIDEO_HOME_CARD_WIDTH }]}
              onPress={() => {
                if (pid) {
                  (navigation as any).navigate("PropertyDetails", {
                    propertyID: pid,
                  });
                } else if (vid) {
                  onNavigateToVideo(vid);
                }
              }}
            >
              <View
                style={[
                  styles.videoContainer,
                  { width: VIDEO_HOME_CARD_WIDTH },
                ]}
              >
                {thumb ? (
                  <Image
                    source={{ uri: thumb }}
                    style={styles.videoThumbnail}
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <MaterialIcons
                      name="play-circle-filled"
                      size={48}
                      color="#FFF"
                    />
                  </View>
                )}
                <View style={styles.playButton}>
                  <MaterialIcons name="play-arrow" size={28} color="#FFF" />
                </View>
                <View style={styles.videoInfoOverlay}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {title ||
                      t("homeDiscovery.videoUntitled", "Rental listing")}
                  </Text>
                  {price > 0 && (
                    <Text style={styles.videoTitle}>
                      {price.toLocaleString("fr-MR", {
                        maximumFractionDigits: 0,
                      })}{" "}
                      MRU
                      <Text style={{ fontWeight: "500", fontSize: 12 }}>
                        {" "}
                        {t("homeDiscovery.videoPerNight", "/ night")}
                      </Text>
                    </Text>
                  )}
                </View>
                {!!item?.durationSec && (
                  <View
                    style={[
                      styles.durationBadge,
                      { backgroundColor: "rgba(0,0,0,0.55)" },
                    ]}
                  >
                    <Text style={styles.durationText}>
                      {Math.round(Number(item.durationSec) / 60)}′
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.videoOpenFeedBtn}
                onPress={() => vid && onNavigateToVideo(vid)}
              >
                <Text style={styles.videoOpenFeedBtnText}>
                  {t("homeDiscovery.openVideoFeed", "Watch in feed")}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

// ============================================================
// PropertyCard (Enhanced)
// ============================================================
interface PropertyCardProps {
  property: any;
  locationCriteria?: {
    displayName: string;
    locationKey: string;
    criteriaId: number;
  };
  isFirst?: boolean;
  isLast?: boolean;
  delay?: number;
  onToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  locationCriteria,
  isFirst,
  isLast,
  delay = 0,
  onToast,
}) => {
  const navigation = useNavigation();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useUser();
  const propertyId = Number(property.id || property.ID) || undefined;
  const rentWishlist = useListingWishlist("rent", propertyId, {
    showToast: true,
  });
  const { currentLanguage } = useLanguage();
  const langParam = (currentLanguage || "en").toLowerCase();
  const { t } = useTranslation();
  const { labelForCategoryId } = useRentPropertyCategoryOptions();

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => onToast?.(message, type);

  const fadeAnim = useRef(
    new Animated.Value(Platform.OS === "android" ? 1 : 0),
  ).current;
  const scaleAnim = useRef(
    new Animated.Value(Platform.OS === "android" ? 1 : 0.95),
  ).current;
  useEffect(() => {
    if (Platform.OS === "android") {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      return;
    }
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.02,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const propertyImages = useMemo(
    () => resolvePropertyImages(property),
    [property],
  );
  const serverListingVideo = useMemo(
    () => getServerListingVideo(property),
    [property],
  );
  const linkedVideoUrl = useMemo(
    () =>
      serverListingVideo ? getRentVideoPlaybackUrl(serverListingVideo) : "",
    [serverListingVideo],
  );
  const listingTourModeration = useMemo(() => {
    if (!serverListingVideo) return null;
    const s = String(serverListingVideo.status ?? "")
      .trim()
      .toLowerCase();
    if (s === "pending") return "pending" as const;
    if (s === "approved") return "approved" as const;
    return null;
  }, [serverListingVideo]);
  const listingTourPosterUri = useMemo(() => {
    if (!serverListingVideo) return "";
    const u = getRentVideoThumbnail(serverListingVideo);
    return typeof u === "string" && u.trim() ? u.trim() : "";
  }, [serverListingVideo]);
  const [mediaMode, setMediaMode] = useState<"photos" | "video">("photos");
  /** Width of the hero area (card column), for photo carousel paging — not used for video tour (full-bleed). */
  const [heroMediaWidth, setHeroMediaWidth] = useState(() =>
    Math.max(280, CARD_IMAGE_WIDTH),
  );

  useEffect(() => {
    setCurrentImageIndex(0);
    try {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch {
      /* list may not be mounted yet */
    }
    setMediaMode(
      linkedVideoUrl && propertyImages.length === 0 ? "video" : "photos",
    );
  }, [property.id, property.ID, linkedVideoUrl, propertyImages.length]);

  const propertyPrice = Number(
    property.nightlyPrice ?? property.NightlyPrice ?? 0,
  );
  const propertyCurrency = property.currency || property.Currency || "MRU";
  const propertyCategoryLabel = useMemo(() => {
    const categoryId = readRentPropertyCategoryId(property);
    return labelForCategoryId(categoryId);
  }, [property, labelForCategoryId]);
  const propertyCity =
    property.city || property.City || t("trips.defaultCity", "Nouakchott");
  const propertyTitle = property.title || property.Title || "";
  const propertyDescription =
    property.description ||
    property.Description ||
    property.summary ||
    property.Summary ||
    "";
  const unitPrice =
    Number.isFinite(propertyPrice) &&
    propertyPrice > 0 &&
    (property.square_footage || property.area)
      ? Math.round(
          propertyPrice / Number(property.square_footage || property.area),
        )
      : null;

  const hostPhone = useMemo(() => {
    const candidates = [
      property?.organization?.phone,
      property?.organization?.whatsapp,
      property?.owner?.phone,
      property?.owner?.phone_number,
      property?.agent?.phone,
    ];
    const picked = candidates.find(
      (v: unknown) => typeof v === "string" && v.trim().length > 0,
    );
    return typeof picked === "string" ? picked.trim() : "";
  }, [property]);
  const hostEmail = useMemo(() => {
    const candidates = [
      property?.organization?.email,
      property?.owner?.email,
      property?.agent?.email,
      property?.organization?.website,
    ];
    const picked = candidates.find(
      (v: unknown) => typeof v === "string" && v.trim().length > 0,
    );
    return typeof picked === "string" ? picked.trim() : "";
  }, [property]);

  const feeTableRows = useMemo(() => {
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    const hoa = Number(property?.hoa_fee);
    if (Number.isFinite(hoa) && hoa > 0) {
      rows.push({
        label: t("propertyCard.hoaFee", "HOA / management fee"),
        value: `${hoa.toLocaleString()} MRU ${t("propertyCard.perMonth", "/ month")}`,
        highlight: true,
      });
    }
    const tax = Number(property?.property_tax);
    if (Number.isFinite(tax) && tax > 0) {
      rows.push({
        label: t("propertyCard.propertyTax", "Property tax"),
        value: `${tax.toLocaleString()} MRU ${t("propertyCard.perYear", "/ year")}`,
      });
    }
    return rows;
  }, [property?.hoa_fee, property?.property_tax, t]);

  const mediaBadges = useMemo(() => {
    const badges: string[] = [];
    if (property?.trucheck)
      badges.push(t("propertyCard.trucheckVerified", "TruCheck verified"));
    if (property?.off_plan) badges.push(t("propertyCard.offPlan", "Off-plan"));
    if (property?.initial_sale)
      badges.push(t("propertyCard.initialSale", "Initial sale"));
    return badges;
  }, [property?.trucheck, property?.off_plan, property?.initial_sale, t]);

  useEffect(() => {
    if (propertyImages.length > 0) {
      propertyImages.forEach((uri: string) => {
        if (uri) Image.prefetch(uri).catch(() => {});
      });
    }
  }, [property.id || property.ID]);
  const handlePress = () =>
    (navigation as any).navigate("PropertyDetails", {
      propertyID: property.id || property.ID,
    });
  const toggleLike = async () => {
    if (!user) {
      showToastMessage(t("listingWishlist.loginRequired"), "info");
      return;
    }
    await rentWishlist.toggle();
  };

  const formatPriceMRU = (price: number) => {
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0) return "0";
    return n.toLocaleString("fr-MR", { maximumFractionDigits: 0 });
  };
  const handleWhatsApp = useCallback(() => {
    if (!hostPhone) return;
    const cleaned = hostPhone.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() => {});
  }, [hostPhone]);
  const renderCarouselImage = useCallback(
    ({ item: uri }: { item: string }) => (
      <View style={{ width: heroMediaWidth, height: 200, overflow: "hidden" }}>
        <Image
          source={{ uri }}
          style={styles.carouselImageFill}
          resizeMode="cover"
          fadeDuration={Platform.OS === "android" ? 0 : 300}
        />
      </View>
    ),
    [heroMediaWidth],
  );
  const onCarouselMomentumEnd = useCallback(
    (e: any) => {
      const pageW = Math.max(1, heroMediaWidth);
      const index = Math.round(e.nativeEvent.contentOffset.x / pageW);
      if (
        index !== currentImageIndex &&
        index >= 0 &&
        index < propertyImages.length
      ) {
        setCurrentImageIndex(index);
      }
    },
    [currentImageIndex, propertyImages.length, heroMediaWidth],
  );

  return (
    <Animated.View
      style={[
        styles.propertyCard,
        isFirst && styles.firstCard,
        isLast && styles.lastCard,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.propertyCardInner}>
        {/* Hero: toggles + photos carousel OR full-bleed linked property video (not part of photo slider). */}
        <View
          style={styles.propertyImageContainer}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setHeroMediaWidth(w);
          }}
        >
          <View style={styles.mediaToggleWrap} pointerEvents="box-none">
            <View style={styles.mediaToggleRow}>
              <Pressable
                onPress={() => setMediaMode("photos")}
                style={({ pressed }) => [
                  styles.mediaToggleChip,
                  mediaMode === "photos" && styles.mediaToggleChipOn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.mediaToggleChipTxt,
                    mediaMode === "photos" && styles.mediaToggleChipTxtOn,
                  ]}
                >
                  {t("homeDiscovery.mediaPhotos", "Photos")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!linkedVideoUrl) {
                    showToastMessage(
                      t(
                        "homeDiscovery.noApprovedVideoTour",
                        "No approved video tour for this listing yet.",
                      ),
                      "info",
                    );
                    return;
                  }
                  setMediaMode("video");
                }}
                style={({ pressed }) => [
                  styles.mediaToggleChip,
                  mediaMode === "video" &&
                    !!linkedVideoUrl &&
                    styles.mediaToggleChipOn,
                  !linkedVideoUrl && styles.mediaToggleChipUnavailable,
                  pressed && !!linkedVideoUrl && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.mediaToggleChipInner,
                    { maxWidth: Math.max(120, heroMediaWidth - 28) },
                  ]}
                >
                  <Text
                    style={[
                      styles.mediaToggleChipTxt,
                      mediaMode === "video" &&
                        !!linkedVideoUrl &&
                        styles.mediaToggleChipTxtOn,
                      !linkedVideoUrl && styles.mediaToggleChipTxtUnavailable,
                    ]}
                    numberOfLines={1}
                  >
                    {t("homeDiscovery.mediaPropertyVideo", "Property video")}
                  </Text>
                  {listingTourModeration === "pending" && !!linkedVideoUrl && (
                    <View style={styles.pendingTourPill}>
                      <Text style={styles.pendingTourPillTxt}>
                        {t(
                          "homeDiscovery.videoTourPendingBadge",
                          "Pending approval",
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          </View>
          {mediaMode === "video" && linkedVideoUrl ? (
            <View style={styles.propertyTourVideoShell} pointerEvents="auto">
              <Video
                key={`property-tour-${property.id ?? property.ID}-${linkedVideoUrl}`}
                source={{ uri: linkedVideoUrl }}
                style={styles.propertyTourVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={mediaMode === "video"}
                isMuted
                useNativeControls
                {...(listingTourPosterUri
                  ? { posterSource: { uri: listingTourPosterUri } }
                  : {})}
              />
            </View>
          ) : propertyImages.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={propertyImages}
                keyExtractor={(_, i) => i.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={heroMediaWidth}
                snapToAlignment="start"
                initialNumToRender={1}
                maxToRenderPerBatch={3}
                windowSize={3}
                removeClippedSubviews
                getItemLayout={(_, index) => ({
                  length: heroMediaWidth,
                  offset: heroMediaWidth * index,
                  index,
                })}
                renderItem={renderCarouselImage}
                onMomentumScrollEnd={onCarouselMomentumEnd}
                nestedScrollEnabled={Platform.OS === "android"}
                style={styles.imageCarousel}
                contentContainerStyle={{ flexGrow: 1 }}
              />
              {propertyImages.length > 1 && (
                <View style={styles.imageIndicators}>
                  {propertyImages.slice(0, 5).map((_: any, i: number) => (
                    <View
                      key={i}
                      style={[
                        styles.indicatorDot,
                        i === currentImageIndex && styles.activeIndicatorDot,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : linkedVideoUrl ? (
            <View style={styles.propertyTourVideoShell} pointerEvents="auto">
              <Video
                key={`property-tour-only-${property.id ?? property.ID}-${linkedVideoUrl}`}
                source={{ uri: linkedVideoUrl }}
                style={styles.propertyTourVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
                useNativeControls
                {...(listingTourPosterUri
                  ? { posterSource: { uri: listingTourPosterUri } }
                  : {})}
              />
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="home" size={32} color="#E0E0E0" />
            </View>
          )}
          {/* {mediaBadges.length > 0 && (
            <View style={styles.mediaBadgesRow}>
              {mediaBadges.map((badge) => (
                <View key={badge} style={styles.mediaBadge}>
                  <Text style={styles.mediaBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )} */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={toggleLike}
            disabled={rentWishlist.isPending}
          >
            {rentWishlist.isSaved ? (
              <Heart size={18} color={CHINESE_RED} weight="fill" />
            ) : (
              <Heart size={18} color="#FFF" weight="regular" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShowShareSheet(true)}
          >
            <Share size={18} color="#FFF" weight="bold" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.propertyCardBodyTouchable}
          onPress={handlePress}
          activeOpacity={0.92}
          delayPressIn={80}
        >
          <View style={styles.propertyContent}>
            <View style={styles.priceRow}>
              <Text style={styles.propertyPrice}>
                {formatPriceMRU(propertyPrice)}
                <Text style={styles.priceUnit}> MRU</Text>
              </Text>
            </View>
            <View style={styles.specsRow}>
              <View style={styles.specItem}>
                <MaterialIcons name="bed" size={14} color="#5B6472" />
                <Text style={styles.specTxt}>
                  <Text style={styles.specNum}>{property.bedrooms || 0}</Text>
                  {t("propertyCard.specBedSuffix", " bd")}
                </Text>
              </View>
              <View style={styles.specItem}>
                <MaterialIcons name="bathtub" size={14} color="#5B6472" />
                <Text style={styles.specTxt}>
                  <Text style={styles.specNum}>{property.bathrooms || 0}</Text>
                  {t("propertyCard.specBathSuffix", " ba")}
                </Text>
              </View>
              {(property.square_footage || property.area) && (
                <View style={styles.specItem}>
                  <MaterialIcons name="grid-view" size={14} color="#5B6472" />
                  <Text style={styles.specTxt}>
                    <Text style={styles.specNum}>
                      {property.square_footage || property.area}
                    </Text>{" "}
                    m²
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {propertyTitle}
            </Text>
            {propertyCategoryLabel ? (
              <Text style={styles.propertyCategoryLabel} numberOfLines={1}>
                {propertyCategoryLabel}
              </Text>
            ) : null}
            {propertyDescription && (
              <Text style={styles.propertyDesc} numberOfLines={1}>
                {propertyDescription}
              </Text>
            )}
            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={12} color="#94A3B8" />
              <Text style={styles.locationText} numberOfLines={1}>
                {propertyCity || locationCriteria?.displayName || ""}
              </Text>
            </View>

            {/* Explanatory Table for Property Details */}
            {feeTableRows.length > 0 && (
              <InfoTable
                title={t("propertyCard.feesSectionTitle", "Fee breakdown")}
                data={feeTableRows}
              />
            )}

            {!!property.validation_text && (
              <View style={styles.validationBar}>
                <MaterialIcons name="verified" size={14} color="#3B82F6" />
                <Text style={styles.validationText} numberOfLines={1}>
                  {property.validation_text}
                </Text>
              </View>
            )}
            {(property.handover_date || property.payment_plan) && (
              <View style={styles.detailChipsRow}>
                {!!property.handover_date && (
                  <View style={styles.detailChip}>
                    <Text style={styles.detailChipText}>
                      {t("homeDiscovery.chips.handover", "Handover: {{date}}", {
                        date: property.handover_date,
                      })}
                    </Text>
                  </View>
                )}
                {!!property.payment_plan && (
                  <View style={styles.detailChip}>
                    <Text style={styles.detailChipText}>
                      {t(
                        "homeDiscovery.chips.paymentPlan",
                        "Payment plan: {{plan}}",
                        { plan: property.payment_plan },
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <ButtonGroup>
              <ActionButton
                icon={<Feather name="mail" size={12} color="#FFF" />}
                label={t("propertyCard.emailInquiry", "Email")}
                onPress={() => {
                  if (!hostEmail) return;
                  const isWeb = /^https?:\/\//i.test(hostEmail);
                  Linking.openURL(
                    isWeb ? hostEmail : `mailto:${hostEmail}`,
                  ).catch(() => {});
                }}
                variant="primary"
              />
              <ActionButton
                icon={<Feather name="phone" size={12} color="#FFF" />}
                label={t("propertyCard.phoneCall", "Call")}
                onPress={() => {
                  if (!hostPhone) return;
                  Linking.openURL(`tel:${hostPhone}`).catch(() => {});
                }}
                variant="secondary"
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="whatsapp"
                    size={14}
                    color="#FFF"
                  />
                }
                label={t("propertyCard.whatsApp", "WhatsApp")}
                onPress={handleWhatsApp}
                variant="whatsapp"
              />
            </ButtonGroup>
            <View style={styles.cardDivider} />
          </View>
        </TouchableOpacity>

        <Modal
          visible={showVerificationModal}
          transparent
          animationType="none"
          onRequestClose={() => setShowVerificationModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowVerificationModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.largeVerifiedBadge}>
                  <MaterialIcons
                    name="check-circle"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.largeVerifiedText}>
                    {t(
                      "homeDiscovery.verification.verifiedHost",
                      "Verified host",
                    )}
                  </Text>
                </View>
                <Text style={styles.verificationTitle}>
                  {t("homeDiscovery.verification.title", "Identity verified")}
                </Text>
                <Text style={styles.verificationDescription}>
                  {t(
                    "homeDiscovery.verification.description",
                    "This host has completed our identity verification process.",
                  )}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowVerificationModal(false)}
                >
                  <Text style={styles.closeButtonText}>
                    {t("homeDiscovery.verification.cta", "Got it")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
        <ShareSheet
          visible={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          property={property}
        />
      </View>
    </Animated.View>
  );
};

// ============================================================
// Styles (Enhanced Chinese App Aesthetic)
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1 },
  verticalScrollContent: {
    paddingHorizontal: 5,
    paddingTop: 16,
    paddingBottom: 40,
  },
  twoColumnContainer: { flexDirection: "column", gap: 16 },
  fullWidthPromo: { width: "100%", marginTop: 8, marginBottom: 8 },
  section: { marginBottom: 32 },
  firstSection: { marginTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitleContainer: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 2,
  },
  propertyCountText: { fontSize: 12, color: "#717171" },
  viewAllButton: { flexDirection: "row", alignItems: "center" },
  viewAllText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500",
    marginRight: 4,
  },
  propertiesScroll: { paddingLeft: 16 },
  propertiesScrollContent: {},
  propertyCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    borderRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  propertyCardTouchable: { flex: 1 },
  /** Wraps hero + body so hero is not inside the “open details” touch target. */
  propertyCardInner: { flex: 1 },
  propertyCardBodyTouchable: { flex: 1 },
  firstCard: { marginTop: 0 },
  lastCard: { marginBottom: 0 },
  propertyImageContainer: {
    position: "relative",
    height: 200,
    borderRadius: 10,
    width: "100%",
    backgroundColor: "#EEF0F3",
    overflow: "hidden",
  },
  /** Full-bleed shell for this listing’s linked tour (not carousel-sized / not in photo slider). */
  propertyTourVideoShell: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 0,
  },
  propertyTourVideo: {
    width: "100%",
    height: "100%",
  },
  imageCarousel: { width: "100%", height: 250 },
  carouselImageFill: { width: "100%", height: "100%" },
  imageIndicators: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activeIndicatorDot: { backgroundColor: "#FFFFFF", width: 12 },
  mediaBadgesRow: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 2,
  },
  mediaBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mediaBadgeText: { fontSize: 10, color: "#FFF", fontWeight: "700" },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(20,20,20,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  shareButton: {
    position: "absolute",
    top: 8,
    right: 48,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(20,20,20,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  propertyContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    color: CHINESE_RED,
    letterSpacing: 0.4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: CHINESE_RED,
    letterSpacing: -0.2,
  },
  priceUnit: { fontSize: 11, fontWeight: "500", color: "#888" },
  unitPrice: {
    fontSize: 11,
    fontWeight: "500",
    color: "#888",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
    lineHeight: 20,
  },
  propertyCategoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  propertyDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 4,
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 12,
  },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specTxt: { fontSize: 12, color: "#717171" },
  specNum: { fontSize: 12, color: "#1A1A1A", fontWeight: "700" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: { fontSize: 11, color: "#4B5563", flex: 1 },
  validationBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  validationText: {
    flex: 1,
    fontSize: 11,
    color: "#4338CA",
    fontWeight: "500",
  },
  detailChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  detailChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailChipText: { fontSize: 10, color: "#374151", fontWeight: "500" },
  cardDivider: { height: 1, backgroundColor: "#EBEBEB", marginTop: 10 },
  loadingContainer: { paddingVertical: 20, alignItems: "center" },
  loadingText: { fontSize: 14, color: "#717171" },
  discoverySkeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 12,
  },
  discoverySkeletonCard: {
    width: "48%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#EEF0F3",
    marginBottom: 4,
  },
  errorContainer: { paddingVertical: 20, alignItems: "center" },
  errorText: { fontSize: 14, color: CHINESE_RED },
  skeletonImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
  },
  skeletonText1: {
    height: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    width: "85%",
    marginBottom: 8,
  },
  skeletonText2: {
    height: 14,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    width: "70%",
    marginBottom: 8,
  },
  skeletonText3: {
    height: 14,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    width: "50%",
  },
  scrollToTopContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  scrollToTopButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: 50,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: CHINESE_RED,
  },
  videoEmptyWrap: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  videoEmptyText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },
  videoAutoToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  videoAutoToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#444",
    maxWidth: 96,
  },
  videoOpenFeedBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  videoOpenFeedBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: CHINESE_RED,
  },
  mediaToggleWrap: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 6,
    alignItems: "center",
  },
  mediaToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  mediaToggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  mediaToggleChipOn: {
    backgroundColor: "#FFFFFF",
  },
  mediaToggleChipTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mediaToggleChipTxtOn: {
    color: "#222222",
  },
  mediaToggleChipUnavailable: {
    opacity: 0.55,
  },
  mediaToggleChipTxtUnavailable: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  mediaToggleChipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: CARD_IMAGE_WIDTH - 24,
  },
  pendingTourPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(251,191,36,0.95)",
  },
  pendingTourPillTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: "#78350F",
  },
  videoSection: { marginTop: 0, marginBottom: 24 },
  videoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  videoSectionTitle: { fontSize: 18, fontWeight: "700", color: "#222222" },
  viewMoreButton: { flexDirection: "row", alignItems: "center" },
  viewMoreText: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "500",
    marginRight: 4,
  },
  videoCard: { width: width * 0.5, marginRight: 0 },
  videoContainer: {
    position: "relative",
    height: 280,
    width: width * 0.5,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoPlayer: { width: "100%", height: "100%" },
  videoThumbnail: { width: "100%", height: "100%", resizeMode: "cover" },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  videoInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  durationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  durationText: { fontSize: 12, color: "#FFFFFF", fontWeight: "600" },
  videoCardSkeleton: { width: width * 0.5 },
  videoSkeleton: {
    height: 280,
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    marginBottom: 12,
  },
  videoInfoSkeleton: { paddingHorizontal: 4 },
  videoTitleSkeleton: {
    height: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    width: "80%",
    marginBottom: 8,
  },
  videoSubtitleSkeleton: {
    height: 14,
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    width: "60%",
  },
  pipContainer: {
    position: "absolute",
    bottom: 80,
    right: 12,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  pipCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    width: 230,
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    alignItems: "center",
  },
  pipThumb: {
    width: 72,
    height: 72,
    position: "relative",
    backgroundColor: "#EEF0F3",
  },
  pipImage: { width: 72, height: 72 },
  pipPlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  pipPlayOverlay: {
    position: "absolute",
    bottom: 5,
    left: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  pipInfo: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  pipLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: CHINESE_RED,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  pipTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
    lineHeight: 16,
    marginBottom: 4,
  },
  pipCta: { fontSize: 11, color: CHINESE_RED, fontWeight: "700" },
  pipClose: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  promoCard: {
    marginTop: 16,
    marginBottom: 20,
    marginHorizontal: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    overflow: "hidden",
  },
  promoContent: { padding: 14 },
  promoTitle: { fontSize: 14, fontWeight: "800", color: CHINESE_RED },
  promoSubtitle: {
    marginTop: 4,
    color: "#6B7280",
    lineHeight: 18,
    fontSize: 11,
    width: 240,
  },
  promoCta: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: CHINESE_RED,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoCtaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "50%",
  },
  modalContent: { alignItems: "center" },
  largeVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CHINESE_RED,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    marginBottom: 20,
  },
  largeVerifiedText: { fontSize: 14, color: "#FFFFFF", fontWeight: "700" },
  verificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 10,
    textAlign: "center",
  },
  verificationDescription: {
    fontSize: 14,
    color: "#717171",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  closeButton: {
    backgroundColor: CHINESE_RED,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  closeButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CHINESE_RED,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  verifiedText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },
  ratingText: { fontSize: 11, color: "#1E293B", fontWeight: "600" },
});

export { PropertyCard as HomeDiscoveryPropertyCard };
