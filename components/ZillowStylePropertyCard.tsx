import React, { useCallback, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native-gesture-handler";
import {
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewToken,
  Platform,
  Modal
} from "react-native";
import { Text } from "@ui-kitten/components";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as FileSystem from "expo-file-system";
import {
  resolvePropertySaleVideoUrl,
  resolveUploadedMediaUrl,
} from "../utils/mediaUri";
import {
  prefetchCarouselNeighbors,
} from "../services/imagePrefetch";
import { flattenPropertySaleGalleryImages } from "../utils/propertySaleGallery";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import { useListingWishlist } from "../hooks/useListingWishlist";
import { buildPaperDisplayItems } from "../utils/paperDisplay";
import {
  localizeListingStatus,
  localizeOrientation,
  localizePropertySaleType,
} from "../utils/listingLabels";
import { theme } from "../theme";
import {
  SoldPropertyImageVeil,
  SoldPropertyTractionPoster
} from "./SoldPropertyTractionPoster";

// ============================================================
// Design Tokens - Chinese Real Estate App Style
// ============================================================

const T = {
  white: "#FFFFFF",
  black: "#1A1A1A",
  ink: "#1A1A1A",
  inkSoft: "#666666",
  inkMuted: "#999999",
  border: "#F0F0F0",
  bgSurface: "#F8F9FA",
  brand: theme["color-temporary-primary"], // Chinese red
  brandLight: "rgba(196,30,58,0.08)",
  gold: "#D4AF37",
  goldLight: "rgba(212,175,55,0.12)",
  green: "#10B981",
  greenBg: "#F0FDF4",
  greenBorder: "#A7F3D0",
  redHeart: "#FF385C",
  glassDark: "rgba(0,0,0,0.65)",
  glassLight: "rgba(255,255,255,0.92)"
};

// ============================================================
// Layout
// ============================================================

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W;
const IMAGE_H = 224;
const RADIUS = 0;

// ============================================================
// Types
// ============================================================

export interface PropertyData {
  id: number;
  title: string;
  description?: string;
  listing_price?: number;
  price?: number;
  currency?: string;
  images?: string[];
  videos?: string[];
  video_url?: string;
  videoUrl?: string;
  video?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  area?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  property_type?: string;
  owner?: { true_broker?: boolean };
  organization?: {
    name?: string;
    banner_image?: string;
    logo?: string;
    logoURL?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    owner?: { true_broker?: boolean };
  };
  status?: string;
  trucheck?: boolean;
  off_plan?: boolean;
  initial_sale?: boolean;
  extra_badges?: string[];
  handover_date?: string;
  payment_plan?: string;
  validation_text?: string;
  paper_types?: string[];
  is_investment_opportunity?: boolean;
  isInvestmentOpportunity?: boolean;
  is_gold?: boolean;
  isGold?: boolean;
  is_sold?: boolean;
  updated_at?: string;
  // Extended fields for Chinese market
  floor?: number;
  total_floors?: number;
  orientation?: string;
  year_built?: number;
  property_tax?: number;
  hoa_fee?: number;
  nearby_metro?: string;
  nearby_school?: string;
  nearby_hospital?: string;
}

export interface PropertyCardProps {
  property: PropertyData;
  onPress: (id: number, initialImageIndex?: number) => void;
  onCall?: (phone?: string) => void;
  onEmail?: (email?: string) => void;
  onWhatsApp?: (phone?: string) => void;
  onFavorite?: (id: number) => void;
  isFavorite?: boolean;
  /** When set, card uses unified server wishlist (recommended for sale listings). */
  listingKind?: "sale";
}

// ============================================================
// Helper Functions
// ============================================================

const isValidUrl = (url: unknown): url is string =>
  typeof url === "string" &&
  url.trim().length > 0 &&
  (url.startsWith("http://") || url.startsWith("https://"));

const formatPriceMRU = (v: number) => {
  if (!v) return "0";
  return v.toLocaleString("fr-MR", { maximumFractionDigits: 0 });
};

const resolveVideoUrl = (p: PropertyData): string | undefined =>
  resolvePropertySaleVideoUrl(p as Record<string, unknown>) ?? undefined;

/** Stream from CDN immediately — do not block on full-file download. */
function useStreamVideoUrl(url: string | undefined): string | undefined {
  return useMemo(() => {
    if (!url) return undefined;
    const normalized = resolveUploadedMediaUrl(url);
    return isValidUrl(normalized) ? normalized : undefined;
  }, [url]);
}

// ============================================================
// EXPLANATORY TABLE COMPONENT (Embedded in modal)
// ============================================================

const InfoTable = ({
  title,
  data
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
          item.highlight && infoTableStyles.highlightRow
        ]}
      >
        <Text style={infoTableStyles.label}>{item.label}</Text>
        <Text
          style={[
            infoTableStyles.value,
            item.highlight && infoTableStyles.highlightValue
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
    overflow: "hidden",
    marginVertical: 10,
    borderWidth: 0.5,
    borderColor: "#E8E8E8"
  },
  header: {
    backgroundColor: "#2C3E50",
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  headerText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE"
  },
  lastRow: {
    borderBottomWidth: 0
  },
  highlightRow: {
    backgroundColor: "#FFF8E7"
  },
  label: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500"
  },
  value: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "600"
  },
  highlightValue: {
    color: "#C41E3A",
    fontWeight: "700"
  }
});

const trustStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D4AF37",
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 9,
    color: "#AAA",
    marginTop: 1
  }
});

// ============================================================
// ACTION BUTTON GROUP (Parent Background Style)
// ============================================================

const ActionButton = ({
  icon,
  label,
  onPress,
  variant = "primary"
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
          backgroundColor: T.brand,
          borderWidth: 0
        };
      case "secondary":
        return {
          backgroundColor: "#2C3E50",
          borderWidth: 0
        };
      case "whatsapp":
        return {
          backgroundColor: "#25D366",
          borderWidth: 0
        };
      default:
        return {
          backgroundColor: "#FFF",
          borderWidth: 1,
          borderColor: "#E0E0E0"
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
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderRadius: 6,
          flex: 1
        },
        getButtonStyle()
      ]}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={[{ fontSize: 14, fontWeight: "600" }, getTextStyle()]}>
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
      // padding: 8,
      borderRadius: 10,
      marginTop: 8
    }}
  >
    {children}
  </View>
);

// ============================================================
// Video Disk Cache (unchanged)
// ============================================================

const VIDEO_DIR = `${(FileSystem as any).cacheDirectory ?? ""}vc/`;
let _dirReady = false;

async function ensureDir() {
  if (_dirReady) return;
  const i = await FileSystem.getInfoAsync(VIDEO_DIR);
  if (!i.exists)
    await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
  _dirReady = true;
}

const _fly = new Map<string, Promise<string>>();

export async function getCachedVideoUri(url: string): Promise<string> {
  await ensureDir();
  const hash = url.replace(/[^a-zA-Z0-9]/g, "_").slice(-80);
  const ext = url.split("?")[0].split(".").pop()?.slice(0, 4) ?? "mp4";
  const path = `${VIDEO_DIR}${hash}.${ext}`;
  if ((await FileSystem.getInfoAsync(path)).exists) return path;
  if (_fly.has(url)) return _fly.get(url)!;
  const t = (async () => {
    try {
      return (
        (await FileSystem.createDownloadResumable(url, path).downloadAsync())
          ?.uri ?? url
      );
    } catch {
      return url;
    } finally {
      _fly.delete(url);
    }
  })();
  _fly.set(url, t);
  return t;
}

// ============================================================
// Badge Component (Chinese Style)
// ============================================================

const Badge: React.FC<{ label: string; dark?: boolean; gold?: boolean }> =
  React.memo(({ label, dark, gold }) => (
    <View style={[bd.pill, dark ? bd.dark : bd.light, gold && bd.gold]}>
      {gold && (
        <MaterialIcons
          name="star"
          size={8}
          color="#D4AF37"
          style={{ marginRight: 3 }}
        />
      )}
      <Text
        style={[
          bd.text,
          dark ? bd.textLight : bd.textDark,
          gold && bd.textGold
        ]}
      >
        {label}
      </Text>
    </View>
  ));

const bd = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  dark: { backgroundColor: T.glassDark },
  light: { backgroundColor: T.glassLight },
  gold: {
    backgroundColor: "#FEF9C3",
    borderWidth: 0.5,
    borderColor: "#FCD34D"
  },
  text: { fontSize: 9, fontWeight: "700", letterSpacing: 0.2 },
  textLight: { color: T.white },
  textDark: { color: T.ink },
  textGold: { color: "#B45309" }
});

