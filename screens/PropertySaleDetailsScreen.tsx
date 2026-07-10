import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Linking,
  Animated,
  SafeAreaView,
  Modal,
  Alert,
  StatusBar,
} from "react-native";
import { Avatar, Text } from "@ui-kitten/components";
import axios from "axios";
import { BoldMarkdownText } from "../utils/markdownBoldText";
import { useQuery } from "@tanstack/react-query";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { directMessageEndpoints, endpoints } from "../constants";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useUser } from "../hooks/useUser";
import { api } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import { usePropertyBehaviorTracking } from "../hooks/usePropertyBehaviorTracking";
import { useEnsurePushDeviceRegistration } from "../hooks/useEnsurePushDeviceRegistration";
import { setFavoriteCity, getFavoriteCity } from "../services/favoriteCity";
import {
  Bed,
  Bathtub,
  Ruler,
  Phone,
  Envelope,
  ChatCircle,
  X,
  CaretRight,
  CaretDown,
  CaretUp,
  Heart,
  DotsThreeVertical,
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle,
  Buildings,
  House,
  Flag,
  ProhibitInset,
  Eye,
  EyeSlash,
  Warning,
  Trash,
  Question,
  PencilSimple,
  Play,
  Pause,
  SpeakerHigh,
  SpeakerSlash,
  CornersOut,
  GraduationCap,
  FirstAid,
  ForkKnife,
  Car,
  Camera,
  BookOpen,
  CookingPot,
  Couch,
  Door,
  Toilet,
  Tree,
  Rectangle,
  Seal,
  SealCheck,
  Star,
  Globe,
  ShareNetwork,
  WhatsappLogo,
  VideoCamera,
  Images,
  Check,
  ArrowSquareOut,
  User,
  UserIcon,
  Clock,
  ShieldWarning,
  WhatsappLogoIcon,
} from "phosphor-react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Toast from "../components/CustomToast";
import { ListingPapersCard } from "../components/ListingPapersCard";
import { buildPaperDisplayItems } from "../utils/paperDisplay";
import {
  localizeOrientation,
  localizePropertySaleType,
} from "../utils/listingLabels";
import { useLanguage } from "../contexts/LanguageContext";
import { useListingWishlist } from "../hooks/useListingWishlist";
import { getAppLanguage } from "../utils/translation";
import { RootStackParamList } from "../types";
import * as Haptics from "expo-haptics";
import { OfferPriceChart } from "../components/OfferPriceChart";
import { DraggableBottomSheet } from "../components/DraggableBottomSheet";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import {
  NearbyPlaceCard,
  NearbyPlaceDetailContent,
  type NearbyPlaceWithType,
} from "../components/NearbyPlaceCard";
import { theme } from "../theme";
import ExactLocationMapSection from "../components/ExactLocationMapSection";
import ListedByHostSection from "../components/ListedByHostSection";
import {
  brokerIdFromHost,
  hostIsVerifiedBroker,
} from "../components/broker/BrokerVerifiedBadge";
import { HostIdentityBadge } from "../components/host/HostIdentityBadge";
import {
  hostIdentityStatus,
  hostIdentityDataReady,
  hostIsIdentityVerified,
} from "../components/host/hostIdentity";
import {
  ListingTrustBlock,
  ListingTrustSignal,
} from "../components/trust/ListingTrustSignal";
import ShareWithAiAdvisorCard from "../components/ShareWithAiAdvisorCard";
import { PropertySaleWhatsAppShareSheet } from "../components/share/PropertySaleWhatsAppShareSheet";
import type { PropertySaleSharePayload } from "../utils/propertySaleShare";
import {
  SoldPropertyImageVeil,
  SoldPropertyTractionPoster,
} from "../components/SoldPropertyTractionPoster";
import { FastListingImage } from "../components/FastListingImage";
import {
  collectPropertySaleImageUrls,
  fetchPropertySalePublic,
  findPropertySaleInFeedCache,
  propertySaleDetailQueryKey,
} from "../services/propertySaleFetch";
import {
  resolvePropertySaleVideoPlayback,
  resolvePropertySaleVideoUrl,
  resolveUploadedMediaUrl,
  isHttpMediaUrl,
} from "../utils/mediaUri";
import {
  prefetchImages,
  LISTING_IMAGE_PREFETCH,
} from "../services/imagePrefetch";

// ============================================================
// CONSTANTS
// ============================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const HERO_H = 340;
const ROOM_CARD_IMG_W = 120;
const ROOM_CARD_IMG_H = 72;
const ACCENT = theme;
const BLACK = "#1A1A1A";
const SURFACE = "#FFFFFF";
const BORDER = "#F0F0F0";
const MUTED = "#666666";
const DARK_MUTED = "#666666";
const RED = theme["color-temporary-primary"];
const GOLD = "#D4AF37";
const CHINESE_RED = theme["color-temporary-primary"];

// ============================================================
// SKELETON LOADER
// ============================================================
const Skeleton = ({
  width = "100%" as number | string,
  height = 20,
  style = {} as any,
  radius = 6,
}) => (
  <View
    style={[
      {
        width,
        height,
        backgroundColor: "#F5F5F5",
        borderRadius: radius,
      } as any,
      style,
    ]}
  />
);

// ============================================================
// DIVIDER
// ============================================================
const Divider = ({ margin = 0 }: { margin?: number }) => (
  <View
    style={{ height: 1, backgroundColor: BORDER, marginVertical: margin }}
  />
);

// ============================================================
// BADGE COMPONENT
// ============================================================
type BadgeVariant =
  | "outline"
  | "fill"
  | "gold"
  | "success"
  | "error"
  | "premium";
const Badge = ({
  label,
  variant = "outline",
  icon,
}: {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}) => {
  const styles: Record<BadgeVariant, any> = {
    outline: { bg: "transparent", borderColor: BLACK, textColor: BLACK },
    fill: { bg: BLACK, borderColor: BLACK, textColor: "#FFF" },
    gold: { bg: "#FFF8E7", borderColor: GOLD, textColor: "#B8860B" },
    success: { bg: "#E8F5E9", borderColor: "#4CAF50", textColor: "#2E7D32" },
    error: { bg: "#FEF2F2", borderColor: RED, textColor: "#B91C1C" },
    premium: {
      bg: "linear-gradient(135deg, #C41E3A 0%, #8B0000 100%)",
      borderColor: "#C41E3A",
      textColor: "#FFF",
    },
  };
  const s = styles[variant];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: s.bg,
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: s.borderColor,
        borderRadius: 4,
      }}
    >
      {icon}
      <Text
        style={{
          fontSize: 11,
          fontWeight: variant === "premium" ? "800" : "700",
          color: s.textColor,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ============================================================
// SECTION TITLE (Chinese App Style)
// ============================================================
const SectionTitle = ({
  title,
  children,
  subtitle,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
  subtitle?: string;
}) => {
  const heading = title ?? children ?? "";
  return (
    <View style={{ marginBottom: 16, marginTop: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: BLACK,
            letterSpacing: -0.3,
            fontFamily: "System",
          }}
        >
          {heading}
        </Text>
        <View
          style={{
            width: 40,
            height: 3,
            backgroundColor: ACCENT,
            borderRadius: 2,
          }}
        />
      </View>
      {subtitle && (
        <Text style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 6,
      gap: 8,
      backgroundColor: "#F8F9FA",
      borderRadius: 12,
      marginHorizontal: 4,
    }}
  >
    {icon}
    <Text
      style={{
        fontSize: 16,
        fontWeight: "800",
        color: BLACK,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: 11,
        fontWeight: "500",
        color: MUTED,
      }}
    >
      {label}
    </Text>
  </View>
);

// ============================================================
// FEATURE TAG
// ============================================================
const FeatureTag = ({ label }: { label: string }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: "#F8F9FA",
      borderRadius: 6,
      borderWidth: 0.5,
      borderColor: "#E8E8E8",
    }}
  >
    <Check size={12} color={ACCENT} weight="bold" />
    <Text style={{ fontSize: 12, color: BLACK, fontWeight: "500" }}>
      {label}
    </Text>
  </View>
);

// ============================================================
// ACTION BUTTON (Parent Background Style)
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
  variant?: "primary" | "secondary" | "outline";
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: CHINESE_RED,
          borderWidth: 0,
          borderColor: "transparent",
        };
      case "secondary":
        return {
          backgroundColor: "#2C3E50",
          borderWidth: 0,
          borderColor: "transparent",
        };
      default:
        return {
          backgroundColor: SURFACE,
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
      default:
        return { color: BLACK };
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
          gap: 12,
          borderRadius: 5,
          paddingVertical: 12,
          paddingHorizontal: 16,
          width: "auto",
        },
        getButtonStyle(),
      ]}
      activeOpacity={0.85}
    >
      {icon}
      <Text
        style={[
          {
            fontSize: 13,
            fontWeight: "500",
            letterSpacing: 0.3,
          },
          getTextStyle(),
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================
// EXPLANATORY TABLE COMPONENT
// ============================================================
const InfoTable = ({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: string; highlight?: boolean }[];
}) => (
  <View
    style={{
      marginVertical: 12,
      backgroundColor: "#F8F9FA",
      overflow: "hidden",
      borderWidth: 0.5,
      borderColor: "#EEE",
    }}
  >
    <View
      style={{
        backgroundColor: theme["color-temporary-primary2"],
        paddingVertical: 10,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          color: "#FFF",
          fontSize: 13,
          fontWeight: "700",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
    {data.map((item, idx) => (
      <View
        key={idx}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: idx === data.length - 1 ? 0 : 0.5,
          borderBottomColor: "#EEE",
          backgroundColor: item.highlight ? "#FFF8E7" : "transparent",
        }}
      >
        <Text style={{ fontSize: 13, color: MUTED, fontWeight: "500" }}>
          {item.label}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: BLACK,
            fontWeight: item.highlight ? "800" : "600",
          }}
        >
          {item.value}
        </Text>
      </View>
    ))}
  </View>
);

