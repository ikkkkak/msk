import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Share,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import {
  ArrowLeft,
  CheckCircle,
  DotsThreeVertical,
  Images,
  MapPin,
  NavigationArrow,
  Phone,
  Ruler,
  Seal,
  ShareNetwork,
  Star,
  TrendUp,
  VideoCamera,
  CaretDown,
  CaretUp,
  Play,
  Heart,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { RootStackScreenProps } from "../types";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import { useUser } from "../hooks/useUser";
import { useListingWishlist } from "../hooks/useListingWishlist";
import { useQuery } from "@tanstack/react-query";
import Toast from "../components/CustomToast";
import { ListingPapersCard } from "../components/ListingPapersCard";
import { buildPaperDisplayItems } from "../utils/paperDisplay";
import { endpoints, OPENROUTESERVICE_API_KEY } from "../constants";
import {
  getLandmarkHostContact,
  hasLandmarkHostContact,
} from "../utils/landmarkHostContact";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { theme } from "../theme";
import ListedByHostSection from "../components/ListedByHostSection";
import LandmarkPlotMapSection from "../components/LandmarkPlotMapSection";
import { habitatApi } from "../services/habitatApi";
import { resolveLandmarkMapGeometry } from "../utils/landmarkMapGeometry";
import { displayPlotNumber } from "../components/habitat/cadastreFilterUtils";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = 340;
const BLACK = "#1A1A1A";
const BORDER = "#F0F0F0";
const MUTED = "#666666";
const ACCENT = theme["color-temporary-primary"];
const CHINESE_RED = theme["color-temporary-primary"];
const GOLD = "#B8860B";

const C = {
  white: "#FFFFFF",
  ink: BLACK,
  gray: MUTED,
  line: BORDER,
  teal: CHINESE_RED,
};

const LAND_TYPE_KEY_MAP: Record<string, string> = {
  residential: "residential",
  commercial: "commercial",
  agricultural: "agricultural",
  industrial: "industrial",
  mixed: "mixed",
  "mixed use": "mixed",
  "mixed-use": "mixed",
  mixed_use: "mixed",
};

function localizeLandType(
  value: string | null | undefined,
  t: (key: string, fallback?: string) => string,
): string {
  if (!value || typeof value !== "string") return "";
  const key = LAND_TYPE_KEY_MAP[value.trim().toLowerCase()];
  return key ? t(`landmark.landTypes.${key}`, value) : value;
}

const defined = (v: unknown) => v != null && v !== "" && v !== false;

const Divider = ({ margin = 0 }: { margin?: number }) => (
  <View
    style={{ height: 1, backgroundColor: BORDER, marginVertical: margin }}
  />
);

type BadgeVariant = "outline" | "gold" | "success";
const Badge = ({
  label,
  variant = "outline",
  icon,
}: {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}) => {
  const s: Record<BadgeVariant, { bg: string; border: string; text: string }> =
    {
      outline: { bg: "transparent", border: BLACK, text: BLACK },
      gold: { bg: "#FFF8E7", border: GOLD, text: "#B8860B" },
      success: { bg: "#E8F5E9", border: "#4CAF50", text: "#2E7D32" },
    };
  const st = s[variant];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: st.bg,
        borderWidth: 1,
        borderColor: st.border,
        borderRadius: 4,
      }}
    >
      {icon}
      <Text style={{ fontSize: 11, fontWeight: "700", color: st.text }}>
        {label}
      </Text>
    </View>
  );
};

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
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
        }}
      >
        {title}
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
    {subtitle ? (
      <Text style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

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
    <Text style={{ fontSize: 11, fontWeight: "800", color: BLACK }}>
      {value}
    </Text>
    <Text style={{ fontSize: 11, fontWeight: "500", color: MUTED }}>
      {label}
    </Text>
  </View>
);

const InfoTable = ({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: string }[];
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
        key={item.label}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: idx === data.length - 1 ? 0 : 0.5,
          borderBottomColor: "#EEE",
        }}
      >
        <Text style={{ fontSize: 13, color: MUTED, fontWeight: "500" }}>
          {item.label}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: BLACK,
            fontWeight: "600",
            maxWidth: "55%",
            textAlign: "right",
          }}
        >
          {item.value}
        </Text>
      </View>
    ))}
  </View>
);