// ============================================================
// Animated Heart Component
// ============================================================

const AnimHeart: React.FC<{
  isFav: boolean;
  onPress: () => void;
  loading?: boolean;
}> = React.memo(({ isFav, onPress, loading }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.78, { damping: 6, stiffness: 400 }),
      withSpring(1.18, { damping: 5, stiffness: 350 }),
      withSpring(1.0, { damping: 12, stiffness: 300 })
    );
    onPress();
  };
  return (
    <TouchableOpacity
      style={heart.btn}
      onPress={handlePress}
      disabled={loading}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={1}
    >
      <Animated.View style={animStyle}>
        {isFav ? (
          <Ionicons name="heart" size={22} color={T.redHeart} />
        ) : (
          <Ionicons name="heart-outline" size={22} color={T.white} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const heart = StyleSheet.create({
  btn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  }
});

// ============================================================
// Image Carousel Component
// ============================================================

const BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

interface CarouselProps {
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onImagePress?: (imageIndex: number) => void;
}

const ImageCarousel: React.FC<CarouselProps> = React.memo(
  ({ images, index, onIndexChange, onImagePress }) => {
    const ref = useRef<FlatList>(null);
    const nav = useCallback(
      (next: number) => {
        const i = Math.max(0, Math.min(images.length - 1, next));
        ref.current?.scrollToIndex({ index: i, animated: true });
        onIndexChange(i);
      },
      [images.length, onIndexChange]
    );
    const getItemLayout = useCallback(
      (_: any, i: number) => ({ length: CARD_W, offset: CARD_W * i, index: i }),
      []
    );
    const viewCfg = useRef({ viewAreaCoveragePercentThreshold: 50 });
    const onViewable = useCallback(
      ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0]?.index != null)
          onIndexChange(viewableItems[0].index);
      },
      [onIndexChange]
    );
    const renderItem = useCallback(
      ({ item, index: itemIndex }: { item: string; index: number }) => (
        <Pressable
          onPress={() => onImagePress?.(itemIndex)}
          style={{ width: CARD_W, height: IMAGE_H }}
        >
          <Image
            source={{ uri: item }}
            style={{ width: CARD_W, height: IMAGE_H }}
            contentFit="cover"
            cachePolicy="memory-disk"
            placeholder={BLURHASH}
            transition={180}
          />
        </Pressable>
      ),
      [onImagePress]
    );
    return (
      <>
        <FlatList
          ref={ref}
          data={images}
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={CARD_W}
          snapToAlignment="start"
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewCfg.current}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          directionalLockEnabled
          nestedScrollEnabled
          style={{ flex: 1 }}
        />
        {index > 0 && (
          <TouchableOpacity
            style={ca.left}
            onPress={() => nav(index - 1)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="chevron-left" size={15} color="#000" />
          </TouchableOpacity>
        )}
        {index < images.length - 1 && (
          <TouchableOpacity
            style={ca.right}
            onPress={() => nav(index + 1)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="chevron-right" size={15} color="#000" />
          </TouchableOpacity>
        )}
        {images.length > 1 && (
          <View style={ca.countPill}>
            <Text style={ca.countText}>
              {index + 1} / {images.length}
            </Text>
          </View>
        )}
      </>
    );
  }
);

const ca = StyleSheet.create({
  left: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -17,
    width: 24,
    height: 24,
    borderRadius: 17,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2
  },
  right: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -17,
    width: 24,
    height: 24,
    borderRadius: 17,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2
  },
  countPill: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.56)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    zIndex: 2
  },
  countText: { fontSize: 11, fontWeight: "600", color: T.white }
});

// ============================================================
// Video Preview Block
// ============================================================

interface VideoBlockProps {
  videoUrl: string;
  onPress: () => void;
}

const VideoBlock: React.FC<VideoBlockProps> = React.memo(
  ({ videoUrl, onPress }) => {
    const streamUrl = useStreamVideoUrl(videoUrl);
    return (
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        activeOpacity={1}
      >
        {streamUrl ? (
          <>
            <Video
              source={{ uri: streamUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
              useNativeControls={false}
            />
            <View style={vb.overlay} />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, vb.loadingBg]}>
            <MaterialIcons name="videocam-off" size={40} color="#999" />
          </View>
        )}
        <View style={vb.playCenter}>
          <View style={vb.playCircle}>
            <MaterialIcons name="play-arrow" size={30} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const vb = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)"
  },
  loadingBg: {
    backgroundColor: "#E8EBF0",
    justifyContent: "center",
    alignItems: "center"
  },
  playCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)"
  }
});