// ============================================================
// BUTTON GROUP WITH PARENT BACKGROUND
// ============================================================
const ButtonGroup = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      flexDirection: "row",
      gap: 12,
      backgroundColor: "#F8F9FA",
      padding: 12,
      borderRadius: 12,
      marginVertical: 8,
    }}
  >
    {children}
  </View>
);

// ============================================================
// MAIN SCREEN
// ============================================================
export const PropertySaleDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { run: ensurePushDeviceRegistration } =
    useEnsurePushDeviceRegistration();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const id = Number(route?.params?.propertyId);
  const lang = (currentLanguage || getAppLanguage()).toLowerCase();
  const routeImageIndex = Number(route?.params?.initialImageIndex ?? 0);

  // UI state
  const [showWhatsAppShareSheet, setShowWhatsAppShareSheet] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactModalData, setContactModalData] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(() =>
    Number.isFinite(routeImageIndex) && routeImageIndex >= 0
      ? Math.trunc(routeImageIndex)
      : 0,
  );
  const [heroTab, setHeroTab] = useState<"gallery" | "video">("gallery");
  const [activeNearbyTab, setActiveNearbyTab] = useState<
    "schools" | "hospitals" | "restaurants"
  >("schools");
  const [selectedNearbyPlace, setSelectedNearbyPlace] =
    useState<NearbyPlaceWithType | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullFeatures, setShowFullFeatures] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [heroVideoUserPaused, setHeroVideoUserPaused] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(() =>
    Number.isFinite(routeImageIndex) && routeImageIndex >= 0
      ? Math.trunc(routeImageIndex)
      : 0,
  );
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any>(null);
  const [isFavoriteCity, setIsFavoriteCity] = useState(false);
  const [isSettingFavoriteCity, setIsSettingFavoriteCity] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    duration?: number;
  } | null>(null);

  // Refs
  const heroVideoRef = useRef<Video>(null);
  const heroCarouselRef = useRef<ScrollView>(null);
  const galleryRef = useRef<ScrollView>(null);
  const nearbyPlaceSheetRef = useRef<BottomSheetModal>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animated values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.5, HERO_H * 0.75],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_H, 0],
    outputRange: [1.4, 1],
    extrapolateRight: "clamp",
  });

  // Favorite hook
  const {
    isSaved: isFavorite,
    toggle: toggleFavorite,
    isPending: isTogglingFavorite,
  } = useListingWishlist("sale", id, { showToast: true });

  // Data queries — single fetch (no duplicate prefetch); list cache seeds placeholder
  const { data, isLoading, isFetching, error } = useQuery<Record<string, any>>({
    queryKey: propertySaleDetailQueryKey(id, lang),
    queryFn: ({ signal }) => fetchPropertySalePublic(id, lang, signal),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    placeholderData: () =>
      queryClient.getQueryData<Record<string, unknown>>(
        propertySaleDetailQueryKey(id, lang),
      ) ?? findPropertySaleInFeedCache(queryClient, id),
  });

  const { data: nearby, isLoading: nearbyLoading } = useQuery({
    queryKey: ["property-nearby", id],
    queryFn: async ({ signal }) => {
      const res = await api.get(`/property-sales/${id}/nearby`, { signal });
      return res.data;
    },
    enabled: !!id && !!data,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const { data: offersData } = useQuery({
    queryKey: ["property-offers", id],
    queryFn: async () => {
      const res = await axios.get(`${endpoints.propertySales}/${id}/offers`);
      return res.data?.offers || [];
    },
    enabled: !!id && !!data,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Derived values
  const images = useMemo(
    () => (Array.isArray(data?.images) ? data!.images.filter(Boolean) : []),
    [data?.images],
  );
  const displayImages = useMemo(() => {
    const raw =
      images.length > 0 ? images : ([data?.image].filter(Boolean) as string[]);
    return raw
      .map((u) => resolveUploadedMediaUrl(String(u)))
      .filter(isHttpMediaUrl);
  }, [images, data?.image]);
  const primaryVideoPlayback = useMemo(
    () => resolvePropertySaleVideoPlayback(data as Record<string, unknown>),
    [data],
  );
  const primaryVideoUrl = primaryVideoPlayback?.streamUrl ?? null;
  const primaryVideoPoster = primaryVideoPlayback?.posterUrl;
  const allGalleryImages = useMemo(() => {
    const combined = [...displayImages];
    if (Array.isArray(data?.classified_photos)) {
      data?.classified_photos.forEach((cp: any) => {
        if (Array.isArray(cp?.photos)) combined.push(...cp.photos);
      });
    }
    return combined;
  }, [displayImages, data?.classified_photos]);

  useEffect(() => {
    if (allGalleryImages.length > 0) {
      prefetchImages(allGalleryImages, {
        max: LISTING_IMAGE_PREFETCH.detailMax,
        leadingHighPriority: LISTING_IMAGE_PREFETCH.detailLeading,
      });
      return;
    }
    if (id) {
      prefetchImages(collectPropertySaleImageUrls(data), {
        max: LISTING_IMAGE_PREFETCH.detailMax,
        leadingHighPriority: LISTING_IMAGE_PREFETCH.detailLeading,
      });
    }
  }, [allGalleryImages, data, id]);

  useEffect(() => {
    if (!displayImages.length) return;
    const neighbors = [
      displayImages[imgIndex - 1],
      displayImages[imgIndex],
      displayImages[imgIndex + 1],
    ].filter((u): u is string => typeof u === "string" && u.length > 0);
    prefetchImages(neighbors, { max: 3, leadingHighPriority: 3 });
  }, [imgIndex, displayImages]);

  useEffect(() => {
    if (!displayImages.length) return;
    const idx = Math.min(imgIndex, displayImages.length - 1);
    if (idx !== imgIndex) setImgIndex(idx);
    requestAnimationFrame(() => {
      heroCarouselRef.current?.scrollTo({
        x: idx * SCREEN_W,
        animated: false,
      });
    });
  }, [displayImages.length]);

  const hasVideos = !!primaryVideoUrl;
  const hasCoordinates =
    typeof data?.latitude === "number" && typeof data?.longitude === "number";
  const ownerID = useMemo(
    () => data?.owner_id || data?.organization?.owner_id || null,
    [data?.owner_id, data?.organization?.owner_id],
  );
  const canEdit = useMemo(() => {
    if (!user || !data) return false;
    if (data.owner_id === user.ID) return true;
    if (data.organization?.owner_id === user.ID) return true;
    if (data.agent?.user_id === user.ID) return true;
    return false;
  }, [
    user?.ID,
    data?.owner_id,
    data?.organization?.owner_id,
    data?.agent?.user_id,
  ]);

  const hostIdentity = hostIdentityStatus(data as any);
  const hostIdentityVerified = hostIsIdentityVerified(data as any);
  const hostIdentityReady = hostIdentityDataReady(data as any, isFetching);

  const whatsappNumber = useMemo(() => {
    const raw =
      data?.organization?.whatsapp ||
      data?.owner?.whatsapp ||
      data?.owner?.phoneNumber;
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    return digits.length >= 8 ? digits : null;
  }, [
    data?.organization?.whatsapp,
    data?.owner?.whatsapp,
    data?.owner?.phoneNumber,
  ]);

  const allFeatures = [...(data?.features || []), ...(data?.amenities || [])];
  const paperDisplayItems = useMemo(
    () => buildPaperDisplayItems((data as any)?.paper_types, t),
    [data, t],
  );

  // Behavior tracking
  const { trackFavorite, trackContact } = usePropertyBehaviorTracking(
    data?.id,
    "sale",
    data?.city_id,
    data?.city,
    data?.zone_id,
    data?.zone_name,
  );

  // Effects
  useEffect(() => {
    if (selectedNearbyPlace) nearbyPlaceSheetRef.current?.present();
  }, [selectedNearbyPlace]);

  useEffect(() => {
    if (heroTab !== "video" || !primaryVideoUrl) {
      heroVideoRef.current?.pauseAsync().catch(() => {});
      return;
    }
    if (!heroVideoUserPaused) {
      heroVideoRef.current?.playAsync().catch(() => {});
    }
  }, [heroTab, primaryVideoUrl, heroVideoUserPaused]);

  useEffect(() => {
    if (heroTab === "gallery") {
      heroVideoRef.current?.pauseAsync().catch(() => {});
    }
  }, [heroTab]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.ID || !id) return;
      const hasCoords =
        typeof data?.latitude === "number" &&
        typeof data?.longitude === "number";
      const ctx =
        data && (String(data.city ?? "").trim().length > 0 || hasCoords)
          ? {
              city: data.city ? String(data.city) : undefined,
              latitude: hasCoords ? data.latitude : undefined,
              longitude: hasCoords ? data.longitude : undefined,
            }
          : undefined;
      void ensurePushDeviceRegistration(ctx);
    }, [
      user?.ID,
      user?.allowsNotifications,
      user?.pushToken,
      id,
      data?.city,
      data?.latitude,
      data?.longitude,
      ensurePushDeviceRegistration,
    ]),
  );

  useEffect(() => {
    if (showGalleryModal && galleryRef.current) {
      galleryRef.current.scrollTo({
        x: selectedImageIndex * SCREEN_W,
        animated: false,
      });
    }
  }, [showGalleryModal, selectedImageIndex]);

  useEffect(() => {
    if (!showGalleryModal || !allGalleryImages.length) return;
    const neighbors = [
      allGalleryImages[selectedImageIndex - 1],
      allGalleryImages[selectedImageIndex],
      allGalleryImages[selectedImageIndex + 1],
    ].filter((u): u is string => typeof u === "string" && u.length > 0);
    prefetchImages(neighbors, { max: 3, leadingHighPriority: 3 });
  }, [showGalleryModal, selectedImageIndex, allGalleryImages]);

  useEffect(() => {
    const checkFavoriteCity = async () => {
      if (!user || !data?.city) return;
      const favoriteCity = await getFavoriteCity().catch(() => null);
      setIsFavoriteCity(
        favoriteCity?.cityName === data.city ||
          favoriteCity?.cityId === data.city_id,
      );
    };
    checkFavoriteCity();
  }, [user, data?.city, data?.city_id]);

  // Handlers
  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      setToast({
        message: t("listingWishlist.loginRequired"),
        type: "info",
      });
      return;
    }
    trackFavorite();
    await toggleFavorite();
  }, [user, toggleFavorite, trackFavorite, t]);

  const handleHeroVideoPress = useCallback(async () => {
    if (!heroVideoRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isVideoPlaying) {
      await heroVideoRef.current.pauseAsync();
      setHeroVideoUserPaused(true);
    } else {
      await heroVideoRef.current.playAsync();
      setHeroVideoUserPaused(false);
    }
  }, [isVideoPlaying]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoPlaying(status.isPlaying);
      setVideoPosition(status.positionMillis || 0);
      setVideoDuration(status.durationMillis || 0);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !isVideoMuted;
    setIsVideoMuted(next);
    heroVideoRef.current?.setIsMutedAsync(next);
  }, [isVideoMuted]);

  const handleToggleFavoriteCity = async () => {
    if (!user || !data) return;
    setIsSettingFavoriteCity(true);
    try {
      if (isFavoriteCity) {
        await setFavoriteCity(undefined, undefined, undefined, undefined);
        setIsFavoriteCity(false);
        setToast({
          message: t("sale.favoriteCityRemoved", "Favorite city removed"),
          type: "success",
        });
      } else {
        await setFavoriteCity(
          data.city_id,
          data.city,
          data.zone_id,
          data.zone_name,
        );
        setIsFavoriteCity(true);
        setToast({
          message: t("sale.favoriteCitySet", "Favorite city saved"),
          type: "success",
        });
      }
    } catch {
      setToast({
        message: t(
          "sale.favoriteCityError",
          "Could not update favorite city. Try again.",
        ),
        type: "error",
      });
    } finally {
      setIsSettingFavoriteCity(false);
    }
  };

  const navigateWithPayload = useCallback(
    (routeName: string, extra?: any) => {
      navigation.navigate(routeName, {
        propertyID: id,
        propertyTitle: data?.title,
        listingPrice: data?.listing_price,
        coverImage: displayImages?.[0],
        address: data?.address,
        city: data?.city,
        ownerID,
        ...extra,
      });
    },
    [id, navigation, data, displayImages, ownerID],
  );

  const contactHost = async () => {
    try {
      if (!user?.ID) {
        setToast({
          message: t("sale.loginRequired", "Please sign in to continue"),
          type: "error",
        });
        (navigation as any).navigate("UnifiedAuth");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const recipientName =
        data?.organization?.name ||
        `${data?.owner?.firstName || ""} ${data?.owner?.lastName || ""}`.trim() ||
        "Host";
      const initialMessage = t(
        "contactHost.defaultMessage",
        "Hello, I'm interested in this listing. Could you share more details?",
      );
      if (ownerID) {
        await api.post(directMessageEndpoints.sendMessage(), {
          receiver_id: ownerID,
          content: initialMessage,
          type: "text",
          ref_type: "property_sale",
          ref_id: id,
        });
        (navigation as any).navigate("DirectMessage", {
          conversationID: null,
          otherUserId: ownerID,
          recipientName,
        });
      } else {
        const {
          contactPropertySaleHost,
        } = require("../services/propertyContact");
        const result = await contactPropertySaleHost(id, initialMessage);
        (navigation as any).navigate("DirectMessage", {
          conversationID: 0,
          otherUserId: result.host_id,
          recipientName:
            result.organization_name || result.host_name || recipientName,
        });
      }
      setToast({
        message: t("sale.contactHostSuccess", "Conversation started"),
        type: "success",
      });
    } catch (e: any) {
      setToast({
        message:
          e?.message || t("sale.contactHostError", "Could not contact host"),
        type: "error",
      });
    }
  };

  const openContactOptions = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setContactModalData({
      phone: data?.organization?.phone || data?.owner?.phoneNumber,
      email: data?.organization?.email || data?.owner?.email,
      ownerID: ownerID || undefined,
      organizationName: data?.organization?.name,
      organizationImage: data?.organization?.banner_image,
      organizationWebsite: data?.organization?.website,
      recipientName:
        data?.organization?.name ||
        `${data?.owner?.firstName || ""} ${data?.owner?.lastName || ""}`.trim() ||
        t("propertySaleDetails.contact.agentFallback", "Agent"),
    });
    setShowContactModal(true);
  }, [data, ownerID, t]);

  const openWhatsApp = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (!whatsappNumber) {
      openContactOptions();
      return;
    }
    Linking.openURL(`https://wa.me/${whatsappNumber}`).catch(() => {
      setToast({
        message: t(
          "propertySaleDetails.contact.whatsappError",
          "Could not open WhatsApp",
        ),
        type: "error",
      });
    });
  }, [whatsappNumber, openContactOptions, t]);

  const whatsAppShareProperty = useMemo((): PropertySaleSharePayload | null => {
    if (!id || !data) return null;
    const imgs =
      allGalleryImages.length > 0 ? allGalleryImages : displayImages;
    return {
      id,
      title: data.title,
      listing_price: data.listing_price,
      address: data.address,
      city: data.city,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area: data.square_footage,
      property_type: data.property_type,
      images: imgs,
    };
  }, [id, data, allGalleryImages, displayImages]);

  const openWhatsAppShareCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowWhatsAppShareSheet(true);
  }, []);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (!data && (isLoading || isFetching)) {
    return (
      <View style={ss.flex}>
        <SafeAreaView style={{ backgroundColor: "#FFF" }}>
          <View style={ss.navRow}>
            <Skeleton width={38} height={38} radius={19} />
            <Skeleton width="50%" height={18} />
            <Skeleton width={38} height={38} radius={19} />
          </View>
        </SafeAreaView>
        <Skeleton height={HERO_H} radius={0} />
        <View style={ss.contentPad}>
          <Skeleton
            width="70%"
            height={34}
            style={{ marginTop: 18, marginBottom: 8 }}
          />
          <Skeleton width="90%" height={14} />
          <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
          <View style={ss.statsRow}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width={76} height={72} radius={12} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error || !data) {
    return (
      <View style={ss.flex}>
        <SafeAreaView style={{ backgroundColor: "#FFF" }}>
          <View style={ss.navRow}>
            <Pressable style={ss.navBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={22} color={BLACK} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View
          style={{
            alignItems: "center",
            paddingVertical: 32,
            paddingHorizontal: 16,
          }}
        >
          <House size={48} color={MUTED} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: BLACK,
              marginTop: 12,
            }}
          >
            {t("propertySaleDetails.error.notFoundTitle", "Listing not found")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: MUTED,
              textAlign: "center",
              marginTop: 6,
            }}
          >
            {error
              ? (error as any)?.message
              : t(
                  "propertySaleDetails.error.notFoundBody",
                  "Unable to load this listing right now.",
                )}
          </Text>
        </View>
      </View>
    );
  }

  const isSoldListing = Boolean((data as any)?.is_sold);

  // ============================================================
  // ROOM TYPE HELPERS
  // ============================================================
  const roomIcons: Record<string, any> = {
    kitchen: CookingPot,
    living_room: Couch,
    hall: Door,
    bedroom: Bed,
    bathroom: Toilet,
    dining_room: ForkKnife,
    balcony: Rectangle,
    study: BookOpen,
    garage: Car,
    garden: Tree,
    other: Camera,
  };
  const roomLabels: Record<string, string> = {
    kitchen: t("propertySaleDetails.rooms.kitchen", "Kitchen"),
    living_room: t("propertySaleDetails.rooms.living_room", "Living room"),
    hall: t("propertySaleDetails.rooms.hall", "Hall"),
    bedroom: t("propertySaleDetails.rooms.bedroom", "Bedroom"),
    bathroom: t("propertySaleDetails.rooms.bathroom", "Bathroom"),
    dining_room: t("propertySaleDetails.rooms.dining_room", "Dining room"),
    balcony: t("propertySaleDetails.rooms.balcony", "Balcony"),
    study: t("propertySaleDetails.rooms.study", "Study / office"),
    garage: t("propertySaleDetails.rooms.garage", "Garage"),
    garden: t("propertySaleDetails.rooms.garden", "Garden"),
    other: t("propertySaleDetails.rooms.other", "Other"),
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <View style={ss.flex}>
      <StatusBar barStyle="light-content" />

      {/* Floating Header */}
      <Animated.View style={[ss.floatingHeader, { opacity: headerOpacity }]}>
        <SafeAreaView>
          <View style={ss.navRow}>
            <Pressable style={ss.navBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color={BLACK} />
            </Pressable>
            <Text style={ss.navTitle} numberOfLines={1}>
              {data?.title || t("sale.detailsTitle")}
            </Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable
                style={ss.navBtn}
                onPress={openWhatsAppShareCard}
              >
                <ShareNetwork size={20} color={BLACK} weight="bold" />
              </Pressable>
              <Pressable
                style={ss.navBtn}
                onPress={handleToggleFavorite}
                disabled={isTogglingFavorite}
              >
                <Heart
                  size={20}
                  color={isFavorite ? RED : BLACK}
                  weight={isFavorite ? "fill" : "regular"}
                />
              </Pressable>
              <Pressable
                style={ss.navBtn}
                onPress={() => setShowOptionsModal(true)}
              >
                <DotsThreeVertical size={20} color={BLACK} weight="bold" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Transparent Header */}
      <View style={ss.transparentHeader}>
        <SafeAreaView>
          <View style={ss.navRow}>
            <Pressable
              style={ss.navBtnTransparent}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={20} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              style={ss.navBtnTransparent}
              onPress={openWhatsAppShareCard}
            >
              <ShareNetwork size={20} color="#FFF" weight="bold" />
            </Pressable>
            <Pressable
              style={ss.navBtnTransparent}
              onPress={handleToggleFavorite}
              disabled={isTogglingFavorite}
            >
              <Heart
                size={20}
                color={isFavorite ? RED : "#FFF"}
                weight={isFavorite ? "fill" : "regular"}
              />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Scroll Body */}
      <Animated.ScrollView
        style={ss.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* Hero Media */}
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <View
            style={{
              height: HERO_H,
              backgroundColor: "#000",
              position: "relative",
            }}
          >
            {heroTab === "gallery" && displayImages.length > 0 && (
              <ScrollView
                ref={heroCarouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{
                  x: Math.min(imgIndex, displayImages.length - 1) * SCREEN_W,
                  y: 0,
                }}
                onMomentumScrollEnd={(e) =>
                  setImgIndex(
                    Math.round(e.nativeEvent.contentOffset.x / SCREEN_W),
                  )
                }
              >
                {displayImages.map((uri: string, i: number) => {
                  const near = Math.abs(i - imgIndex) <= 1;
                  return (
                    <TouchableOpacity
                      key={`${uri}-${i}`}
                      onPress={() => {
                        setSelectedImageIndex(i);
                        setShowGalleryModal(true);
                      }}
                      activeOpacity={0.95}
                    >
                      {near ? (
                        <FastListingImage
                          uri={uri}
                          width={SCREEN_W}
                          height={HERO_H}
                          priority={i === imgIndex ? "high" : "normal"}
                        />
                      ) : (
                        <View
                          style={{
                            width: SCREEN_W,
                            height: HERO_H,
                            backgroundColor: "#111",
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {heroTab === "video" && hasVideos && primaryVideoUrl && (
              <View
                style={{
                  width: SCREEN_W,
                  height: HERO_H,
                  backgroundColor: "#000",
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleHeroVideoPress}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Video
                    ref={heroVideoRef}
                    style={{ width: "100%", height: "100%" }}
                    source={{ uri: primaryVideoUrl }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={heroTab === "video" && !heroVideoUserPaused}
                    isLooping
                    isMuted={isVideoMuted}
                    posterSource={
                      primaryVideoPoster
                        ? { uri: primaryVideoPoster }
                        : undefined
                    }
                    progressUpdateIntervalMillis={250}
                    onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                  />
                  {!isVideoPlaying && (
                    <View style={ss.heroPlayOverlay} pointerEvents="none">
                      <View style={ss.heroPlayCircle}>
                        <Play size={40} color="#111" weight="fill" />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={ss.heroVideoBottomBar} pointerEvents="box-none">
                  <TouchableOpacity
                    onPress={handleHeroVideoPress}
                    style={ss.heroVideoPlayBtn}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isVideoPlaying ? (
                      <Pause size={22} color="#FFF" weight="fill" />
                    ) : (
                      <Play size={22} color="#FFF" weight="fill" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleToggleMute}
                    style={ss.heroVideoSideBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isVideoMuted ? (
                      <SpeakerSlash size={18} color="#FFF" />
                    ) : (
                      <SpeakerHigh size={18} color="#FFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      heroVideoRef.current?.presentFullscreenPlayer()
                    }
                    style={ss.heroVideoSideBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CornersOut size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {heroTab === "gallery" &&
              displayImages.length === 0 &&
              !hasVideos && (
                <View
                  style={[
                    ss.centerContent,
                    {
                      width: SCREEN_W,
                      height: HERO_H,
                      backgroundColor: "#1A1A1A",
                    },
                  ]}
                >
                  <House size={64} color="rgba(255,255,255,0.3)" />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      marginTop: 12,
                      fontSize: 14,
                    }}
                  >
                    {t("propertySaleDetails.hero.noImagesYet", "No images yet")}
                  </Text>
                </View>
              )}
            {isSoldListing ? <SoldPropertyImageVeil /> : null}
            {(displayImages.length > 0 || hasVideos) &&
              displayImages.length > 0 &&
              hasVideos && (
                <View style={ss.mediaTabsOverlay}>
                  <View style={ss.mediaSegmentBar}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setHeroTab("gallery");
                      }}
                      style={[
                        ss.mediaSegment,
                        heroTab === "gallery" && ss.mediaSegmentActive,
                      ]}
                    >
                      <Images
                        size={14}
                        color={heroTab === "gallery" ? BLACK : "#FFF"}
                        weight="fill"
                      />
                      <Text
                        style={[
                          ss.mediaSegmentText,
                          heroTab === "gallery" && ss.mediaSegmentTextActive,
                        ]}
                      >
                        {t("propertySaleDetails.hero.tabPhotos", "Photos")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setHeroVideoUserPaused(false);
                        setHeroTab("video");
                      }}
                      style={[
                        ss.mediaSegment,
                        heroTab === "video" && ss.mediaSegmentActive,
                      ]}
                    >
                      <VideoCamera
                        size={14}
                        color={heroTab === "video" ? BLACK : "#FFF"}
                        weight="fill"
                      />
                      <Text
                        style={[
                          ss.mediaSegmentText,
                          heroTab === "video" && ss.mediaSegmentTextActive,
                        ]}
                      >
                        {t("propertySaleDetails.hero.tabVideo", "Video")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            {heroTab === "gallery" && displayImages.length > 1 && (
              <View
                style={[ss.imgCounter, hasVideos && ss.imgCounterWithMedia]}
              >
                <Text style={ss.imgCounterText}>
                  {imgIndex + 1} / {displayImages.length}
                </Text>
              </View>
            )}
            {heroTab === "gallery" && displayImages.length > 1 && (
              <View style={ss.dotRow}>
                {displayImages.slice(0, 7).map((_: string, i: number) => (
                  <View
                    key={i}
                    style={[
                      ss.dot,
                      i === imgIndex ? ss.dotActive : ss.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Content */}
        <View style={ss.contentPad}>
          {isSoldListing ? (
            <SoldPropertyTractionPoster
              variant="detail"
              soldAtIso={
                (data as any)?.updated_at ??
                (data as any)?.UpdatedAt ??
                undefined
              }
            />
          ) : null}

          {/* Title & Location */}
          <View style={ss.titleSection}>
            <Text style={ss.title}>
              {data?.title || t("sale.detailsTitle")}
            </Text>
            <View style={ss.locationRow}>
              <View style={ss.locationIconWrap}>
                <Image
                  source={require("../assets/location-criteria.png")}
                  style={ss.locationIconImg}
                  resizeMode="cover"
                />
              </View>
              <Text style={ss.locationText} numberOfLines={1}>
                {[data?.city, data?.state].filter(Boolean).join(", ") ||
                  data?.address ||
                  t(
                    "propertySaleDetails.location.addressPending",
                    "Address to be updated",
                  )}
              </Text>
            </View>
          </View>

          <Divider margin={8} />

          {/* Price & Badges */}
          <View style={ss.priceBlock}>
            <View style={ss.priceTopRow}>
              <Text style={ss.priceText}>
                {Number(data.listing_price).toLocaleString()}
                <Text style={ss.priceCurrency}>
                  {" "}
                  {t("common.currencySymbol", "MRU")}
                </Text>
              </Text>
              <View style={ss.titleBadgesRow}>
                {(data as any)?.truckeck && (
                  <Badge
                    label={t(
                      "propertySaleDetails.badges.truckeck",
                      "Truckeck verified",
                    )}
                    variant="gold"
                    icon={<Seal size={11} color="#B8860B" weight="fill" />}
                  />
                )}
                {isSoldListing ? (
                  <Badge
                    label={t("propertySaleDetails.badges.sold", "Sold")}
                    variant="success"
                    icon={<Seal size={11} color="#14532D" weight="fill" />}
                  />
                ) : null}
                <Badge
                  label={t(
                    "propertySaleDetails.badges.featured",
                    "Featured listing",
                  )}
                  variant="premium"
                  icon={<Star size={11} color="#FFF" weight="fill" />}
                />
              </View>
            </View>
          </View>

          {hostIdentityReady ? (
            <HostIdentityBadge data={data as any} variant="banner" />
          ) : null}

          <Divider margin={8} />

          {/* Key Stats */}
          <View style={ss.statsRow}>
            {typeof data?.bedrooms === "number" && data.bedrooms > 0 && (
              <StatCard
                icon={<Bed size={20} color={BLACK} />}
                value={data.bedrooms}
                label={t("propertySaleDetails.stats.bedrooms", "Bedrooms")}
              />
            )}
            {typeof data?.bathrooms === "number" && data.bathrooms > 0 && (
              <StatCard
                icon={<Bathtub size={20} color={BLACK} />}
                value={data.bathrooms}
                label={t("propertySaleDetails.stats.bathrooms", "Bathrooms")}
              />
            )}
            {typeof data?.square_footage === "number" && (
              <StatCard
                icon={<Ruler size={20} color={BLACK} />}
                value={data.square_footage}
                label={t("propertySaleDetails.stats.area", "Area (m²)")}
              />
            )}
            {data?.year_built && (
              <StatCard
                icon={<Calendar size={20} color={BLACK} />}
                value={data.year_built}
                label={t("propertySaleDetails.stats.yearBuilt", "Year built")}
              />
            )}
          </View>

          {/* Verification & credibility */}
          <ListingTrustBlock
            heading={t(
              "propertySaleDetails.trust.sectionTitle",
              "Verification",
            )}
          >
            {hostIdentityReady ? (
              <ListingTrustSignal
                icon={
                  hostIdentityVerified ? (
                    <SealCheck size={18} color="#059669" weight="fill" />
                  ) : hostIdentity === "pending" ? (
                    <Clock size={18} color="#D97706" weight="fill" />
                  ) : (
                    <ShieldWarning size={18} color="#64748B" weight="fill" />
                  )
                }
                title={
                  hostIdentityVerified
                    ? t(
                        "propertySaleDetails.trust.identityVerifiedTitle",
                        "Host identity verified",
                      )
                    : hostIdentity === "pending"
                      ? t(
                          "propertySaleDetails.trust.identityPendingTitle",
                          "Identity verification in progress",
                        )
                      : hostIdentity === "rejected"
                        ? t(
                            "propertySaleDetails.trust.identityRejectedTitle",
                            "Identity verification incomplete",
                          )
                        : t(
                            "propertySaleDetails.trust.identityNoneTitle",
                            "Host identity not verified",
                          )
                }
                subtitle={
                  hostIdentityVerified
                    ? t(
                        "propertySaleDetails.trust.identityVerifiedListing",
                        "This listing is connected to a host whose government ID was approved by Meskeny.",
                      )
                    : hostIdentity === "pending"
                      ? t(
                          "propertySaleDetails.trust.identityPendingDesc",
                          "The host submitted ID documents — review is still in progress.",
                        )
                      : hostIdentity === "rejected"
                        ? t(
                            "propertySaleDetails.trust.identityRejectedDesc",
                            "The host's ID check did not pass. Proceed with extra caution.",
                          )
                        : t(
                            "propertySaleDetails.trust.identityNoneDesc",
                            "This host has not completed Meskeny identity verification yet.",
                          )
                }
                isLast={
                  !(data as any)?.truckeck && !hostIsVerifiedBroker(data as any)
                }
              />
            ) : null}
            {(data as any)?.truckeck ? (
              <ListingTrustSignal
                icon={<Seal size={18} color="#B8860B" weight="fill" />}
                title={t(
                  "propertySaleDetails.trust.truckeckTitle",
                  "Documents reviewed",
                )}
                subtitle={t(
                  "propertySaleDetails.trust.truckeckDesc",
                  "Listing paperwork was checked by our review team.",
                )}
                isLast={!hostIsVerifiedBroker(data as any)}
              />
            ) : null}
            {hostIsVerifiedBroker(data as any) ? (
              <ListingTrustSignal
                icon={<SealCheck size={18} color="#008489" weight="fill" />}
                title={t(
                  "propertySaleDetails.trust.brokerTitle",
                  "Licensed broker",
                )}
                subtitle={t(
                  "propertySaleDetails.trust.brokerDesc",
                  "Professional broker license confirmed by Meskeny.",
                )}
                meta={
                  brokerIdFromHost(data as any)
                    ? t(
                        "propertySaleDetails.trust.brokerId",
                        "Broker ID · {{id}}",
                        { id: brokerIdFromHost(data as any) },
                      )
                    : undefined
                }
                isLast
              />
            ) : null}
          </ListingTrustBlock>

          {/* About This Place */}
          {data?.description && (
            <>
              <SectionTitle
                title={t(
                  "propertySaleDetails.sections.description",
                  "Description",
                )}
                subtitle={t(
                  "propertySaleDetails.sections.descriptionSub",
                  "Learn more about this listing",
                )}
              />
              <BoldMarkdownText
                style={ss.bodyText}
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {data.description}
              </BoldMarkdownText>
              {data.description.length > 150 && (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowFullDescription(!showFullDescription);
                  }}
                  style={ss.expandBtn}
                >
                  <Text style={ss.expandBtnText}>
                    {showFullDescription
                      ? t("propertySaleDetails.actions.collapse", "Collapse")
                      : t(
                          "propertySaleDetails.actions.readMore",
                          "Read full description",
                        )}
                  </Text>
                  {showFullDescription ? (
                    <CaretUp size={14} color={ACCENT} weight="bold" />
                  ) : (
                    <CaretDown size={14} color={ACCENT} weight="bold" />
                  )}
                </Pressable>
              )}
              <Divider margin={16} />
            </>
          )}

          {/* ============================================================
              EXPLANATORY TABLE: Property Details
          ============================================================ */}
          {/* INTENTIONNALY TEMPORARY COMMENTED */}
          {/* <InfoTable
            title={t(
              "propertySaleDetails.tables.detailsTitle",
              "Listing details"
            )}
            data={[
              {
                label: t(
                  "propertySaleDetails.tables.propertyType",
                  "Property type"
                ),
                value:
                  data?.property_type ||
                  t("propertySaleDetails.tables.residential", "Residential")
              },
              {
                label: t("propertySaleDetails.tables.tenure", "Tenure"),
                value: t(
                  "propertySaleDetails.tables.tenureValue",
                  "70-year lease"
                )
              },
              {
                label: t("propertySaleDetails.tables.finish", "Finish"),
                value: data?.furnished
                  ? t("propertySaleDetails.tables.finished", "Furnished")
                  : t("propertySaleDetails.tables.unfinished", "Unfurnished")
              },
              {
                label: t(
                  "propertySaleDetails.tables.orientation",
                  "Orientation"
                ),
                value:
                  data?.orientation ||
                  t(
                    "propertySaleDetails.tables.orientationDefault",
                    "North-South"
                  )
              },
              {
                label: t("propertySaleDetails.tables.floor", "Floor"),
                value: data?.floor
                  ? `${data.floor}/${data?.total_floors || t("propertySaleDetails.tables.tbd", "TBD")}`
                  : t("propertySaleDetails.tables.tbd", "TBD")
              }
            ].filter(
              (item) =>
                item.value !== "---" &&
                item.value !== t("propertySaleDetails.tables.tbd", "TBD")
            )}
          /> */}

          {/* Legal Documents Table */}
          {paperDisplayItems.length > 0 && (
            <InfoTable
              title={t(
                "propertySaleDetails.tables.documentsTitle",
                "Credential documents",
              )}
              data={paperDisplayItems.map((item) => ({
                label: item.label,
                value: t(
                  "propertySaleDetails.tables.documentProvided",
                  "Provided",
                ),
                highlight: true,
              }))}
            />
          )}

          {/* Features & Amenities */}
          {allFeatures.length > 0 && (
            <>
              <SectionTitle
                title={t("propertySaleDetails.sections.features", "Features")}
                subtitle={t(
                  "propertySaleDetails.sections.featuresSub",
                  "Building and in-listing amenities",
                )}
              />
              <View style={ss.featGrid}>
                {allFeatures
                  .slice(0, showFullFeatures ? undefined : 8)
                  .map((f, i) => (
                    <FeatureTag key={i} label={f} />
                  ))}
              </View>
              {allFeatures.length > 8 && (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowFullFeatures(!showFullFeatures);
                  }}
                  style={ss.viewAllBtn}
                >
                  <Text style={ss.viewAllBtnText}>
                    {showFullFeatures
                      ? t("propertySaleDetails.actions.collapse", "Collapse")
                      : t(
                          "propertySaleDetails.actions.viewAllFeatures",
                          "View all {{count}} features",
                          { count: allFeatures.length },
                        )}
                  </Text>
                  {showFullFeatures ? (
                    <CaretUp size={13} color={BLACK} weight="bold" />
                  ) : (
                    <CaretDown size={13} color={BLACK} weight="bold" />
                  )}
                </Pressable>
              )}
              <Divider margin={16} />
            </>
          )}

          {/* Room Photos */}
          {Array.isArray(data?.classified_photos) &&
            data.classified_photos.length > 0 && (
              <>
                <SectionTitle
                  title={t(
                    "propertySaleDetails.sections.roomPhotos",
                    "Room photos",
                  )}
                  subtitle={t(
                    "propertySaleDetails.sections.roomPhotosSub",
                    "Grouped by room type",
                  )}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                >
                  {data.classified_photos.map((cp: any, idx: number) => {
                    const photos = Array.isArray(cp?.photos)
                      ? cp.photos.filter(Boolean)
                      : [];
                    if (!photos.length) return null;
                    const IconComp = roomIcons[cp.room_type] || Camera;
                    const label = roomLabels[cp.room_type] || cp.room_type;
                    let startIdx = displayImages.length;
                    for (let i = 0; i < idx; i++) {
                      const prev = data.classified_photos[i];
                      startIdx += Array.isArray(prev?.photos)
                        ? prev.photos.filter(Boolean).length
                        : 0;
                    }
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedImageIndex(startIdx);
                          setShowGalleryModal(true);
                        }}
                        style={ss.roomCard}
                      >
                        <FastListingImage
                          uri={photos[0]}
                          width={ROOM_CARD_IMG_W}
                          height={ROOM_CARD_IMG_H}
                          priority="low"
                          style={ss.roomCardImg}
                        />
                        <View style={ss.roomCardOverlay}>
                          <View style={ss.roomCardIconBg}>
                            <IconComp size={14} color={BLACK} />
                          </View>
                          <View>
                            <Text style={ss.roomCardLabel}>{label}</Text>
                            <Text style={ss.roomCardCount}>
                              {t(
                                "propertySaleDetails.gallery.imageCount",
                                "{{count}} images",
                                { count: photos.length },
                              )}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Divider margin={16} />
              </>
            )}

          {/* Offer Insights */}
          <SectionTitle
            title={t(
              "propertySaleDetails.sections.priceAnalysis",
              "Price analysis",
            )}
            subtitle={t(
              "propertySaleDetails.sections.priceAnalysisSub",
              "Based on recent transaction data",
            )}
          />
          <View style={ss.offerDisplay}>
            <Text style={ss.offerDisplayLabel}>
              {t(
                "propertySaleDetails.price.marketReference",
                "Market reference price",
              )}
            </Text>
            <Text style={ss.offerDisplayPrice}>
              {Number(data.listing_price).toLocaleString()} MRU
            </Text>
            <Text style={ss.offerNote}>
              {t(
                "propertySaleDetails.price.disclaimer",
                "* This is the listing price; final sale price may vary.",
              )}
            </Text>
          </View>

          {/* Offer Chart */}
          {data?.id && Array.isArray(offersData) && offersData.length > 0 && (
            <OfferPriceChart
              propertyId={data.id}
              offers={offersData}
              listingPrice={data.listing_price}
              listedAt={
                (data as any)?.published_at ||
                (data as any)?.created_at ||
                (data as any)?.CreatedAt
              }
            />
          )}

          {/* Floor Plans */}
          {Array.isArray((data as any)?.floor_plans) &&
            (data as any).floor_plans.length > 0 && (
              <>
                <SectionTitle
                  title={t(
                    "propertySaleDetails.floorPlan.sectionTitle",
                    "Floor plans",
                  )}
                  subtitle={t(
                    "propertySaleDetails.floorPlan.sectionSubtitle",
                    "View layout details",
                  )}
                />
                {(data as any).floor_plans.map((f: any, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedFloorPlan(f);
                      setShowFloorPlanModal(true);
                    }}
                    style={ss.floorPlanRow}
                    activeOpacity={0.6}
                  >
                    {Array.isArray(f?.images) &&
                    f.images.filter(Boolean).length > 0 ? (
                      <FastListingImage
                        uri={f.images[0]}
                        width={50}
                        height={50}
                        priority="low"
                        style={ss.floorPlanThumb}
                      />
                    ) : (
                      <View style={[ss.floorPlanThumb, ss.centerContent]}>
                        <House size={22} color={MUTED} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={ss.floorPlanName}>
                        {f?.name ||
                          t(
                            "propertySaleDetails.floorPlan.defaultName",
                            "Floor plan {{n}}",
                            { n: idx + 1 },
                          )}
                      </Text>
                      <Text style={ss.floorPlanSpecs}>
                        {[
                          f?.bedrooms > 0 &&
                            t(
                              "propertySaleDetails.floorPlan.bedroomsShort",
                              "{{n}} bd",
                              { n: f.bedrooms },
                            ),
                          f?.bathrooms > 0 &&
                            t(
                              "propertySaleDetails.floorPlan.bathroomsShort",
                              "{{n}} ba",
                              { n: f.bathrooms },
                            ),
                          f?.area_sqm > 0 && `${f.area_sqm}m²`,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </Text>
                    </View>
                    <CaretRight size={20} color={MUTED} />
                  </TouchableOpacity>
                ))}
                <Divider margin={16} />
              </>
            )}

          {/* Map Location */}
          <ExactLocationMapSection
            sectionStyle={ss.section}
            hasCoordinates={hasCoordinates}
            data={data}
            nearby={nearby}
          />

          {/* Nearby Places */}
          {hasCoordinates && (
            <>
              <SectionTitle
                title={t(
                  "propertySaleDetails.sections.nearby",
                  "Nearby places",
                )}
                subtitle={t(
                  "propertySaleDetails.sections.nearbySub",
                  "3 km lifestyle zone",
                )}
              />
              <Text style={ss.nearbyCredit}>
                {t(
                  "propertySaleDetails.nearby.dataSource",
                  "Data source: MeskenyAI search",
                )}
              </Text>
              {nearbyLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton height={44} radius={10} />
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                      <Skeleton width={50} height={50} radius={10} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Skeleton width="70%" height={14} />
                        <Skeleton width="45%" height={12} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : nearby ? (
                <>
                  <View style={ss.nearbyTabBar}>
                    {[
                      {
                        key: "schools",
                        Icon: GraduationCap,
                        label: t(
                          "propertySaleDetails.nearby.tabs.schools",
                          "Schools",
                        ),
                      },
                      {
                        key: "hospitals",
                        Icon: FirstAid,
                        label: t(
                          "propertySaleDetails.nearby.tabs.hospitals",
                          "Healthcare",
                        ),
                      },
                      {
                        key: "restaurants",
                        Icon: ForkKnife,
                        label: t(
                          "propertySaleDetails.nearby.tabs.restaurants",
                          "Food",
                        ),
                      },
                    ].map(({ key, Icon, label }) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setActiveNearbyTab(key as any)}
                        style={[
                          ss.nearbyTab,
                          activeNearbyTab === key && ss.nearbyTabActive,
                        ]}
                      >
                        <Icon
                          size={14}
                          color={activeNearbyTab === key ? BLACK : "#666"}
                          weight={activeNearbyTab === key ? "fill" : "regular"}
                        />
                        <Text
                          style={[
                            ss.nearbyTabText,
                            activeNearbyTab === key && ss.nearbyTabTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View>
                    {(nearby[activeNearbyTab] || []).length === 0 ? (
                      <View
                        style={{ alignItems: "center", paddingVertical: 32 }}
                      >
                        <Star size={36} color={MUTED} />
                        <Text
                          style={{ fontSize: 14, color: BLACK, marginTop: 12 }}
                        >
                          {t(
                            "propertySaleDetails.nearby.emptyTab",
                            "No matching places found",
                          )}
                        </Text>
                      </View>
                    ) : (
                      (nearby[activeNearbyTab] || []).map(
                        (p: any, i: number) => (
                          <NearbyPlaceCard
                            key={i}
                            place={p}
                            placeType={activeNearbyTab}
                            onPress={() =>
                              setSelectedNearbyPlace({
                                ...p,
                                placeType: activeNearbyTab,
                              })
                            }
                          />
                        ),
                      )
                    )}
                  </View>
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <MapPin size={36} color={MUTED} />
                  <Text style={{ fontSize: 14, color: BLACK, marginTop: 12 }}>
                    {t("propertySaleDetails.nearby.emptyAll", "No nearby info")}
                  </Text>
                </View>
              )}
              <Divider margin={16} />
            </>
          )}

          {/* AI Advisor */}
          <ShareWithAiAdvisorCard
            sectionStyle={ss.section}
            sharedProperty={{
              id: data?.id ?? id,
              title: data?.title,
              listing_price: data?.listing_price,
              address: data?.address,
              city: data?.city,
              image: displayImages?.[0] ?? null,
              type: "sale",
            }}
            previewImageUri={displayImages?.[0] ?? null}
          />

          {/* Listed By */}
          <ListedByHostSection
            sectionStyle={ss.section}
            data={data}
            onContactHost={contactHost}
            onOpenContactOptions={openContactOptions}
          />
        </View>
      </Animated.ScrollView>

      {/* ============================================================
          STICKY BOTTOM BUTTON GROUP (Parent Background Style)
      ============================================================ */}
      <View style={ss.bottomBarCompact}>
        {/* AVATAR ICON */}
        {/* <View style={{ marginRight: 6 }}>
          {data?.host?.avatar ? (
            <Avatar size="medium" source={{ uri: data.host.avatar }} />
          ) : (
            <View
              style={{
                width: 35,
                height: 35,
                borderRadius: 20,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                marginLeft: 10,
                justifyContent: "center"
              }}
            >
              <UserIcon size={20} color="#9CA3AF" weight="regular" />
            </View>
          )}
        </View> */}

        {/* CHAT, CALL & WHATSAPP, COMMENTED FOR THE MOMETN */}
        {/* <View style={ss.bottomContactRow}>
          <TouchableOpacity
            style={ss.bottomContactBtn}
            onPress={contactHost}
          >
            <ChatCircle size={12} color="#000" weight="fill" />
            <Text style={ss.bottomContactText}>
              {t("propertySaleDetails.actions.chatNow", "Chat")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ss.bottomContactBtn}
            onPress={openContactOptions}
          >
            <Phone size={12} color="#000" weight="fill" />
            <Text style={ss.bottomContactText}>
              {t("propertySaleDetails.actions.call", "Call")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ss.bottomContactBtn}
            onPress={openWhatsApp}
          >
            <WhatsappLogo size={12} color="#000" weight="fill" />
            <Text style={ss.bottomContactText}>
              {t("propertySaleDetails.actions.whatsapp", "WhatsApp")}
            </Text>
          </TouchableOpacity>
          
        </View>  */}

        {/* PRIMARY ACTION BUTTONS */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flex: 1,
            // marginLeft: 6,
          }}
        >
          <ActionButton
            icon={<Calendar size={17} color="#FFF" weight="fill" />}
            label={t("propertySaleDetails.actions.bookTour", "Tour")}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateWithPayload("PropertySaleRequestTour");
            }}
            variant="secondary"
          />
          <ActionButton
            icon={<Envelope size={17} color="#FFF" weight="fill" />}
            label={t("propertySaleDetails.actions.makeOffer", "Offer")}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigateWithPayload("PropertySaleMakeOffer");
            }}
            variant="primary"
          />
          <ActionButton
            icon={<WhatsappLogoIcon size={17} color="#FFF" weight="fill" />}
            label={t(
              "propertySaleDetails.shareCard.shareShort",
              "Share card",
            )}
            onPress={openWhatsAppShareCard}
            variant="secondary"
          />
        </View>
      </View>

      <PropertySaleWhatsAppShareSheet
        visible={showWhatsAppShareSheet}
        onClose={() => setShowWhatsAppShareSheet(false)}
        property={whatsAppShareProperty}
      />

      {/* ============================================================
          MODALS (Options, Report, Block, Contact, Gallery, etc.)
      ============================================================ */}
      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable
          style={ss.modalBackdrop}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={ss.bottomSheet}>
            <View style={ss.sheetHandle} />
            <View style={ss.sheetHeader}>
              <Text style={ss.sheetTitle}>
                {t("propertySaleDetails.modals.options.title", "Options")}
              </Text>
              <Pressable
                onPress={() => setShowOptionsModal(false)}
                style={ss.sheetCloseBtn}
              >
                <X size={18} color={BLACK} />
              </Pressable>
            </View>
            {canEdit && (
              <Pressable
                style={ss.sheetOption}
                onPress={() => {
                  setShowOptionsModal(false);
                  navigation.navigate("EditPropertySale", { propertyId: id });
                }}
              >
                <PencilSimple size={20} color={BLACK} />
                <Text style={ss.sheetOptionText}>
                  {t("propertySaleDetails.modals.options.edit", "Edit listing")}
                </Text>
                <CaretRight
                  size={16}
                  color={MUTED}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            )}
            {user && data?.city && (
              <Pressable
                style={ss.sheetOption}
                onPress={() => {
                  setShowOptionsModal(false);
                  handleToggleFavoriteCity();
                }}
                disabled={isSettingFavoriteCity}
              >
                <MapPin
                  size={20}
                  color={BLACK}
                  weight={isFavoriteCity ? "fill" : "regular"}
                />
                <Text style={ss.sheetOptionText}>
                  {isFavoriteCity
                    ? t(
                        "propertySaleDetails.modals.options.removeFavoriteCity",
                        "Remove favorite city",
                      )
                    : t(
                        "propertySaleDetails.modals.options.addFavoriteCity",
                        "Add favorite city",
                      )}
                </Text>
                <CaretRight
                  size={16}
                  color={MUTED}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            )}
            <Pressable
              style={ss.sheetOption}
              onPress={() => {
                setShowOptionsModal(false);
                openWhatsAppShareCard();
              }}
            >
              <ShareNetwork size={20} color={BLACK} weight="bold" />
              <Text style={ss.sheetOptionText}>
                {t(
                  "propertySaleDetails.shareCard.shareWhatsApp",
                  "Share to WhatsApp",
                )}
              </Text>
              <CaretRight
                size={16}
                color={MUTED}
                style={{ marginLeft: "auto" }}
              />
            </Pressable>
            <Pressable
              style={ss.sheetOption}
              onPress={() => {
                setShowOptionsModal(false);
                setShowReportModal(true);
              }}
            >
              <Flag size={20} color={BLACK} />
              <Text style={ss.sheetOptionText}>
                {t("propertySaleDetails.modals.options.report", "Report")}
              </Text>
              <CaretRight
                size={16}
                color={MUTED}
                style={{ marginLeft: "auto" }}
              />
            </Pressable>
            <Pressable
              style={ss.sheetOption}
              onPress={() => {
                setShowOptionsModal(false);
                setShowBlockModal(true);
              }}
            >
              <ProhibitInset size={20} color={RED} />
              <Text style={[ss.sheetOptionText, { color: RED }]}>
                {t("propertySaleDetails.modals.options.block", "Block")}
              </Text>
              <CaretRight
                size={16}
                color={MUTED}
                style={{ marginLeft: "auto" }}
              />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowReportModal(false);
          setReportReason("");
        }}
      >
        <Pressable
          style={ss.modalBackdrop}
          onPress={() => {
            setShowReportModal(false);
            setReportReason("");
          }}
        >
          <View style={ss.bottomSheet}>
            <View style={ss.sheetHandle} />
            <View style={ss.sheetHeader}>
              <Text style={ss.sheetTitle}>
                {t("propertySaleDetails.modals.report.title", "Report")}
              </Text>
              <Pressable
                onPress={() => {
                  setShowReportModal(false);
                  setReportReason("");
                }}
                style={ss.sheetCloseBtn}
              >
                <X size={18} color={BLACK} />
              </Pressable>
            </View>
            <Text style={ss.sheetSubtitle}>
              {t(
                "propertySaleDetails.modals.report.subtitle",
                "Choose a reason",
              )}
            </Text>
            {[
              {
                key: "inappropriate",
                label: t(
                  "propertySaleDetails.modals.report.reasons.inappropriate",
                  "Inappropriate content",
                ),
                Icon: Warning,
              },
              {
                key: "spam",
                label: t(
                  "propertySaleDetails.modals.report.reasons.spam",
                  "Spam",
                ),
                Icon: Flag,
              },
              {
                key: "fake",
                label: t(
                  "propertySaleDetails.modals.report.reasons.fake",
                  "Fake listing",
                ),
                Icon: Trash,
              },
              {
                key: "other",
                label: t(
                  "propertySaleDetails.modals.report.reasons.other",
                  "Other",
                ),
                Icon: Question,
              },
            ].map(({ key, label, Icon }) => (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setReportReason(key);
                }}
                style={[
                  ss.reportOption,
                  reportReason === key && ss.reportOptionActive,
                ]}
              >
                <Icon size={18} color={reportReason === key ? "#FFF" : BLACK} />
                <Text
                  style={[
                    ss.reportOptionText,
                    reportReason === key && { color: "#FFF" },
                  ]}
                >
                  {label}
                </Text>
                {reportReason === key && (
                  <Check
                    size={16}
                    color="#FFF"
                    weight="bold"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </Pressable>
            ))}
            <Pressable
              style={[
                ss.reportSubmitBtn,
                !reportReason && ss.reportSubmitBtnDisabled,
              ]}
              disabled={!reportReason}
              onPress={async () => {
                if (!user?.accessToken) {
                  Alert.alert(
                    t("propertySaleDetails.common.error", "Error"),
                    t(
                      "propertySaleDetails.common.loginFirst",
                      "Please login first",
                    ),
                  );
                  return;
                }
                try {
                  await api.post(`/property-sales/${id}/report`, {
                    reason: reportReason,
                  });
                  setToast({
                    message: t(
                      "propertySaleDetails.modals.report.submitted",
                      "Report submitted. Thank you for your feedback.",
                    ),
                    type: "success",
                  });
                  setTimeout(() => navigation.goBack(), 350);
                } catch {
                  setToast({
                    message: t(
                      "propertySaleDetails.modals.report.submitFailed",
                      "Submit failed. Please try again.",
                    ),
                    type: "error",
                  });
                } finally {
                  setShowReportModal(false);
                  setReportReason("");
                }
              }}
            >
              <Text style={ss.reportSubmitBtnText}>
                {t("propertySaleDetails.modals.report.submit", "Submit report")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Block Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <Pressable
          style={ss.modalBackdrop}
          onPress={() => setShowBlockModal(false)}
        >
          <View style={ss.bottomSheet}>
            <View style={ss.sheetHandle} />
            <View style={ss.sheetHeader}>
              <Text style={ss.sheetTitle}>
                {t(
                  "propertySaleDetails.modals.block.title",
                  "Choose an action",
                )}
              </Text>
              <Pressable
                onPress={() => setShowBlockModal(false)}
                style={ss.sheetCloseBtn}
              >
                <X size={18} color={BLACK} />
              </Pressable>
            </View>
            <Text style={ss.sheetSubtitle}>
              {t(
                "propertySaleDetails.modals.block.subtitle",
                "What would you like to do with this listing?",
              )}
            </Text>
            <Pressable
              style={ss.sheetOption}
              onPress={async () => {
                try {
                  await api.post(`/property-sales/${id}/hide`, {
                    reason: "not_interested",
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["public-property-sales"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["publicPropertySales"],
                  });
                  setToast({
                    message: t(
                      "propertySaleDetails.modals.block.toastListingHidden",
                      "Listing hidden",
                    ),
                    type: "success",
                  });
                  setTimeout(() => navigation.goBack(), 350);
                } catch {
                  setToast({
                    message: t(
                      "propertySaleDetails.modals.block.toastFailed",
                      "Something went wrong",
                    ),
                    type: "error",
                  });
                } finally {
                  setShowBlockModal(false);
                }
              }}
            >
              <EyeSlash size={20} color={BLACK} />
              <Text style={ss.sheetOptionText}>
                {t(
                  "propertySaleDetails.modals.block.hideListingOnly",
                  "Hide only this listing",
                )}
              </Text>
            </Pressable>
            <Pressable
              style={ss.sheetOption}
              onPress={async () => {
                const d: any = data || {};
                const targetOrgId = d?.organization?.id || d?.organization_id;
                if (!targetOrgId) {
                  Alert.alert(
                    t("propertySaleDetails.common.error", "Error"),
                    t(
                      "propertySaleDetails.modals.block.alertOrgUnknown",
                      "Could not identify the organization.",
                    ),
                  );
                  return;
                }
                try {
                  await api.post(`/organization/${targetOrgId}/block`);
                  queryClient.invalidateQueries({
                    queryKey: ["public-property-sales"],
                  });
                  setToast({
                    message: t(
                      "propertySaleDetails.modals.block.toastOrgBlocked",
                      "Organization blocked",
                    ),
                    type: "success",
                  });
                  setTimeout(() => navigation.goBack(), 350);
                } catch {
                  setToast({
                    message: t(
                      "propertySaleDetails.modals.block.toastFailed",
                      "Something went wrong",
                    ),
                    type: "error",
                  });
                } finally {
                  setShowBlockModal(false);
                }
              }}
            >
              <ProhibitInset size={20} color={RED} />
              <Text style={[ss.sheetOptionText, { color: RED }]}>
                {t(
                  "propertySaleDetails.modals.block.blockOrganization",
                  "Block this organization",
                )}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Contact Modal */}
      <DraggableBottomSheet
        visible={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setContactModalData(null);
        }}
      >
        <View style={ss.contactSheet}>
          <Text style={ss.contactSheetTitle}>
            {t("propertySaleDetails.contact.sheetTitle", "Contact agent")}
          </Text>
          <Text style={ss.contactSheetSub}>
            {t(
              "propertySaleDetails.contact.sheetSubtitle",
              "Choose how you'd like to reach them",
            )}
          </Text>
          {contactModalData?.ownerID && (
            <Pressable
              style={ss.contactOptionHighlight}
              onPress={() => {
                const d = contactModalData;
                setShowContactModal(false);
                setContactModalData(null);
                navigation.navigate("DirectMessage", {
                  conversationID: 0,
                  otherUserId: d.ownerID,
                  recipientName:
                    d.recipientName ||
                    d.organizationName ||
                    t("propertySaleDetails.contact.agentFallback", "Agent"),
                });
              }}
            >
              <View
                style={[ss.contactOptionIcon, { backgroundColor: "#8B5CF6" }]}
              >
                <ChatCircle size={22} color="#FFF" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.contactOptionTitle}>
                  {t("propertySaleDetails.contact.chatTitle", "In-app chat")}
                </Text>
                <Text style={ss.contactOptionVal}>
                  {t(
                    "propertySaleDetails.contact.chatSubtitle",
                    "Usually the fastest reply",
                  )}
                </Text>
              </View>
              <CaretRight size={18} color={MUTED} />
            </Pressable>
          )}
          {contactModalData?.phone && (
            <Pressable
              style={ss.contactOption}
              onPress={() => {
                setShowContactModal(false);
                Linking.openURL(`tel:${contactModalData.phone}`);
              }}
            >
              <View
                style={[ss.contactOptionIcon, { backgroundColor: "#10B981" }]}
              >
                <Phone size={22} color="#FFF" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.contactOptionTitle}>
                  {t("propertySaleDetails.contact.callTitle", "Phone call")}
                </Text>
                <Text style={ss.contactOptionVal}>
                  {contactModalData.phone}
                </Text>
              </View>
              <CaretRight size={18} color={MUTED} />
            </Pressable>
          )}
          {contactModalData?.email && (
            <Pressable
              style={ss.contactOption}
              onPress={() => {
                setShowContactModal(false);
                Linking.openURL(`mailto:${contactModalData.email}`);
              }}
            >
              <View
                style={[ss.contactOptionIcon, { backgroundColor: "#3B82F6" }]}
              >
                <Envelope size={22} color="#FFF" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.contactOptionTitle}>
                  {t("propertySaleDetails.contact.emailTitle", "Email")}
                </Text>
                <Text style={ss.contactOptionVal} numberOfLines={1}>
                  {contactModalData.email}
                </Text>
              </View>
              <CaretRight size={18} color={MUTED} />
            </Pressable>
          )}
          <Pressable
            style={ss.contactCloseBtn}
            onPress={() => {
              setShowContactModal(false);
              setContactModalData(null);
            }}
          >
            <Text style={ss.contactCloseBtnText}>
              {t("propertySaleDetails.contact.close", "Close")}
            </Text>
          </Pressable>
        </View>
      </DraggableBottomSheet>

      {/* Gallery Modal */}
      <Modal
        visible={showGalleryModal}
        onRequestClose={() => setShowGalleryModal(false)}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <SafeAreaView
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.5)",
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{ color: "#FFF", fontSize: 14, fontWeight: "600" }}
                >
                  {selectedImageIndex + 1} / {allGalleryImages.length}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowGalleryModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setSelectedImageIndex(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_W),
              )
            }
          >
            {allGalleryImages.map((uri: string, i: number) => {
              const near = Math.abs(i - selectedImageIndex) <= 1;
              return (
                <ScrollView
                  key={`${uri}-${i}`}
                  style={{ width: SCREEN_W }}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                >
                  {near ? (
                    <FastListingImage
                      uri={uri}
                      width={SCREEN_W}
                      height={SCREEN_H}
                      contentFit="contain"
                      priority={i === selectedImageIndex ? "high" : "normal"}
                    />
                  ) : (
                    <View
                      style={{
                        width: SCREEN_W,
                        height: SCREEN_H,
                        backgroundColor: "#000",
                      }}
                    />
                  )}
                </ScrollView>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Floor Plan Modal */}
      <Modal
        visible={showFloorPlanModal}
        onRequestClose={() => setShowFloorPlanModal(false)}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <SafeAreaView
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowFloorPlanModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {selectedFloorPlan?.images?.[0] ? (
              <FastListingImage
                uri={selectedFloorPlan.images[0]}
                width={SCREEN_W}
                height={SCREEN_H}
                contentFit="contain"
                priority="high"
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={ss.toastWrap}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration || 2200}
            onHide={() => setToast(null)}
          />
        </View>
      )}
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================
const ss = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFF" },
  centerContent: { alignItems: "center", justifyContent: "center" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 56,
    justifyContent: "space-between",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  navBtnTransparent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: BLACK,
    textAlign: "center",
    marginHorizontal: 8,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  transparentHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  heroPlayOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  heroPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroVideoBottomBar: {
    position: "absolute",
    bottom: 14,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 12,
  },
  heroVideoPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroVideoSideBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaTabsOverlay: {
    position: "absolute",
    bottom: 14,
    left: 12,
    zIndex: 11,
  },
  mediaSegmentBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  mediaSegment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  mediaSegmentActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  mediaSegmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  mediaSegmentTextActive: { color: BLACK },
  imgCounter: {
    position: "absolute",
    bottom: 14,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  imgCounterText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  imgCounterWithMedia: {
    bottom: 14,
  },
  dotRow: {
    position: "absolute",
    bottom: 15,
    right: 12,
    flexDirection: "row",
    gap: 4,
  },
  dot: { height: 5, borderRadius: 3 },
  dotActive: { width: 16, backgroundColor: "#FFF" },
  dotInactive: { width: 5, backgroundColor: "rgba(255,255,255,0.45)" },
  contentPad: { paddingHorizontal: 18 },
  section: { marginVertical: 16 },
  titleSection: { marginTop: 6, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  locationIconImg: {
    width: 100,
    height: 100,
    position: "absolute",
    left: -20,
    top: -20,
  } as any,
  locationText: { fontSize: 14, color: "#484848", flex: 1 },
  priceBlock: { paddingVertical: 20 },
  priceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceText: {
    fontSize: 28,
    fontWeight: "800",
    color: CHINESE_RED,
    lineHeight: 34,
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: "500",
    color: MUTED,
    marginLeft: 4,
  },
  titleBadgesRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    maxWidth: "45%",
    marginTop: 4,
    justifyContent: "flex-end",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    gap: 8,
  },
  bodyText: { fontSize: 15, color: BLACK, lineHeight: 22 },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingBottom: 2,
    alignSelf: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
  },
  expandBtnText: { fontSize: 13, fontWeight: "700", color: BLACK },
  featGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignSelf: "flex-start",
  },
  viewAllBtnText: { fontSize: 13, fontWeight: "600", color: BLACK },
  roomCard: {
    width: 120,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E4DC",
  },
  roomCardImg: { width: "100%", height: 72 },
  roomCardOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 8,
    backgroundColor: "#FFF",
  },
  roomCardIconBg: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  roomCardLabel: { fontSize: 11, fontWeight: "700", color: BLACK },
  roomCardCount: { fontSize: 10, color: MUTED, marginTop: 1 },
  offerDisplay: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: BORDER,
    marginVertical: 12,
  },
  offerDisplayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  offerDisplayPrice: { fontSize: 24, fontWeight: "800", color: CHINESE_RED },
  offerNote: { fontSize: 11, color: MUTED, textAlign: "center", marginTop: 8 },
  videoWrap: {
    height: 210,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoTouch: { flex: 1 },
  video: { flex: 1 },
  videoOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
  },
  videoTopBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
  },
  videoCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -34 }, { translateY: -34 }],
  },
  videoPlayCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  videoTime: { color: "#FFF", fontSize: 11, fontWeight: "600", minWidth: 75 },
  videoProgTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  videoProgFill: {
    height: "100%",
    backgroundColor: CHINESE_RED,
    borderRadius: 2,
  },
  nearbyCredit: {
    fontSize: 11,
    color: "#AAA",
    fontWeight: "500",
    marginBottom: 12,
  },
  nearbyTabBar: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    gap: 2,
  },
  nearbyTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nearbyTabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  nearbyTabText: { fontSize: 12, fontWeight: "700", color: "#666" },
  nearbyTabTextActive: { color: BLACK },
  floorPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  floorPlanThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 10,
  },
  floorPlanName: { fontSize: 14, fontWeight: "600", color: BLACK },
  floorPlanSpecs: { fontSize: 12, color: MUTED, marginTop: 3 },
  bottomBarCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    zIndex: 100,
    gap: 3,
    // minHeight: 100
    paddingBottom: 40,
    paddingTop: 8,
  },
  bottomContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 6,
  },
  bottomContactBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: "#FDE68A",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  bottomContactText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#000",
  },
  // bottomBarBtn: removed, handled by container
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: BLACK },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: MUTED,
    paddingHorizontal: 16,
    paddingVertical: 10,
    lineHeight: 18,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  sheetOptionText: { fontSize: 14, color: BLACK, flex: 1 },
  reportOption: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    gap: 10,
  },
  reportOptionActive: { backgroundColor: BLACK },
  reportOptionText: { flex: 1, fontSize: 14, color: BLACK },
  reportSubmitBtn: {
    backgroundColor: BLACK,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  reportSubmitBtnDisabled: { backgroundColor: "#E5E7EB" },
  reportSubmitBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  contactSheet: { paddingHorizontal: 20, paddingBottom: 24 },
  contactSheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BLACK,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  contactSheetSub: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    marginBottom: 20,
  },
  contactOptionHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#10B981",
    marginBottom: 10,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
  },
  contactOptionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  contactOptionTitle: { fontSize: 15, fontWeight: "600", color: BLACK },
  contactOptionVal: { fontSize: 12, color: MUTED, marginTop: 2 },
  contactCloseBtn: {
    marginTop: 12,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  contactCloseBtnText: { fontSize: 15, fontWeight: "600", color: "#374151" },
  toastWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    pointerEvents: "none",
    paddingBottom: 20,
  },
});