const ActionButton = ({
  icon,
  label,
  onPress,
  variant = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
      },
      variant === "primary"
        ? { backgroundColor: CHINESE_RED }
        : { backgroundColor: "#2C3E50" },
    ]}
    activeOpacity={0.85}
  >
    {icon}
    <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFF" }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });
  return opacity;
};

const LandmarkSkeleton = () => {
  const opacity = useShimmer();
  return (
    <View style={ss.flex}>
      <Animated.View
        style={{ height: HERO_H, backgroundColor: "#E8E8E8", opacity }}
      />
      <View style={{ padding: 18, gap: 12 }}>
        <Animated.View
          style={{
            height: 28,
            width: "80%",
            backgroundColor: "#E8E8E8",
            borderRadius: 6,
            opacity,
          }}
        />
        <Animated.View
          style={{
            height: 20,
            width: "50%",
            backgroundColor: "#E8E8E8",
            borderRadius: 6,
            opacity,
          }}
        />
      </View>
    </View>
  );
};

const formatPrice = (price?: number, currency = "MRU") => {
  if (price == null || isNaN(Number(price))) return null;
  try {
    return `${Number(price).toLocaleString()} ${currency}`;
  } catch {
    return `${price} ${currency}`;
  }
};

const LandmarkDetailsContent = ({
  navigation,
  landmark,
}: RootStackScreenProps<"LandmarkDetails"> & {
  landmark: Record<string, any>;
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const landmarkId = Number(landmark.id ?? landmark.ID ?? 0) || undefined;
  const landmarkWishlist = useListingWishlist("landmark", landmarkId, {
    initialSaved: Boolean(landmark.saved),
    showToast: true,
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    duration?: number;
  } | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [heroTab, setHeroTab] = useState<"gallery" | "video">("gallery");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeDistanceM, setRouteDistanceM] = useState<number | undefined>();
  const [routeDurationS, setRouteDurationS] = useState<number | undefined>();
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const orgID = landmark?.organization?.id ?? landmark?.organization_id;
  const { data: orgProfile } = useQuery({
    queryKey: ["orgProfile", orgID],
    queryFn: async () => {
      if (!orgID) return null;
      const res = await fetch(
        `${endpoints.baseURL}/organizations/${orgID}/profile-sheet`,
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!orgID,
    staleTime: 5 * 60 * 1000,
  });

  const hostContact = useMemo(
    () => getLandmarkHostContact(landmark),
    [landmark],
  );
  const orgName =
    orgProfile?.name ??
    landmark?.organization?.name ??
    hostContact.displayName ??
    "";
  const orgPhone =
    hostContact.phone ?? orgProfile?.phone ?? landmark?.organization?.phone;
  const orgEmail =
    hostContact.email ?? orgProfile?.email ?? landmark?.organization?.email;
  const showPublisher = Boolean(orgName) || hasLandmarkHostContact(hostContact);

  const habitatPlotId =
    landmark.habitat_plot_id ?? landmark.habitatPlotId ?? null;
  const quartierId = landmark.quartier_id ?? landmark.quartierId ?? null;
  const plotNumber = String(landmark.plot_number ?? "").trim();

  const { data: habitatPlotById, isFetched: habitatPlotByIdFetched } = useQuery(
    {
      queryKey: ["habitatPlot", habitatPlotId],
      queryFn: () => habitatApi.getPlot(Number(habitatPlotId)),
      enabled: habitatPlotId != null && Number(habitatPlotId) > 0,
      staleTime: 5 * 60 * 1000,
    },
  );

  const { data: habitatPlotLookup } = useQuery({
    queryKey: ["habitatPlotLookup", quartierId, plotNumber],
    queryFn: () =>
      habitatApi.lookupPlotForLandListing(Number(quartierId), plotNumber),
    enabled:
      (!habitatPlotId || habitatPlotByIdFetched) &&
      !habitatPlotById &&
      quartierId != null &&
      Number(quartierId) > 0 &&
      plotNumber.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const habitatPlot = habitatPlotById ?? habitatPlotLookup?.plot ?? null;

  const { polygonRings, mapCenter, mapRegion, hasMapGeometry, dimensionsLine } =
    useMemo(
      () => resolveLandmarkMapGeometry(landmark, habitatPlot),
      [landmark, habitatPlot],
    );

  const images: string[] = Array.isArray(landmark.images)
    ? landmark.images.filter((u: unknown) => typeof u === "string" && u)
    : [];

  const landmarkVideoUrl = useMemo(() => {
    const candidates = [
      landmark.video_url,
      landmark.videoUrl,
      landmark.video,
      Array.isArray(landmark.videos) ? landmark.videos[0] : undefined,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
    return null;
  }, [landmark]);

  const localizedLandType = localizeLandType(landmark.land_type, t);
  const paperDisplayItems = useMemo(
    () => buildPaperDisplayItems(landmark?.paper_types, t),
    [landmark, t],
  );

  const isInvestment = Boolean(
    landmark.is_investment_opportunity ?? landmark.isInvestmentOpportunity,
  );
  const isGoodDeal = Boolean(landmark.is_good_deal ?? landmark.isGoodDeal);
  const isGold = Boolean(landmark.is_gold ?? landmark.isGold);
  const isVerified = Boolean(landmark.is_verified ?? landmark.isVerified);
  const plotConfirmed = Boolean(
    landmark.plot_confirmed ?? landmark.plotConfirmed,
  );
  const hasCadastrePlot = Boolean(habitatPlotId);

  const locationLine = [
    landmark.city_name || landmark.region,
    landmark.zone_name || landmark.zoning,
    landmark.quartier_name || landmark.district,
  ]
    .filter(Boolean)
    .join(" · ");

  const priceDisplay =
    landmark.price != null && !isNaN(Number(landmark.price))
      ? Number(landmark.price).toLocaleString()
      : null;

  const tableRows = (
    [
      defined(landmark.area) && {
        label: t("landmark.fields.area"),
        value: `${landmark.area} m²`,
      },
      defined(landmark.land_type) && {
        label: t("landmark.fields.landType"),
        value: localizedLandType || landmark.land_type,
      },
      defined(landmark.zoning) && {
        label: t("landmark.fields.zoning"),
        value: landmark.zoning,
      },
      defined(landmark.plot_number) && {
        label: t("landmark.fields.plotNumber"),
        value: String(landmark.plot_number),
      },
      plotConfirmed && {
        label: t("landmark.fields.plotStatus", "Plot status"),
        value: hasCadastrePlot
          ? t("landmarkDetails.cadastreVerified", "Cadastre verified")
          : t("landmarkDetails.hostConfirmed", "Host confirmed"),
      },
      (landmark.quartier_name || landmark.district) && {
        label: t("landmark.fields.sector", "Sector"),
        value: landmark.quartier_name || landmark.district,
      },
      (landmark.zone_name || landmark.zoning) && {
        label: t("landmark.fields.zone", "Zone"),
        value: landmark.zone_name || landmark.zoning,
      },
      (landmark.city_name || landmark.region) && {
        label: t("landmark.fields.city", "City"),
        value: landmark.city_name || landmark.region,
      },
    ] as ({ label: string; value: string } | false)[]
  ).filter(Boolean) as { label: string; value: string }[];

  const plotMapDetails = useMemo(() => {
    const plan =
      habitatPlot?.plan?.name_ar ||
      habitatPlot?.plan?.name ||
      landmark.city_name ||
      landmark.region;
    const sector =
      habitatPlot?.sector?.name_ar ||
      habitatPlot?.sector?.name ||
      landmark.quartier_name ||
      landmark.district;
    return [
      {
        label: t("landmark.fields.plotNumber", "Plot"),
        value: landmark.plot_number
          ? displayPlotNumber(landmark.plot_number)
          : habitatPlot?.plot_number
            ? displayPlotNumber(habitatPlot.plot_number)
            : "—",
      },
      {
        label: t("landmark.fields.city", "City"),
        value: String(plan || landmark.city_name || landmark.region || "—"),
      },
      {
        label: t("landmark.fields.zone", "Zone"),
        value: String(landmark.zone_name || landmark.zoning || "—"),
      },
      {
        label: t("landmark.fields.sector", "Sector"),
        value: String(sector || "—"),
      },
      {
        label: t("landmark.fields.area", "Area"),
        value: habitatPlot?.area_m2
          ? `${habitatPlot.area_m2} m²`
          : defined(landmark.area)
            ? `${landmark.area} m²`
            : "—",
      },
      habitatPlot?.il_value != null && {
        label: t("landmark.fields.elevation", "Front elevation"),
        value: `${habitatPlot.il_value} m`,
      },
      dimensionsLine && {
        label: t("landmark.fields.sides", "Dimensions"),
        value: dimensionsLine,
      },
    ].filter(Boolean) as { label: string; value: string }[];
  }, [habitatPlot, landmark, t, dimensionsLine]);

  const hasRouteApiKey = OPENROUTESERVICE_API_KEY.length > 0;

  const fetchOpenRoute = useCallback(async () => {
    if (!hasRouteApiKey || !mapCenter) {
      Alert.alert(t("common.error"), t("landmarkDetails.routeNotConfigured"));
      return;
    }
    try {
      setFetchingRoute(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("common.error"),
          t("landmarkDetails.locationPermissionRequired"),
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${pos.coords.longitude},${pos.coords.latitude}&end=${mapCenter.longitude},${mapCenter.latitude}`;
      const res = await fetch(url, {
        headers: {
          Authorization: OPENROUTESERVICE_API_KEY,
          Accept: "application/geo+json;charset=UTF-8",
        },
      });
      if (!res.ok) throw new Error("route");
      const body = await res.json();
      const coords: number[][] =
        body?.features?.[0]?.geometry?.coordinates ?? [];
      const props = body?.features?.[0]?.properties?.summary ?? {};
      setRouteCoords(
        coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
      );
      setRouteDistanceM(props.distance);
      setRouteDurationS(props.duration);
    } catch {
      Alert.alert(t("common.error"), t("search.networkError"));
    } finally {
      setFetchingRoute(false);
    }
  }, [mapCenter, hasRouteApiKey, t]);

  const openDirections = useCallback(async () => {
    if (!mapCenter) return;
    const google = `https://www.google.com/maps/dir/?api=1&destination=${mapCenter.latitude},${mapCenter.longitude}&travelmode=driving`;
    const apple = `http://maps.apple.com/?daddr=${mapCenter.latitude},${mapCenter.longitude}&dirflg=d`;
    const url = Platform.select({
      ios: apple,
      android: google,
      default: google,
    });
    try {
      await Linking.openURL(url!);
    } catch {
      Alert.alert(t("common.error"), t("search.networkError"));
    }
  }, [mapCenter, t]);

  const routeSummary = useMemo(() => {
    const parts: string[] = [];
    if (routeDistanceM != null)
      parts.push(`${Math.round(routeDistanceM / 100) / 10} km`);
    if (routeDurationS != null)
      parts.push(`${Math.round(routeDurationS / 60)} min`);
    return parts.join(" · ");
  }, [routeDistanceM, routeDurationS]);

  const handleShare = useCallback(async () => {
    try {
      const msg = [
        landmark.title,
        locationLine,
        formatPrice(landmark.price, landmark.currency),
      ]
        .filter(Boolean)
        .join(" · ");
      await Share.share({ message: msg || landmark.title });
    } catch {
      /* cancelled */
    }
  }, [landmark, locationLine]);

  const contactHost = useCallback(() => {
    if (orgPhone) Linking.openURL(`tel:${orgPhone}`).catch(() => {});
    else if (orgEmail) Linking.openURL(`mailto:${orgEmail}`).catch(() => {});
  }, [orgPhone, orgEmail]);

  const listedByData = useMemo(
    () => ({
      organization: landmark?.organization
        ? {
            ...(landmark.organization || {}),
            name: orgName,
            phone: orgPhone,
            email: orgEmail,
            owner:
              landmark.organization?.owner ?? landmark?.organization?.Owner,
          }
        : null,
      owner: landmark?.owner ?? landmark?.Owner ?? null,
      listing_price: landmark.price,
    }),
    [landmark, orgName, orgPhone, orgEmail],
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.55],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.12, 1],
    extrapolate: "clamp",
  });
  const hasVideos = Boolean(landmarkVideoUrl);

  return (
    <View style={ss.flex}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <Animated.View
        style={[ss.floatingHeader, { opacity: headerOpacity }]}
        pointerEvents="box-none"
      >
        <SafeAreaView>
          <View style={ss.navRow}>
            <Pressable style={ss.navBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={22} color={BLACK} />
            </Pressable>
            <Text style={ss.navTitle} numberOfLines={1}>
              {landmark.title}
            </Text>
            <Pressable style={ss.navBtn} onPress={() => setShowOptions(true)}>
              <DotsThreeVertical size={22} color={BLACK} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>

      <View style={ss.transparentHeader} pointerEvents="box-none">
        <SafeAreaView>
          <View style={ss.navRow}>
            <Pressable
              style={ss.navBtnTransparent}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={20} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                style={ss.navBtnTransparent}
                onPress={() => void landmarkWishlist.toggle()}
                disabled={landmarkWishlist.isPending}
              >
                <Heart
                  size={20}
                  color="#FFF"
                  weight={landmarkWishlist.isSaved ? "fill" : "regular"}
                />
              </Pressable>
              <Pressable style={ss.navBtnTransparent} onPress={handleShare}>
                <ShareNetwork size={20} color="#FFF" />
              </Pressable>
              <Pressable
                style={ss.navBtnTransparent}
                onPress={() => setShowOptions(true)}
              >
                <DotsThreeVertical size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
          <View
            style={{
              height: HERO_H,
              backgroundColor: "#000",
              position: "relative",
            }}
          >
            {heroTab === "gallery" && images.length > 0 && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) =>
                  setImgIndex(
                    Math.round(e.nativeEvent.contentOffset.x / SCREEN_W),
                  )
                }
              >
                {images.map((uri: string, i: number) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={{ width: SCREEN_W, height: HERO_H }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}
            {heroTab === "video" && hasVideos && landmarkVideoUrl && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowVideoModal(true)}
                style={{ width: SCREEN_W, height: HERO_H }}
              >
                <Video
                  style={{ width: "100%", height: "100%" }}
                  source={{ uri: landmarkVideoUrl }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isMuted
                />
                <View style={ss.heroPlayOverlay}>
                  <View style={ss.heroPlayCircle}>
                    <Play size={44} color="#FFF" weight="fill" />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            {heroTab === "gallery" && images.length === 0 && !hasVideos && (
              <View
                style={[ss.centerContent, { width: SCREEN_W, height: HERO_H }]}
              >
                <MapPin size={64} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
                  {t("landmarkDetails.noPhotos")}
                </Text>
              </View>
            )}
            {(images.length > 0 || hasVideos) && (
              <View style={ss.mediaTabsOverlay}>
                {images.length > 0 && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setHeroTab("gallery");
                    }}
                    style={[
                      ss.mediaTabPill,
                      heroTab === "gallery" && ss.mediaTabPillActive,
                    ]}
                  >
                    <Images
                      size={13}
                      color={heroTab === "gallery" ? BLACK : "#FFF"}
                      weight="fill"
                    />
                    <Text
                      style={[
                        ss.mediaTabPillText,
                        heroTab === "gallery" && ss.mediaTabPillTextActive,
                      ]}
                    >
                      {t("propertySaleDetails.hero.tabPhotos", "Photos")}
                    </Text>
                  </Pressable>
                )}
                {hasVideos && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setHeroTab("video");
                    }}
                    style={[
                      ss.mediaTabPill,
                      heroTab === "video" && ss.mediaTabPillActive,
                    ]}
                  >
                    <VideoCamera
                      size={13}
                      color={heroTab === "video" ? BLACK : "#FFF"}
                      weight="fill"
                    />
                    <Text
                      style={[
                        ss.mediaTabPillText,
                        heroTab === "video" && ss.mediaTabPillTextActive,
                      ]}
                    >
                      {t("propertySaleDetails.hero.tabVideo", "Video")}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
            {heroTab === "gallery" && images.length > 1 && (
              <View style={ss.imgCounter}>
                <Text style={ss.imgCounterText}>
                  {imgIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={ss.contentPad}>
          <View style={ss.titleSection}>
            <Text style={ss.title}>{landmark.title}</Text>
            {plotConfirmed && landmark.plot_number ? (
              <View style={ss.plotBanner}>
                <MaterialIcons name="verified" size={16} color={CHINESE_RED} />
                <Text style={ss.plotBannerText}>
                  {t("landmarkDetails.plotBanner", "Plot {{number}}", {
                    number: displayPlotNumber(landmark.plot_number),
                  })}{" "}
                  {hasCadastrePlot
                    ? t("landmarkDetails.cadastreVerified")
                    : t("landmarkDetails.hostConfirmed")}
                </Text>
              </View>
            ) : null}
            {locationLine ? (
              <View style={ss.locationRow}>
                <View style={ss.locationIconWrap}>
                  <Image
                    source={require("../assets/location-criteria.png")}
                    style={ss.locationIconImg}
                    resizeMode="cover"
                  />
                </View>
                <Text style={ss.locationText} numberOfLines={2}>
                  {locationLine}
                </Text>
              </View>
            ) : null}
          </View>

          <Divider margin={8} />

          <View style={ss.priceBlock}>
            <View style={ss.priceTopRow}>
              {priceDisplay ? (
                <Text style={ss.priceText}>
                  {priceDisplay}
                  <Text style={ss.priceCurrency}>
                    {" "}
                    {landmark.currency || t("common.currencySymbol", "MRU")}
                  </Text>
                </Text>
              ) : (
                <Text style={[ss.priceText, { fontSize: 18, color: MUTED }]}>
                  {t("landmarkDetails.priceOnRequest")}
                </Text>
              )}
              <View style={ss.titleBadgesRow}>
                {isGold && (
                  <Badge
                    label={t("landmark.badges.gold")}
                    variant="gold"
                    icon={<Star size={11} color="#B8860B" weight="fill" />}
                  />
                )}
                {isVerified && (
                  <Badge
                    label={t("landmark.badges.verified")}
                    variant="success"
                    icon={
                      <CheckCircle size={11} color="#2E7D32" weight="fill" />
                    }
                  />
                )}
                {isGoodDeal && (
                  <Badge
                    label={t("landmark.badges.goodDeal")}
                    variant="success"
                    icon={<Seal size={11} color="#2E7D32" weight="fill" />}
                  />
                )}
                {isInvestment && (
                  <Badge
                    label={t("landmark.badges.investmentOpportunity")}
                    variant="gold"
                    icon={<TrendUp size={11} color="#B8860B" weight="fill" />}
                  />
                )}
              </View>
            </View>
          </View>

          <Divider margin={8} />

          <View style={ss.statsRow}>
            {defined(landmark.area) && (
              <StatCard
                icon={<Ruler size={20} color={BLACK} />}
                value={`${landmark.area}`}
                label={t("landmark.fields.area")}
              />
            )}
            {defined(landmark.land_type) && (
              <StatCard
                icon={<MapPin size={20} color={BLACK} />}
                value={localizedLandType || landmark.land_type}
                label={t("landmark.fields.landType")}
              />
            )}
            {defined(landmark.zoning) && (
              <StatCard
                icon={<Seal size={20} color={BLACK} />}
                value={landmark.zoning}
                label={t("landmark.fields.zoning")}
              />
            )}
          </View>

          {defined(landmark.description) && (
            <>
              <SectionTitle
                title={t("common.description")}
                subtitle={t(
                  "propertySaleDetails.sections.descriptionSub",
                  "Learn more about this listing",
                )}
              />
              <Text
                style={ss.bodyText}
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {landmark.description}
              </Text>
              {String(landmark.description).length > 150 && (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowFullDescription(!showFullDescription);
                  }}
                  style={ss.expandBtn}
                >
                  <Text style={ss.expandBtnText}>
                    {showFullDescription
                      ? t("propertySaleDetails.actions.collapse")
                      : t("propertySaleDetails.actions.readMore")}
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

          {tableRows.length > 0 && (
            <InfoTable
              title={t("landmark.sections.details", "Land details")}
              data={tableRows}
            />
          )}

          {paperDisplayItems.length > 0 && (
            <View style={ss.section}>
              <ListingPapersCard
                title={t("listing.common.papersSectionTitle")}
                subtitle={t("listing.common.papersSectionSubtitle")}
                items={paperDisplayItems}
              />
            </View>
          )}

          <LandmarkPlotMapSection
            sectionStyle={ss.section}
            hasGeometry={hasMapGeometry}
            region={mapRegion}
            polygonRings={polygonRings}
            center={mapCenter}
            locationLine={locationLine}
            details={plotMapDetails}
            onOpenMaps={openDirections}
            onGetRoute={fetchOpenRoute}
            fetchingRoute={fetchingRoute}
            showRouteButton={hasRouteApiKey}
            routeSummary={routeSummary || undefined}
          />

          {showPublisher && (
            <ListedByHostSection
              sectionStyle={ss.section}
              data={listedByData as any}
              onContactHost={contactHost}
              onOpenContactOptions={contactHost}
            />
          )}
        </View>
      </Animated.ScrollView>

      <View style={ss.bottomBarCompact}>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            flex: 1,
            paddingHorizontal: 8,
          }}
        >
          <ActionButton
            icon={<NavigationArrow size={16} color="#FFF" weight="fill" />}
            label={t("guidance.start", "Navigate")}
            onPress={() =>
              (navigation as any).navigate("LandmarkGuidance", { landmark })
            }
            variant="primary"
          />
          {(orgPhone || orgEmail) && (
            <ActionButton
              icon={<Phone size={16} color="#FFF" />}
              label={t("propertySaleDetails.actions.call", "Call")}
              onPress={contactHost}
              variant="secondary"
            />
          )}
        </View>
      </View>

      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <TouchableOpacity
            style={styles.sheetItem}
            onPress={() => {
              setShowOptions(false);
              setShowReportModal(true);
            }}
          >
            <Text style={styles.sheetItemTitle}>
              {t("video.reportVideo", "Report listing")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={() => setShowOptions(false)}
          >
            <Text style={styles.sheetCancelText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowReportModal(false);
          setReportReason("");
        }}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowReportModal(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.reportTitle}>{t("video.reportVideo")}</Text>
          {["inappropriate", "spam", "fake", "other"].map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.reportOption,
                reportReason === key && styles.reportOptionSelected,
              ]}
              onPress={() => setReportReason(key)}
            >
              <Text style={styles.reportOptionText}>{key}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.reportSubmitBtn, !reportReason && { opacity: 0.5 }]}
            disabled={!reportReason}
            onPress={async () => {
              if (!user?.accessToken) {
                Alert.alert(
                  t("common.error"),
                  t("landmarkDetails.pleaseLogInToContinue"),
                );
                return;
              }
              try {
                await api.post(`/landmarks/${landmark.id}/report`, {
                  reason: reportReason,
                });
                setToast({
                  message: t("landmarkDetails.thanksWeReceivedYourReport"),
                  type: "success",
                });
                setTimeout(() => navigation.goBack(), 350);
              } catch {
                Alert.alert(
                  t("common.error"),
                  t("landmarkDetails.failedToSubmitReport"),
                );
              } finally {
                setShowReportModal(false);
                setReportReason("");
              }
            }}
          >
            <Text style={styles.reportSubmitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={showVideoModal}
        animationType="fade"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity
            style={styles.videoClose}
            onPress={() => setShowVideoModal(false)}
          >
            <MaterialIcons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
          {landmarkVideoUrl ? (
            <Video
              source={{ uri: landmarkVideoUrl }}
              style={{ flex: 1 }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
            />
          ) : null}
        </View>
      </Modal>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 2200}
          onHide={() => setToast(null)}
        />
      ) : null}
    </View>
  );
};

const LandmarkDetailsById = (
  props: RootStackScreenProps<"LandmarkDetails"> & {
    landmarkId: number;
    initialLandmark?: Record<string, unknown>;
  },
) => {
  const { landmarkId, navigation, initialLandmark } = props;
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const {
    data: landmark,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["landmark", landmarkId, currentLanguage?.slice(0, 2)],
    queryFn: async () => {
      const lang = (currentLanguage || "en").slice(0, 2);
      const res = await fetch(
        `${endpoints.landmarksRoot}/${landmarkId}?lang=${encodeURIComponent(lang)}`,
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Not found");
      const lm = j?.landmark ?? j;
      return lm ? { ...lm, host: j.host } : lm;
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayLandmark = landmark ?? initialLandmark;

  if (isLoading && !displayLandmark) return <LandmarkSkeleton />;
  if ((error || !displayLandmark) && !isLoading) {
    return (
      <SafeAreaView style={ss.centerContent}>
        <Text style={{ color: MUTED, marginBottom: 16 }}>
          {(error as Error)?.message || t("landmarkDetails.listingNotFound")}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: CHINESE_RED, fontWeight: "700" }}>
            {t("landmarkDetails.goBack")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  return (
    <LandmarkDetailsContent
      {...props}
      navigation={navigation}
      landmark={displayLandmark}
    />
  );
};

export const LandmarkDetailsScreen = (
  props: RootStackScreenProps<"LandmarkDetails">,
) => {
  const params = props.route.params;
  const landmark = params?.landmark;
  const landmarkId = Number(
    params?.landmarkId ??
      (params as { landmarkID?: number })?.landmarkID ??
      landmark?.id ??
      0,
  );

  if (landmarkId > 0) {
    return (
      <LandmarkDetailsById
        {...props}
        landmarkId={landmarkId}
        initialLandmark={landmark}
      />
    );
  }

  if (!landmark) {
    return (
      <SafeAreaView style={ss.centerContent}>
        <Text>Listing not found</Text>
      </SafeAreaView>
    );
  }
  return <LandmarkDetailsContent {...props} landmark={landmark} />;
};

const ss = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFF" },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  heroPlayCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaTabsOverlay: {
    position: "absolute",
    bottom: 14,
    left: 12,
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  mediaTabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  mediaTabPillActive: { backgroundColor: "rgba(255,255,255,0.95)" },
  mediaTabPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  mediaTabPillTextActive: { color: BLACK },
  imgCounter: {
    position: "absolute",
    bottom: 50,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  imgCounterText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  contentPad: { paddingHorizontal: 18 },
  section: { marginVertical: 16 },
  titleSection: { marginTop: 6, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 10,
  },
  plotBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  plotBannerText: { fontSize: 13, fontWeight: "600", color: CHINESE_RED },
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
  },
  priceText: {
    fontSize: 28,
    fontWeight: "800",
    color: CHINESE_RED,
    lineHeight: 34,
  },
  priceCurrency: { fontSize: 14, fontWeight: "500", color: MUTED },
  titleBadgesRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    maxWidth: "45%",
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
    alignSelf: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT,
  },
  expandBtnText: { fontSize: 13, fontWeight: "700", color: BLACK },
  bottomBarCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    zIndex: 100,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    paddingTop: 10,
  },
});

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetItem: { paddingVertical: 14 },
  sheetItemTitle: { fontSize: 15, fontWeight: "600", color: C.ink },
  sheetCancelBtn: { paddingVertical: 14, alignItems: "center" },
  sheetCancelText: { fontSize: 14, color: C.gray, fontWeight: "600" },
  reportTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.ink,
    textAlign: "center",
    marginBottom: 12,
  },
  reportOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 8,
  },
  reportOptionSelected: { borderColor: C.teal, backgroundColor: "#FEF2F2" },
  reportOptionText: { fontSize: 14, color: C.ink },
  reportSubmitBtn: {
    backgroundColor: C.ink,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  reportSubmitText: { color: C.white, fontWeight: "700" },
  videoClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 28,
    right: 16,
    zIndex: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LandmarkDetailsScreen;