// ============================================================
// Video Modal (unchanged, kept compact)
// ============================================================

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

interface VModalProps {
  visible: boolean;
  videoUrl: string;
  title: string;
  onClose: () => void;
}

const VideoModal: React.FC<VModalProps> = React.memo(
  ({ visible, videoUrl, title, onClose }) => {
    const ref = useRef<Video>(null);
    const [playing, setPlaying] = useState(true);
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const streamUrl = useStreamVideoUrl(videoUrl);
    React.useEffect(() => {
      if (visible) setPlaying(true);
    }, [visible]);
    const close = useCallback(() => {
      ref.current?.pauseAsync().catch(() => {});
      onClose();
    }, [onClose]);
    const onSt = useCallback((s: AVPlaybackStatus) => {
      setStatus(s);
      if (s.isLoaded) setPlaying(s.isPlaying);
    }, []);
    const toggle = useCallback(async () => {
      if (!ref.current) return;
      playing ? await ref.current.pauseAsync() : await ref.current.playAsync();
    }, [playing]);
    const seek = useCallback(
      async (d: number) => {
        if (!ref.current || !status?.isLoaded) return;
        await ref.current.setPositionAsync(
          Math.max(0, ((status as any).positionMillis ?? 0) + d)
        );
      },
      [status]
    );
    const pct = useMemo(
      () =>
        !status?.isLoaded
          ? 0
          : (((status as any).positionMillis || 0) /
              ((status as any).durationMillis || 1)) *
            100,
      [status]
    );
    const posLbl = useMemo(
      () =>
        status?.isLoaded ? formatTime((status as any).positionMillis ?? 0) : "",
      [status]
    );
    const durLbl = useMemo(
      () =>
        status?.isLoaded ? formatTime((status as any).durationMillis ?? 0) : "",
      [status]
    );
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={vm.bg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={vm.inner}>
            <TouchableOpacity style={vm.close} onPress={close}>
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            {title.length > 0 && (
              <Text style={vm.title} numberOfLines={1}>
                {title}
              </Text>
            )}
            {streamUrl ? (
              <Video
                ref={ref}
                source={{ uri: streamUrl }}
                style={vm.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                onPlaybackStatusUpdate={onSt}
              />
            ) : (
              <View style={[vm.video, vm.loading]}>
                <MaterialIcons
                  name="hourglass-top"
                  size={28}
                  color="rgba(255,255,255,0.4)"
                />
              </View>
            )}
            <View style={vm.controls}>
              <View style={vm.prog}>
                {posLbl.length > 0 && <Text style={vm.time}>{posLbl}</Text>}
                <View style={vm.track}>
                  <View style={[vm.fill, { width: `${pct}%` as any }]} />
                </View>
                {durLbl.length > 0 && <Text style={vm.time}>{durLbl}</Text>}
              </View>
              <View style={vm.btns}>
                <TouchableOpacity onPress={() => seek(-10000)}>
                  <MaterialIcons
                    name="replay-10"
                    size={28}
                    color="rgba(255,255,255,0.85)"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={vm.playBtn} onPress={toggle}>
                  <MaterialIcons
                    name={playing ? "pause" : "play-arrow"}
                    size={30}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => seek(10000)}>
                  <MaterialIcons
                    name="forward-10"
                    size={28}
                    color="rgba(255,255,255,0.85)"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

const vm = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center"
  },
  inner: { width: "100%", alignItems: "center" },
  close: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    right: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    marginTop: Platform.OS === "ios" ? 60 : 42,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    paddingHorizontal: 48,
    textAlign: "center"
  },
  video: { width: SCREEN_W, height: SCREEN_W * 0.62 },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111"
  },
  controls: { width: "100%", paddingHorizontal: 20, paddingTop: 14 },
  prog: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16
  },
  track: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 2,
    overflow: "hidden"
  },
  fill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
  time: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    minWidth: 32,
    textAlign: "center"
  },
  btns: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)"
  }
});

// ============================================================
// Spec Dot
// ============================================================

const SpecDot = () => <View style={sp.dot} />;
const sp = StyleSheet.create({
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.inkMuted,
    marginHorizontal: 2
  }
});

// ============================================================
// MAIN CARD COMPONENT
// ============================================================

export const ZillowStylePropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onCall,
  onEmail,
  onWhatsApp,
  onFavorite,
  isFavorite = false,
  listingKind,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const saleWishlist = useListingWishlist(
    "sale",
    listingKind === "sale" ? property.id : undefined,
    { showToast: true },
  );
  const [isFav, setIsFav] = useState(isFavorite);
  const [imgIdx, setImgIdx] = useState(0);
  const [mediaTab, setMediaTab] = useState<"images" | "video">("images");
  const [modalVisible, setModalVisible] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const images = useMemo(
    () => flattenPropertySaleGalleryImages(property as Record<string, unknown>),
    [property],
  );
  const videoUrl = useMemo(() => resolveVideoUrl(property), [property]);
  const hasImages = images.length > 0;
  const hasVideo = !!videoUrl;
  const price = useMemo(
    () => property.listing_price ?? property.price ?? 0,
    [property]
  );
  const area = useMemo(
    () => property.square_footage ?? property.area ?? 0,
    [property]
  );
  const location = useMemo(
    () =>
      property.address ??
      [property.city, property.state, property.country]
        .filter(Boolean)
        .join(", ") ??
      "",
    [property]
  );
  const paperItems = useMemo(
    () => buildPaperDisplayItems(property.paper_types, t),
    [property.paper_types, t]
  );
  const showGoodDeal = Boolean(
    property.is_investment_opportunity || property.isInvestmentOpportunity
  );
  const showGold = Boolean(property.is_gold || property.isGold);
  const isSold = Boolean(property.is_sold);
  const soldAtIso = property.updated_at ?? null;

  // Calculate unit price (price per sqm)
  const unitPrice = useMemo(() => {
    if (price && area > 0) return Math.round(price / area);
    return null;
  }, [price, area]);

  const badges = useMemo(() => {
    const b: { label: string; dark?: boolean; gold?: boolean }[] = [];
    if (showGold)
      b.push({ label: t("propertyCard.goldListing", "Gold"), gold: true });
    if (property.trucheck)
      b.push({
        label: t("propertyCard.trucheckVerified", "TruCheck verified"),
        dark: true
      });
    const tb =
      property.owner?.true_broker || property.organization?.owner?.true_broker;
    if (tb)
      b.push({
        label: t("propertyCard.trueBrokerCertified", "True broker certified"),
        dark: true
      });
    if (property.off_plan)
      b.push({ label: t("propertyCard.offPlan", "Off-plan") });
    if (property.initial_sale)
      b.push({ label: t("propertyCard.initialSale", "Initial sale") });
    if (property.status) {
      b.push({
        label: localizeListingStatus(property.status, t),
        dark: property.status.toLowerCase() !== "published",
      });
    }
    (property.extra_badges ?? [])
      .slice(0, 2)
      .forEach((l) => b.push({ label: l }));
    return b;
  }, [property, showGold, t]);

  const feeTableRows = useMemo(() => {
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    if (property.hoa_fee) {
      rows.push({
        label: t("propertyCard.hoaFee", "HOA / management fee"),
        value: `${property.hoa_fee.toLocaleString()} MRU ${t("propertyCard.perMonth", "/ month")}`,
        highlight: true
      });
    }
    if (property.property_tax) {
      rows.push({
        label: t("propertyCard.propertyTax", "Property tax"),
        value: `${property.property_tax.toLocaleString()} MRU ${t("propertyCard.perYear", "/ year")}`
      });
    }
    return rows;
  }, [property.hoa_fee, property.property_tax, t]);

  const handleImagePress = useCallback(
    (pressedIndex: number) => {
      onPress(property.id, pressedIndex);
    },
    [onPress, property.id]
  );
  const handlePress = useCallback(() => {
    onPress(property.id, imgIdx);
  }, [onPress, property.id, imgIdx]);
  const resolvedFav =
    listingKind === "sale" ? saleWishlist.isSaved : isFav;

  const handleFav = useCallback(() => {
    if (!user) return;
    if (listingKind === "sale") {
      void saleWishlist.toggle();
      return;
    }
    setIsFav((prev) => !prev);
    onFavorite?.(property.id);
  }, [user, listingKind, saleWishlist, onFavorite, property.id]);

  React.useEffect(() => {
    if (listingKind !== "sale") setIsFav(isFavorite);
  }, [isFavorite, listingKind]);
  const handleCall = useCallback(
    () => onCall?.(property.organization?.phone),
    [onCall, property]
  );
  const handleEmail = useCallback(
    () =>
      onEmail?.(property.organization?.email ?? property.organization?.website),
    [onEmail, property]
  );
  const handleWa = useCallback(() => {
    const num = property.organization?.whatsapp ?? property.organization?.phone;
    if (onWhatsApp) return onWhatsApp(num);
    if (num) Linking.openURL(`https://wa.me/${num.replace(/\D/g, "")}`);
  }, [onWhatsApp, property]);
  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  React.useEffect(() => {
    setMediaTab(hasImages ? "images" : hasVideo ? "video" : "images");
  }, [property.id, hasImages, hasVideo]);

  React.useEffect(() => {
    if (!images.length) return;
    prefetchCarouselNeighbors(images, imgIdx);
  }, [images, imgIdx]);

  const typeLabel = property.property_type
    ? localizePropertySaleType(property.property_type, t)
    : null;

  return (
    <>
      <View style={s.card}>
        {/* Image Area */}
        <View style={s.imgBox} pointerEvents="box-none">
          {hasImages && mediaTab === "images" ? (
            <ImageCarousel
              images={images}
              index={imgIdx}
              onIndexChange={setImgIdx}
              onImagePress={handleImagePress}
            />
          ) : hasVideo && mediaTab === "video" ? (
            <VideoBlock videoUrl={videoUrl!} onPress={openModal} />
          ) : hasImages ? (
            <ImageCarousel
              images={images}
              index={imgIdx}
              onIndexChange={setImgIdx}
              onImagePress={handleImagePress}
            />
          ) : hasVideo ? (
            <VideoBlock videoUrl={videoUrl!} onPress={openModal} />
          ) : (
            <View style={s.placeholder}>
              <MaterialIcons name="home" size={36} color="#D1D5DB" />
              <Text style={s.placeholderText}>
                {t("propertyCard.noImagesYet", "No images yet")}
              </Text>
            </View>
          )}
          {isSold && <SoldPropertyImageVeil />}

          {/* Badges row */}
          {(showGoodDeal || badges.length > 0) && (
            <View style={s.badgesRow} pointerEvents="none">
              {showGoodDeal && (
                <View style={s.goodDealBadge}>
                  <Text style={s.goodDealBadgeText}>
                    {t("propertyCard.greatValueHome", "Great value")}
                  </Text>
                </View>
              )}
              {badges.slice(0, 3).map((b, i) => (
                <Badge key={i} label={b.label} dark={b.dark} gold={b.gold} />
              ))}
            </View>
          )}

          {/* Media tab switcher */}
          {hasImages && hasVideo && (
            <View style={s.mediaTabs} pointerEvents="box-none">
              <TouchableOpacity
                style={[s.mTab, mediaTab === "images" && s.mTabOn]}
                onPress={() => setMediaTab("images")}
                activeOpacity={0.8}
              >
                <Feather
                  name="image"
                  size={10}
                  color={mediaTab === "images" ? T.ink : T.white}
                />
                <Text style={[s.mTabTxt, mediaTab === "images" && s.mTabTxtOn]}>
                  {t("propertyCard.photos", "Photos")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.mTab, mediaTab === "video" && s.mTabOn]}
                onPress={() => setMediaTab("video")}
                activeOpacity={0.8}
              >
                <Feather
                  name="play"
                  size={10}
                  color={mediaTab === "video" ? T.ink : T.white}
                />
                <Text style={[s.mTabTxt, mediaTab === "video" && s.mTabTxtOn]}>
                  {t("propertyCard.video", "Video")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <AnimHeart
            isFav={resolvedFav}
            onPress={handleFav}
            loading={listingKind === "sale" ? saleWishlist.isPending : false}
          />
        </View>

        {isSold && (
          <SoldPropertyTractionPoster
            variant="card"
            cardPlacement="inline"
            soldAtIso={soldAtIso}
          />
        )}

        {/* Content Area */}
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={handlePress}
          style={s.content}
        >
          {/* Title */}
          <Text style={s.title} numberOfLines={2}>
            {property.title}
          </Text>
          {typeLabel ? (
            <Text style={s.typeLabel} numberOfLines={1}>
              {typeLabel}
            </Text>
          ) : null}

          {/* Price Row with Unit Price */}
          <View style={s.priceRow}>
            <Text
              style={[s.price, isSold && { opacity: 0.82 }]}
              numberOfLines={1}
            >
              {formatPriceMRU(price)}
              <Text style={s.priceUnit}> MRU</Text>
            </Text>
            {unitPrice && (
              <Text style={s.unitPrice}>
                {t("propertyCard.unitPricePerSqm", "~{{price}} MRU/m²", {
                  price: unitPrice.toLocaleString()
                })}
              </Text>
            )}
            {isSold && (
              <View style={s.soldInlinePill}>
                <Text style={s.soldInlinePillText}>
                  {t("propertyCard.sold", "Sold")}
                </Text>
              </View>
            )}
          </View>

          {/* Specs Row */}
          {(property.bedrooms || property.bathrooms || area > 0) && (
            <View style={s.specsRow}>
              {property.bedrooms != null && property.bedrooms !== 0 && (
                <>
                  <Text style={s.specTxt}>
                    <Text style={s.specNum}>{property.bedrooms}</Text>
                    {t("propertyCard.specBedSuffix", " bd")}
                  </Text>
                  <SpecDot />
                </>
              )}
              {property.bathrooms != null && property.bathrooms !== 0 && (
                <>
                  <Text style={s.specTxt}>
                    <Text style={s.specNum}>{property.bathrooms}</Text>
                    {t("propertyCard.specBathSuffix", " ba")}
                  </Text>
                  <SpecDot />
                </>
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {area > 0 && (
                  <Text style={s.specTxt}>
                    <Text style={s.specNum}>{area.toLocaleString()}</Text> m²
                  </Text>
                )}
                {property.year_built && (
                  <View style={s.featurePill}>
                    <MaterialIcons
                      name="calendar-today"
                      size={10}
                      color={T.inkSoft}
                    />
                    <Text style={s.featureText}>
                      {t("propertyCard.builtYear", "Built {{year}}", {
                        year: property.year_built
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Feature Highlights */}
          <View style={s.featureRow}>
            {property.floor && property.total_floors && (
              <View style={s.featurePill}>
                <MaterialIcons name="elevator" size={10} color={T.inkSoft} />
                <Text style={s.featureText}>
                  {t("propertyCard.floorOfTotal", "{{floor}}/{{total}} fl", {
                    floor: property.floor,
                    total: property.total_floors
                  })}
                </Text>
              </View>
            )}
            {property.orientation && (
              <View style={s.featurePill}>
                <MaterialIcons name="compass" size={10} color={T.inkSoft} />
                <Text style={s.featureText}>
                  {localizeOrientation(property.orientation, t)}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {property.description && (
            <Text style={s.desc} numberOfLines={2}>
              {property.description}
            </Text>
          )}

          {/* Location */}
          {location.length > 0 && (
            <View style={s.addrRow}>
              <Feather name="map-pin" size={12} color={T.inkMuted} />
              <Text style={s.addrText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          {/* Validation banner */}
          {property.validation_text && (
            <View style={s.validBar}>
              <View style={s.validAccent} />
              <MaterialIcons
                name="verified"
                size={13}
                color={T.green}
                style={{ marginRight: 6 }}
              />
              <Text style={s.validTxt} numberOfLines={1}>
                {property.validation_text}
              </Text>
            </View>
          )}

          {/* Legal Documents Strip */}
          {paperItems.length > 0 && (
            <View style={s.papersStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.papersScrollContent}
                style={s.papersScroll}
              >
                {paperItems.map((item, index) => (
                  <View
                    key={`${item.canonicalKey}-${item.label}-${index}`}
                    style={s.paperPill}
                  >
                    <Text style={s.paperPillText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ===== EXPLANATORY TABLE (Embedded) ===== */}
          {(property.nearby_metro ||
            property.nearby_school ||
            feeTableRows.length > 0) && (
            <InfoTable
              title={t("propertyCard.feesSectionTitle", "Fee breakdown")}
              data={feeTableRows}
            />
          )}

          {/* ===== BUTTON GROUP with Parent Background ===== */}
          <ButtonGroup>
            <ActionButton
              icon={<Feather name="mail" size={13} color="#FFF" />}
              label={t("propertyCard.emailInquiry", "Email")}
              onPress={handleEmail}
              variant="primary"
            />
            <ActionButton
              icon={<Feather name="phone" size={13} color="#FFF" />}
              label={t("propertyCard.phoneCall", "Call")}
              onPress={handleCall}
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
              onPress={handleWa}
              variant="whatsapp"
            />
          </ButtonGroup>

          {/* TEMPORARY COMMENTED Organization Footer */}
          {/* {property.organization?.name && (
            <View style={s.orgFooter}>
              <MaterialIcons name="business" size={12} color={T.inkMuted} />
              <Text style={s.orgText} numberOfLines={1}>
                {property.organization.name}
              </Text>
              <MaterialIcons name="verified" size={12} color="#10B981" />
            </View>
          )} */}
        </TouchableOpacity>
      </View>

      {/* Video Modal */}
      {videoUrl && modalVisible && (
        <VideoModal
          visible={modalVisible}
          videoUrl={videoUrl}
          title={property.title ?? ""}
          onClose={closeModal}
        />
      )}
    </>
  );
};

// ============================================================
// Styles - Chinese Real Estate App Aesthetic
// ============================================================

const s = StyleSheet.create({
  card: {
    width: "100%",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 0,
    backgroundColor: "#FFF"
  },
  imgBox: {
    height: IMAGE_H,
    width: "100%",
    backgroundColor: "#EEF0F3",
    position: "relative",
    overflow: "hidden",
    borderRadius: 10
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    gap: 6
  },
  placeholderText: { fontSize: 12, color: T.inkMuted, fontWeight: "500" },
  badgesRow: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    zIndex: 2,
    maxWidth: "80%"
  },
  goodDealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: T.brand
  },
  goodDealBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.2
  },
  mediaTabs: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.46)",
    borderRadius: 20,
    padding: 2,
    gap: 2,
    zIndex: 2
  },
  mTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20
  },
  mTabOn: { backgroundColor: T.white },
  mTabTxt: { fontSize: 10, fontWeight: "600", color: T.white },
  mTabTxtOn: { color: T.ink },
  papersStrip: {
    paddingVertical: 5,
    marginBottom: 8
  },
  papersScroll: {},
  papersScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4
  },
  paperPill: {
    maxWidth: 148,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#EEE"
  },
  paperPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1A1A1A",
    flexShrink: 1
  },
  content: {
    paddingBottom: 14,
    paddingHorizontal: 5,
    paddingVertical: 8
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: T.ink,
    marginBottom: 6,
    lineHeight: 22
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: T.inkSoft,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
    flexWrap: "wrap",
    gap: 6
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: T.brand,
    letterSpacing: -0.5
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: T.inkSoft
  },
  unitPrice: {
    fontSize: 11,
    fontWeight: "500",
    color: T.inkSoft,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  soldInlinePill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "rgba(22,101,52,0.12)",
    borderWidth: 0.5,
    borderColor: "rgba(22,101,52,0.35)"
  },
  soldInlinePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#14532D"
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 2
  },
  specTxt: { fontSize: 13, color: T.inkSoft, fontWeight: "500" },
  specNum: { fontSize: 13, color: T.ink, fontWeight: "700" },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  featureText: {
    fontSize: 11,
    color: T.inkSoft,
    fontWeight: "500"
  },
  desc: { fontSize: 13, color: T.inkSoft, lineHeight: 18, marginBottom: 6 },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8
  },
  addrText: { fontSize: 12, color: T.inkMuted, flex: 1 },
  validBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.greenBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.greenBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    overflow: "hidden"
  },
  validAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: T.green
  },
  validTxt: { fontSize: 11, color: "#15803D", fontWeight: "500", flex: 1 },
  orgFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: T.border
  },
  orgText: {
    fontSize: 11,
    color: T.inkSoft,
    fontWeight: "500",
    flex: 1
  }
});

// Re-export skeleton
export { ZillowStylePropertyCardSkeleton } from "../screens/components/ZillowStylePropertyCardOptimized";
export default ZillowStylePropertyCard;
