// ─────────────────────────────────────────────
// VideoFeedScreen.tsx  — Production-grade vertical video feed
//
// ARCHITECTURE (spec compliance):
//  1.  FlashList — pagingEnabled, snapToInterval, decelerationRate=fast
//  2.  onViewableItemsChanged → dominant visible index (viewabilityConfig)
//  3.  Streaming-first: CDN/S3 over HTTPS/HLS via resolveStreamUri (no feed disk cache)
//  4.  Thumbnail prefetch (Image.prefetch) + decoder mount only in preload window (or always when active)
//  5.  Cursor pagination; videoPreloadService tracks buffer metadata only when streaming
//  6.  Off-window native players: unloadAsync via videoPreloadManager.releaseBuffer
//  7.  VideoCard: memo, blur poster until first frame — no loading spinners
// ─────────────────────────────────────────────

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
  Image,
  InteractionManager,
} from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { Text } from "@ui-kitten/components";
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Audio, Video, ResizeMode } from "expo-av";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { FadersHorizontalIcon } from "phosphor-react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";

import VideoCard from "../components/VideoCard";
import { ProfileSheet } from "../components/ProfileSheet";
import { prefetchProfileData } from "../hooks/useProfileSheet";
import type { FeedProfileContext } from "../hooks/Videofeedtypes";
import { warmPropertySaleDetailNavigation } from "../services/propertySaleFetch";
import {
  videoPreloadManager,
  PRELOAD_AHEAD,
  PRELOAD_BEHIND,
} from "../hooks/Videopreloadmanager";
import { videoPreloadService } from "../services/videoPreloadService";
import {
  warmFeedPlayback,
  cancelExceptVideoIds,
} from "../services/videoSegmentPrefetch";
import { getStreamingProfile } from "../utils/deviceStreamingProfile";
import {
  resolveFeedPlaybackUri,
  feedPosterPrefetchUris,
  resolveProgressiveMp4Uri,
  feedPreferLocalFirst,
} from "../config/videoPlayback";
import { useVideoPlayback } from "../hooks/Usevideoplayback";
import { useVideoFeed, getStableId } from "../hooks/usevideofeed";

import {
  useLikePropertySaleVideoMutation,
  useUnlikePropertySaleVideoMutation,
  useSavePropertySaleVideoMutation,
  useUnsavePropertySaleVideoMutation,
} from "../hooks/mutations/usePropertySaleVideoMutations";
import {
  useLikeVideoMutation,
  useUnlikeVideoMutation,
  useSaveVideoMutation,
  useUnsaveVideoMutation,
} from "../hooks/mutations/useVideoMutations";
import {
  useLikeLandmarkVideoMutation,
  useUnlikeLandmarkVideoMutation,
  useSaveLandmarkVideoMutation,
  useUnsaveLandmarkVideoMutation,
} from "../hooks/mutations/useLandmarkVideoMutations";
import {
  useReportVideoMutation,
  useHideVideoMutation,
} from "../hooks/mutations/useVideoReporting";
import { useAccumulatedVideos } from "../hooks/queries/useCursorVideoFeed";
import { useVideoViewTracking } from "../hooks/useVideoViewTracking";
import { useUser } from "../hooks/useUser";
import { useConnectivityContext } from "../contexts/ConnectivityContext";
import { useLanguage } from "../contexts/LanguageContext";

import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { FeedTab, FeedVideo } from "../hooks/Videofeedtypes";
import {
  type FeedFilter,
  FEED_FILTER_OPTIONS,
  feedFilterDefaultLabel,
  feedFilterLabelKey,
  filterUnifiedFeed,
  interleaveUnifiedFeed,
  resolveFeedKind,
  spreadSameListingClips,
} from "../utils/videoFeedMerge";
import { clearFeedVideoSurfaceRevealed } from "../services/videoPlaybackMetrics";
import Toast from "../components/CustomToast";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const { height, width } = Dimensions.get("window");
const PAGE_HEIGHT = height - 80; // above bottom tabs

/** One discovery card per calendar day max (soft cap; in-memory). */
const VIDEO_FEED_DISCOVERY = {
  dayKey: "",
  saleToRentUsed: false,
  rentToLandUsed: false,
};

function discoveryDayReset() {
  const d = new Date().toDateString();
  if (VIDEO_FEED_DISCOVERY.dayKey !== d) {
    VIDEO_FEED_DISCOVERY.dayKey = d;
    VIDEO_FEED_DISCOVERY.saleToRentUsed = false;
    VIDEO_FEED_DISCOVERY.rentToLandUsed = false;
  }
}

export type VideoDiscoveryMarker = {
  __discovery: true;
  kind: "sale-to-rent" | "rent-to-land";
};

export type VideoFeedListRow = FeedVideo | VideoDiscoveryMarker;

export function isVideoDiscoveryRow(
  row: VideoFeedListRow,
): row is VideoDiscoveryMarker {
  return (row as VideoDiscoveryMarker).__discovery === true;
}

/** 0-based index of the current video within `videos` from a vertical list index. */
export function listRowToVideoIndex(
  rows: VideoFeedListRow[],
  listIndex: number,
): number {
  let v = -1;
  const end = Math.min(listIndex, rows.length - 1);
  for (let i = 0; i <= end; i++) {
    if (!isVideoDiscoveryRow(rows[i]!)) v++;
  }
  return Math.max(0, v);
}

function pickPreviewVideos(source: FeedVideo[], take: number): FeedVideo[] {
  const out: FeedVideo[] = [];
  for (const v of source) {
    if (out.length >= take) break;
    const thumb =
      v.thumbnailURL ??
      v.thumbnail_url ??
      v.property?.images?.[0] ??
      v.propertySale?.images?.[0] ??
      v.landmark?.images?.[0];
    if (thumb) out.push(v);
  }
  return out.slice(0, take);
}

const DISCOVERY_INSERT_INDEX = 4; // after 4th video (0-based: slot after index 3)

/** Editorial palette: matches feed black, single brand accent, minimal chrome. */
const DISCOVERY_UI = {
  bg: "#000000",
  surface: "#141414",
  hairline: "rgba(255,255,255,0.09)",
  text: "#F5F5F5",
  muted: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.38)",
  accent: "#D16024",
  gridGap: 10,
} as const;

type VideoDiscoverySlideProps = {
  title: string;
  subtitle: string;
  previews: FeedVideo[];
  onDiscover: () => void;
  onOpenHome?: () => void;
  onDismiss: () => void;
};

const VideoDiscoverySlide = ({
  title,
  subtitle,
  previews,
  onDiscover,
  onOpenHome,
  onDismiss,
}: VideoDiscoverySlideProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(12)).current;
  const cardsScaleAnim = useRef(new Animated.Value(0.98)).current;

  const horizontalPad = Math.max(insets.left, insets.right, 20);
  const cardWidth = useMemo(
    () => (width - horizontalPad * 2 - DISCOVERY_UI.gridGap) / 2,
    [horizontalPad],
  );
  const cardHeight = useMemo(() => cardWidth * 1.22, [cardWidth]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardsScaleAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim, cardsScaleAnim]);

  const contentPad = {
    paddingTop: Math.max(insets.top, 10) + 4,
    paddingBottom: Math.max(insets.bottom, 14) + 6,
    paddingLeft: horizontalPad,
    paddingRight: horizontalPad,
  };

  return (
    <View style={discoveryStyles.page}>
      <Animated.View
        style={[
          discoveryStyles.container,
          contentPad,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        <View style={discoveryStyles.header}>
          <TouchableOpacity
            style={discoveryStyles.closeBtn}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={t("video.discoveryDismiss", "Dismiss")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="close" size={22} color={DISCOVERY_UI.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={discoveryStyles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
          contentContainerStyle={discoveryStyles.scrollContent}
        >
          <Text style={discoveryStyles.badge}>
            {t("video.discoveryBadge", "Suggested")}
          </Text>
          <Text style={discoveryStyles.title}>{title}</Text>
          <Text
            style={[
              discoveryStyles.subtitle,
              { maxWidth: width - horizontalPad * 2 },
            ]}
          >
            {subtitle}
          </Text>

          <View style={discoveryStyles.cardGridContainer}>
            <Animated.View
              style={[
                discoveryStyles.cardGrid,
                {
                  gap: DISCOVERY_UI.gridGap,
                  transform: [{ scale: cardsScaleAnim }],
                },
              ]}
            >
              {previews.slice(0, 4).map((v, i) => {
                const uri =
                  v.thumbnailURL ??
                  v.thumbnail_url ??
                  v.property?.images?.[0] ??
                  v.propertySale?.images?.[0] ??
                  v.landmark?.images?.[0] ??
                  "";

                return (
                  <View
                    key={`card-${String(v.ID)}-${i}`}
                    style={[
                      discoveryStyles.gridCard,
                      { width: cardWidth, height: cardHeight },
                    ]}
                  >
                    {uri ? (
                      <Image
                        source={{ uri }}
                        style={discoveryStyles.gridCardImage}
                      />
                    ) : (
                      <View style={discoveryStyles.gridCardPlaceholder} />
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.45)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={discoveryStyles.gridCardOverlay}
                    />
                  </View>
                );
              })}
            </Animated.View>
          </View>
        </ScrollView>

        <View style={discoveryStyles.ctaSection}>
          <TouchableOpacity
            style={discoveryStyles.discoverBtn}
            onPress={onDiscover}
            activeOpacity={0.88}
          >
            <Text style={discoveryStyles.discoverBtnText}>
              {t("video.discoveryCta", "Explore now")}
            </Text>
          </TouchableOpacity>

          {onOpenHome ? (
            <TouchableOpacity
              style={discoveryStyles.secondaryBtn}
              onPress={onOpenHome}
              activeOpacity={0.85}
            >
              <Text style={discoveryStyles.secondaryBtnText}>
                {t("video.discoveryOpenHome", "View at home")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
};

const discoveryStyles = StyleSheet.create({
  page: {
    height: PAGE_HEIGHT,
    width,
    overflow: "hidden",
    backgroundColor: DISCOVERY_UI.bg,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DISCOVERY_UI.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DISCOVERY_UI.hairline,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 12,
  },
  badge: {
    alignSelf: "flex-start",
    color: DISCOVERY_UI.faint,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    color: DISCOVERY_UI.text,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: DISCOVERY_UI.muted,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    marginBottom: 22,
  },
  cardGridContainer: {
    marginTop: 4,
    marginBottom: 22,
    borderRadius: 14,
    overflow: "hidden",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: DISCOVERY_UI.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DISCOVERY_UI.hairline,
  },
  gridCardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: DISCOVERY_UI.surface,
  },
  gridCardPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: DISCOVERY_UI.surface,
  },
  gridCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaSection: {
    gap: 10,
    paddingTop: 4,
  },
  discoverBtn: {
    borderRadius: 14,
    backgroundColor: DISCOVERY_UI.accent,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DISCOVERY_UI.hairline,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: DISCOVERY_UI.text,
    fontSize: 15,
    fontWeight: "500",
  },
});

/**
 * VIEWABILITY = viewport / lazy policy (same role as FlatList onViewableItemsChanged).
 * Drives active index → only the active row autoplays; VideoCard uses mountDecoder so
 * native decoders mount only in the preload window (streaming + expo-blur placeholder).
 *
 * Must stay a stable reference — FlashList throws if this object is recreated each render.
 */
/** ~50% visible before switching active clip — TikTok-style snap handoff */
const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 80,
} as const;

// Lightweight skeleton card shown while the very first page is loading.
// Avoids showing a bare spinner – user sees a “lazy video card” placeholder instead.
const VideoSkeleton = () => (
  <View style={styles.page}>
    <Animated.View style={styles.videoSkeleton} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// VideoFeedScreen
// ─────────────────────────────────────────────────────────────────────────────
export const VideoFeedScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const connectivity = useConnectivityContext();
  const connectivityRef = useRef(connectivity);
  connectivityRef.current = connectivity;
  const { currentLanguage } = useLanguage();
  const langParam = (currentLanguage ?? "en").toLowerCase();
  const isFocused = useIsFocused();

  // ── Unified feed filter (one tab, filter chips at top) ─────────────────
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const feedFilterRef = useRef<FeedFilter>("all");
  useEffect(() => {
    feedFilterRef.current = feedFilter;
  }, [feedFilter]);

  // ── Misc UI state ──────────────────────────────────────────────────────────
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [reportVideoId, setReportVideoId] = useState<number | null>(null);
  const prevVideosLengthRef = useRef(0);

  // ── ProfileSheet state ─────────────────────────────────────────────────────
  const profileSheetRef = useRef<BottomSheetModal>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<
    number | string | null
  >(null);
  const [profilePreview, setProfilePreview] =
    useState<FeedProfileContext | null>(null);
  const queryClient = useQueryClient();
  const { clearUnseenBadge } = useVideoViewTracking();
  const badgeClearedRef = useRef(false);

  const handleProfilePress = useCallback(
    (ctx: FeedProfileContext) => {
      prefetchProfileData(queryClient, ctx.profileUserId, ctx);
      setSelectedProfileUserId(ctx.profileUserId);
      setProfilePreview(ctx);
      requestAnimationFrame(() => {
        profileSheetRef.current?.present();
      });
    },
    [queryClient],
  );

  const handleCloseProfileSheet = useCallback(() => {
    profileSheetRef.current?.dismiss();
  }, []);

  const handleProfileSheetDismissed = useCallback(() => {
    setSelectedProfileUserId(null);
    setProfilePreview(null);
  }, []);

  // ── Data fetching (active tab first — others deferred) ─────────────────────
  const {
    videos: saleVideos,
    isLoading: saleLoading,
    isError: saleIsError,
    refetch: refetchSale,
    fetchNextPage: fetchNextSale,
    hasNextPage: hasNextSale,
    isFetchingNextPage: fetchingNextSale,
  } = useAccumulatedVideos(
    "sale",
    langParam,
    undefined,
    connectivity.feedQuality,
    { enabled: true },
  );

  const {
    videos: rentVideos,
    isLoading: rentLoading,
    isError: rentIsError,
    refetch: refetchRent,
    fetchNextPage: fetchNextRent,
    hasNextPage: hasNextRent,
    isFetchingNextPage: fetchingNextRent,
  } = useAccumulatedVideos(
    "rent",
    langParam,
    undefined,
    connectivity.feedQuality,
    { enabled: true },
  );

  const {
    videos: landmarkVideos,
    isLoading: landmarkLoading,
    isError: landmarkIsError,
    refetch: refetchLandmark,
    fetchNextPage: fetchNextLandmark,
    hasNextPage: hasNextLandmark,
    isFetchingNextPage: fetchingNextLandmark,
  } = useAccumulatedVideos(
    "landmarks",
    langParam,
    undefined,
    connectivity.feedQuality,
    { enabled: true },
  );

  const mergedVideos = useMemo(
    () =>
      interleaveUnifiedFeed(
        saleVideos ?? [],
        rentVideos ?? [],
        landmarkVideos ?? [],
      ),
    [saleVideos, rentVideos, landmarkVideos],
  );

  // Land slideshow jobs finish async — refresh landmark feed until clips appear.
  useEffect(() => {
    const landCount = mergedVideos.filter(
      (v) => resolveFeedKind(v) === "landmarks",
    ).length;
    if (landCount > 0) return;
    const timer = setInterval(() => {
      void refetchLandmark();
    }, 25_000);
    return () => clearInterval(timer);
  }, [mergedVideos, refetchLandmark]);

  const videos = useMemo(() => {
    const filtered = filterUnifiedFeed(mergedVideos, feedFilter);
    return spreadSameListingClips(filtered);
  }, [mergedVideos, feedFilter]);

  const feedRows = videos;

  // ── Frontend debug: log feed order (video IDs) ─────────────────────────
  // Lets you verify whether reloads cause shuffle/rotation.
  const debugVideoPrevLenRef = useRef(0);
  const debugVideoHeadId = videos[0] ? getStableId(videos[0]) : 0;
  useEffect(() => {
    const ids = videos.map((v) => getStableId(v)).filter((n) => n > 0);
    if (ids.length === 0) return;

    const prevLen = debugVideoPrevLenRef.current;
    const headId = ids[0];

    if (prevLen === 0) {
      console.log(
        `[VideoFeedScreen] initial filter=${feedFilter} ids(${ids.length}):`,
        ids.slice(0, 12),
      );
    } else if (ids.length > prevLen) {
      console.log(
        `[VideoFeedScreen] appended filter=${feedFilter} (${prevLen} -> ${ids.length}) appended:`,
        ids.slice(prevLen, prevLen + 12),
      );
    } else if (debugVideoHeadId !== headId) {
      // In practice this branch is mostly theoretical because headId is in deps,
      // but it helps keep the intent explicit.
      console.log(
        `[VideoFeedScreen] reshuffle filter=${feedFilter} head: ${debugVideoHeadId} -> ${headId}`,
        "headIds:",
        ids.slice(0, 12),
      );
    } else if (ids.length === prevLen) {
      console.log(
        `[VideoFeedScreen] same-length filter=${feedFilter} head=${headId} headIds:`,
        ids.slice(0, 12),
      );
    }

    debugVideoPrevLenRef.current = ids.length;
  }, [feedFilter, videos.length, debugVideoHeadId]);

  const isLoading =
    videos.length === 0 &&
    (saleLoading || rentLoading || landmarkLoading);

  const feedIsError =
    feedFilter === "rent"
      ? rentIsError
      : feedFilter === "land"
        ? landmarkIsError
        : feedFilter === "sale"
          ? saleIsError
          : saleIsError && rentIsError && landmarkIsError;

  const refetchActiveFeed = useCallback(() => {
    void refetchSale();
    void refetchRent();
    void refetchLandmark();
  }, [refetchSale, refetchRent, refetchLandmark]);

  const fetchNextPage = useCallback(() => {
    const f = feedFilterRef.current;
    if (f === "all") {
      if (hasNextSale) void fetchNextSale();
      if (hasNextRent) void fetchNextRent();
      if (hasNextLandmark) void fetchNextLandmark();
      return;
    }
    if (f === "rent") {
      if (hasNextRent) void fetchNextRent();
      return;
    }
    if (f === "land") {
      if (hasNextLandmark) void fetchNextLandmark();
      return;
    }
    if (hasNextSale) void fetchNextSale();
  }, [
    fetchNextSale,
    fetchNextRent,
    fetchNextLandmark,
    hasNextSale,
    hasNextRent,
    hasNextLandmark,
  ]);

  const hasNextPage =
    feedFilter === "all"
      ? Boolean(hasNextSale || hasNextRent || hasNextLandmark)
      : feedFilter === "rent"
        ? hasNextRent
        : feedFilter === "land"
          ? hasNextLandmark
          : hasNextSale;

  const isFetchingNextPage =
    feedFilter === "all"
      ? fetchingNextSale || fetchingNextRent || fetchingNextLandmark
      : feedFilter === "rent"
        ? fetchingNextRent
        : feedFilter === "land"
          ? fetchingNextLandmark
          : fetchingNextSale;

  // ── Video refs ─────────────────────────────────────────────────────────────
  /**
   * videoRefs is indexed by list position.
   * It is NOT reset on re-renders — only on tab change.
   * This is critical for scroll-back instant playback.
   */
  const videoRefs = useRef<Array<any>>([]);
  const setVideoRef = useCallback(
    (index: number) => (ref: any) => {
      videoRefs.current[index] = ref;
    },
    [],
  );

  // ── Active index tracking ──────────────────────────────────────────────────
  const activeIndexRef = useRef(0);
  const pausedIndicesRef = useRef(new Set<number>());
  const [pauseRevision, setPauseRevision] = useState(0);
  const isPausedAtIndex = useCallback(
    (index: number) => pausedIndicesRef.current.has(index),
    [pauseRevision],
  );
  const setUserPausedAt = useCallback((index: number, paused: boolean) => {
    const set = pausedIndicesRef.current;
    if (paused) set.add(index);
    else set.delete(index);
    const ref = videoRefs.current[index];
    if (paused && ref) {
      ref.pauseAsync?.().catch(() => {});
      ref.setIsMutedAsync?.(true).catch(() => {});
    }
    setPauseRevision((n) => n + 1);
  }, []);
  const [activeIndex, setActiveIndex] = useState(0); // UI state for re-renders
  const flashListRef = useRef<FlashListRef<VideoFeedListRow> | null>(null);
  /** Reset on tab change; avoids FlashList starting with a non-zero offset above index 0 */
  const didInitialScrollRef = useRef(false);
  const isScreenFocused = useRef(isFocused);
  useEffect(() => {
    isScreenFocused.current = isFocused;
  }, [isFocused]);

  // ── Playback engine ────────────────────────────────────────────────────────
  const { onIndexChange, pauseAllNow, playAt } = useVideoPlayback({
    videoRefs,
    activeIndexRef,
    isMuted: muted,
    isScreenFocused,
    shouldAutoplay: connectivity.shouldAutoplayVideo,
    isPausedAtIndex,
  });

  // ── Feed state (likes, saves, pagination) ──────────────────────────────────
  const {
    isLiked,
    isSaved,
    getLikesCount,
    getSavesCount,
    toggleLike,
    toggleSave,
    maybeLoadMore,
  } = useVideoFeed(
    feedFilter,
    videos,
    isLoading,
    fetchNextPage,
    hasNextPage ?? false,
    isFetchingNextPage,
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const likeRent = useLikeVideoMutation();
  const unlikeRent = useUnlikeVideoMutation();
  const saveRent = useSaveVideoMutation();
  const unsaveRent = useUnsaveVideoMutation();
  const likeSale = useLikePropertySaleVideoMutation();
  const unlikeSale = useUnlikePropertySaleVideoMutation();
  const saveSale = useSavePropertySaleVideoMutation();
  const unsaveSale = useUnsavePropertySaleVideoMutation();
  const likeLandmark = useLikeLandmarkVideoMutation();
  const unlikeLandmark = useUnlikeLandmarkVideoMutation();
  const saveLandmark = useSaveLandmarkVideoMutation();
  const unsaveLandmark = useUnsaveLandmarkVideoMutation();
  const reportMutation = useReportVideoMutation();
  const hideMutation = useHideVideoMutation();

  // ── Tab change ─────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (filter: FeedFilter) => {
      if (filter === feedFilterRef.current) return;
      pauseAllNow();
      pausedIndicesRef.current.clear();
      setPauseRevision((n) => n + 1);
      videoRefs.current = [];
      activeIndexRef.current = 0;
      setActiveIndex(0);
      didInitialScrollRef.current = false;
      clearFeedVideoSurfaceRevealed();
      feedFilterRef.current = filter;
      setFeedFilter(filter);
    },
    [pauseAllNow],
  );

  // ── Screen focus/blur ──────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const idx = activeIndexRef.current;
      if (
        connectivity.shouldAutoplayVideo &&
        !pausedIndicesRef.current.has(idx)
      ) {
        setTimeout(() => playAt(idx), 150);
      }

      // Clear unseen badge after feed paint — never block tab navigation with mark-all-viewed.
      if (!badgeClearedRef.current) {
        const task = InteractionManager.runAfterInteractions(() => {
          badgeClearedRef.current = true;
          void clearUnseenBadge();
        });
        return () => {
          task.cancel();
          pauseAllNow();
        };
      }

      return () => {
        pauseAllNow();
      };
    }, [pauseAllNow, playAt, connectivity.shouldAutoplayVideo, clearUnseenBadge]),
  );

  // ── Audio mode (play in silent mode on iOS) ────────────────────────────────
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    }).catch(() => {});
  }, []);

  // Good Wi‑Fi/LTE → CDN first; slow networks → disk first.
  useEffect(() => {
    videoPreloadService.setNetworkPolicy(
      feedPreferLocalFirst(connectivity.connectionQuality)
        ? "local-first"
        : "cdn-first",
    );
  }, [connectivity.connectionQuality]);

  // ── videoPreloadService: init, setCurrentIndex, appendVideos ───────────────
  useEffect(() => {
    if (!videos.length) return;
    const prevLen = prevVideosLengthRef.current;
    if (prevLen === 0) {
      videoPreloadService.initialize(videos);
    } else if (videos.length > prevLen) {
      videoPreloadService.appendVideos(videos.slice(prevLen));
    }
    prevVideosLengthRef.current = videos.length;
    const warm = Math.min(6, videos.length);
    for (let i = 0; i < warm; i++) {
      const row = videos[i];
      if (row?.ID != null) {
        videoPreloadService.ensureVideo(row.ID);
      }
    }
  }, [videos]);

  useEffect(() => {
    if (!videos.length) return;
    const vi = listRowToVideoIndex(feedRows, activeIndex);
    videoPreloadService.setCurrentIndex(Math.min(vi, videos.length - 1));
  }, [activeIndex, videos.length, feedRows]);

  useEffect(() => {
    prevVideosLengthRef.current = 0;
    videoPreloadService.clear();
  }, [feedFilter]);

  // Ensure list starts at first video on initial load (not on pagination).
  // FlashList enables maintainVisibleContentPosition by default; that can leave
  // a wrong offset so users can scroll "above" index 0 — disable it for this feed.
  const scrollFeedToTop = useCallback(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
    const list = flashListRef.current;
    if (!list) return;
    list.scrollToOffset({ offset: 0, animated: false });
  }, []);

  useLayoutEffect(() => {
    if (didInitialScrollRef.current) return;
    if (isLoading || videos.length === 0) return;
    didInitialScrollRef.current = true;
    scrollFeedToTop();
    requestAnimationFrame(() => {
      scrollFeedToTop();
      requestAnimationFrame(() => scrollFeedToTop());
    });
    const t = setTimeout(scrollFeedToTop, 50);
    return () => clearTimeout(t);
  }, [feedFilter, isLoading, videos.length, scrollFeedToTop]);

  const handleFlashListLoad = useCallback(() => {
    if (!videos.length) return;
    scrollFeedToTop();
    requestAnimationFrame(() => scrollFeedToTop());
  }, [videos.length, scrollFeedToTop]);

  // ── Thumbnail prefetch (proactive, no blocking) ────────────────────────────
  useEffect(() => {
    if (!videos.length || !feedRows.length) return;
    const ahead = Math.max(PRELOAD_AHEAD, connectivity.prefetchDistance + 1);
    const lo = Math.max(0, activeIndex - PRELOAD_BEHIND);
    const hi = Math.min(feedRows.length - 1, activeIndex + ahead);
    for (let i = lo; i <= hi; i++) {
      const row = feedRows[i];
      if (!row || isVideoDiscoveryRow(row)) continue;
      const urls = feedPosterPrefetchUris(row);
      for (const url of urls) {
        if (url) videoPreloadManager.prefetchThumbnail(url);
      }
    }
  }, [activeIndex, videos, feedRows, connectivity.prefetchDistance]);

  // Always warm first chunks as soon as feed data arrives.
  useEffect(() => {
    if (!videos.length) return;
    const q = connectivity.connectionQuality;
    const warmCount = Math.min(5, videos.length);
    for (let i = 0; i < warmCount; i++) {
      const row = videos[i];
      if (!row) continue;
      const any = row as unknown as Record<string, unknown>;
      const playback = resolveFeedPlaybackUri(any, q);
      if (!playback) continue;
      const mp4 = resolveProgressiveMp4Uri(any, q);
      warmFeedPlayback(String(row.ID ?? getStableId(row)), playback, q, mp4);
    }
  }, [videos, connectivity.connectionQuality]);

  // ── Chunk prefetch for visible window (always — not gated on connectivity flag)
  const lastScrollJumpRef = useRef({ index: 0, at: 0 });
  useEffect(() => {
    if (!videos.length || !feedRows.length) return;

    const now = Date.now();
    const prev = lastScrollJumpRef.current;
    const jumped = Math.abs(activeIndex - prev.index);
    lastScrollJumpRef.current = { index: activeIndex, at: now };

    const profile = getStreamingProfile(connectivity.connectionQuality);
    const ahead = profile.prefetchAhead;
    const behind = profile.prefetchBehind;
    const q = connectivity.connectionQuality;

    const indices: number[] = [activeIndex];
    for (let d = 1; d <= ahead; d++) indices.push(activeIndex + d);
    for (let d = 1; d <= behind; d++) indices.push(activeIndex - d);

    const keepIds: string[] = [];
    for (const i of indices) {
      if (i < 0 || i >= feedRows.length) continue;
      const row = feedRows[i];
      if (!row || isVideoDiscoveryRow(row)) continue;
      const any = row as unknown as Record<string, unknown>;
      const playback = resolveFeedPlaybackUri(any, q);
      if (!playback) continue;
      const vid = String(row.ID ?? getStableId(row as FeedVideo));
      const mp4 = resolveProgressiveMp4Uri(any, q);
      warmFeedPlayback(vid, playback, q, mp4);
      keepIds.push(vid);
    }

    if (jumped > 1 && now - prev.at < 400) {
      cancelExceptVideoIds(keepIds);
    }
  }, [
    activeIndex,
    videos.length,
    feedRows,
    connectivity.connectionQuality,
  ]);

  // ── Memory: pause near-window players; unload only far outside ±4 ─────────
  useEffect(() => {
    if (!videos.length) return;
    const behind =
      connectivity.connectionQuality === "poor" ? 0 : PRELOAD_BEHIND;
    const ahead = connectivity.prefetchDistance;
    const [mountLo, mountHi] = videoPreloadManager.getMountedRangeFlexible(
      activeIndex,
      feedRows.length,
      ahead,
      behind,
    );
    const unloadBehind = behind + 2;
    const unloadAhead = ahead + 2;
    const unloadLo = Math.max(0, activeIndex - unloadBehind);
    const unloadHi = Math.min(feedRows.length - 1, activeIndex + unloadAhead);

    videoRefs.current.forEach((ref, i) => {
      if (!ref) return;
      if (i < unloadLo || i > unloadHi) {
        videoPreloadManager.releaseDecoder(ref);
        videoRefs.current[i] = null;
        return;
      }
      if (i < mountLo || i > mountHi) {
        videoPreloadManager.releaseBuffer(ref);
      }
    });
  }, [
    activeIndex,
    feedRows.length,
    connectivity.prefetchDistance,
    connectivity.connectionQuality,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // onViewableItemsChanged — the ONLY source of index changes
  // Must be a stable ref (no inline function) for FlashList
  // ─────────────────────────────────────────────────────────────────────────
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (!viewableItems?.length) return;
      if (!isScreenFocused.current) return;

      // Pick the item with the highest visibility percentage (dominant)
      const dominant = viewableItems.reduce((best, curr) => {
        const bp = best.percentVisible ?? 0;
        const cp = curr.percentVisible ?? 0;
        if (cp > bp) return curr;
        if (cp < bp) return best;
        // Tie-break: prefer lower index (top of feed). Higher index caused "opened on last card" feel.
        return (curr.index ?? 0) < (best.index ?? 0) ? curr : best;
      });

      const newIndex = dominant.index;
      if (newIndex == null) return;

      setActiveIndex(newIndex);
      onIndexChange(newIndex, feedFilterRef.current);

      // Pagination trigger (map list index → video ordinal for cursor feed)
      maybeLoadMore(listRowToVideoIndex(feedRows, newIndex));

      // Warm buffers only when prefetch is allowed (avoid wasted work on 2G / poor)
      const net = connectivityRef.current;
      if (net.shouldPrefetchVideo) {
        const ahead = net.prefetchDistance;
        const toWarm: number[] = [];
        if (ahead >= 1) toWarm.push(newIndex + 1);
        if (ahead >= 2) toWarm.push(newIndex + 2);
        if (net.connectionQuality !== "poor") toWarm.push(newIndex - 1);

        toWarm.forEach((i) => {
          if (i < 0 || i >= feedRows.length || i === newIndex) return;
          const row = feedRows[i];
          if (!row || isVideoDiscoveryRow(row)) return;
          setTimeout(() => {
            videoPreloadManager.warmBuffer(videoRefs.current[i], i, newIndex);
          }, 120);
        });
      }
    },
    [onIndexChange, maybeLoadMore, feedRows, isScreenFocused],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Like handler (tab-aware, optimistic, with auth guard)
  // ─────────────────────────────────────────────────────────────────────────
  const handleLike = useCallback(
    (item: FeedVideo) => {
      if (!user?.accessToken) {
        setToast({
          message: t("video.loginToLike", "Sign in to like videos"),
          type: "info",
        });
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const id = getStableId(item);
      const wasLiked = isLiked(item);
      const kind = resolveFeedKind(item);
      const mutateFn = (() => {
        if (kind === "rent")
          return wasLiked ? unlikeRent.mutateAsync : likeRent.mutateAsync;
        if (kind === "landmarks")
          return wasLiked
            ? unlikeLandmark.mutateAsync
            : likeLandmark.mutateAsync;
        return wasLiked ? unlikeSale.mutateAsync : likeSale.mutateAsync;
      })();
      toggleLike(item, mutateFn);
    },
    [
      user,
      t,
      isLiked,
      toggleLike,
      likeRent.mutateAsync,
      unlikeRent.mutateAsync,
      likeSale.mutateAsync,
      unlikeSale.mutateAsync,
      likeLandmark.mutateAsync,
      unlikeLandmark.mutateAsync,
    ],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Save handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    (item: FeedVideo) => {
      if (!user?.accessToken) {
        setToast({
          message: t("video.loginToSave", "Sign in to save videos"),
          type: "info",
        });
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      const wasS = isSaved(item);
      const mutateFn = (() => {
        const kind = resolveFeedKind(item);
        if (kind === "rent")
          return wasS ? unsaveRent.mutateAsync : saveRent.mutateAsync;
        if (kind === "landmarks")
          return wasS ? unsaveLandmark.mutateAsync : saveLandmark.mutateAsync;
        return wasS ? unsaveSale.mutateAsync : saveSale.mutateAsync;
      })();
      toggleSave(item, mutateFn);
    },
    [
      user,
      t,
      isSaved,
      toggleSave,
      saveRent.mutateAsync,
      unsaveRent.mutateAsync,
      saveSale.mutateAsync,
      unsaveSale.mutateAsync,
      saveLandmark.mutateAsync,
      unsaveLandmark.mutateAsync,
    ],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // renderItem — MUST be a stable function reference.
  // All callbacks are bound at this level, not inline in JSX.
  // VideoCard is memoized and will NOT re-render unless its specific
  // props change (see memo comparator in VideoCard.tsx).
  // ─────────────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: VideoFeedListRow; index: number }) => {
      if (!item || isVideoDiscoveryRow(item) || !item.ID) {
        return <View style={styles.page} />;
      }

      const itemKind = resolveFeedKind(item);
      const stableId = getStableId(item);
      const isActive = index === activeIndex;
      const prefetchAhead = connectivity.prefetchDistance;
      const isPreloaded =
        !isActive &&
        prefetchAhead > 0 &&
        Math.abs(index - activeIndex) <= prefetchAhead;
      const preloadBehind =
        connectivity.connectionQuality === "poor" ? 0 : PRELOAD_BEHIND;
      const inPreloadWindow = videoPreloadManager.shouldMountFlexible(
        index,
        activeIndex,
        feedRows.length,
        prefetchAhead,
        preloadBehind,
      );
      // Decoder mount is tied to prefetch window, not autoplay — critical on 3G.
      const mountDecoder =
        isActive || (connectivity.shouldPrefetchVideo && inPreloadWindow);

      // Stable callbacks: bound to this item, no closures over frequently-changing state
      const onLike = () => handleLike(item);
      const onSave = () => handleSave(item);
      const onPress = () => {}; // tap handled inside VideoCard via double-tap hook
      const onLongPress = () => {};
      const onComment = () => {
        if (itemKind === "sale") {
          navigation.navigate("PropertySaleVideoComments", {
            videoId:
              typeof item.ID === "string"
                ? parseInt(String(item.ID).split("_")[0])
                : item.ID,
          });
        } else if (itemKind === "landmarks") {
          const lm = (item as any).landmark;
          if (lm?.id ?? (item as any).landmarkID) {
            navigation.navigate("LandmarkDetails", {
              landmarkID: lm?.id ?? (item as any).landmarkID,
              landmark: lm,
            });
          }
        } else {
          navigation.navigate("VideoComments", {
            videoId:
              typeof item.ID === "string"
                ? parseInt(String(item.ID).split("_")[0])
                : item.ID,
          });
        }
      };
      const onMore = () => {
        setReportVideoId(stableId);
        // Open options modal — simplified: show a toast
        setToast({
          message: t("video.reportVideo", "Report video"),
          type: "info",
        });
      };
      const onPlaybackStatus = (status: any) => {
        // Only track for current video — avoid perf overhead for off-screen
        if (!isActive) return;
      };
      const onLoad = (_status: any) => {};

      const onListingCardPress = (() => {
        if (itemKind === "rent" && item.property?.ID) {
          return () =>
            navigation.navigate("PropertyDetails", {
              propertyID: item.property!.ID,
            });
        }
        if (itemKind === "sale" && item.propertySale?.id != null) {
          return () => {
            warmPropertySaleDetailNavigation(
              queryClient,
              item.propertySale!.id,
              langParam,
              item.propertySale as Record<string, unknown>,
            );
            navigation.navigate("PropertySaleDetails", {
              propertyId: item.propertySale!.id,
            });
          };
        }
        if (itemKind === "landmarks") {
          const lm = item.landmark;
          const lid = lm?.id ?? item.landmarkID;
          if (lid != null) {
            return () =>
              navigation.navigate("LandmarkDetails", {
                landmarkID: lid,
                landmark: lm,
              });
          }
        }
        return undefined;
      })();

      return (
        <VideoCard
          item={item}
          index={index}
          isActive={isActive}
          isPreloaded={isPreloaded}
          isMuted={muted}
          shouldAutoplay={connectivity.shouldAutoplayVideo}
          tab={itemKind}
          liked={isLiked(item)}
          saved={isSaved(item)}
          likesCount={getLikesCount(item)}
          savesCount={getSavesCount(item)}
          onLike={onLike}
          onSave={onSave}
          onPress={onPress}
          onLongPress={onLongPress}
          onComment={onComment}
          onMore={onMore}
          onPlaybackStatus={onPlaybackStatus}
          onLoad={onLoad}
          videoRef={setVideoRef(index)}
          onProfilePress={handleProfilePress}
          onListingCardPress={onListingCardPress}
          mountDecoder={mountDecoder}
          connectionQuality={connectivity.connectionQuality}
          userPaused={pausedIndicesRef.current.has(index)}
          onUserPauseChange={(paused) => setUserPausedAt(index, paused)}
        />
      );
    },
    // NOTE: activeIndex, muted, isLiked, isSaved are all needed here.
    // VideoCard's memo comparator filters unnecessary re-renders downstream.
    [
      activeIndex,
      setUserPausedAt,
      muted,
      isLiked,
      isSaved,
      getLikesCount,
      getSavesCount,
      handleLike,
      handleSave,
      setVideoRef,
      navigation,
      t,
      handleProfilePress,
      connectivity.shouldAutoplayVideo,
      connectivity.shouldPrefetchVideo,
      connectivity.prefetchDistance,
      connectivity.connectionQuality,
      feedRows.length,
      langParam,
      queryClient,
    ],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // keyExtractor — must be STABLE and unique (never reuse keys across tabs)
  // ─────────────────────────────────────────────────────────────────────────
  const keyExtractor = useCallback(
    (item: VideoFeedListRow, index: number) => {
      const kind = isVideoDiscoveryRow(item)
        ? "discovery"
        : resolveFeedKind(item as FeedVideo);
      return item?.ID != null
        ? `${feedFilter}-${kind}-${item.ID}`
        : `${feedFilter}-sk-${index}`;
    },
    [feedFilter],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // extraData — only things that affect rendering
  // Do NOT include entire state objects — that defeats memoization
  // ─────────────────────────────────────────────────────────────────────────
  const extraData = useMemo(
    () => ({
      activeIndex,
      muted,
      feedFilter,
      pauseRevision,
      autoplay: connectivity.shouldAutoplayVideo,
      connectionQuality: connectivity.connectionQuality,
    }),
    [
      activeIndex,
      muted,
      feedFilter,
      pauseRevision,
      connectivity.shouldAutoplayVideo,
      connectivity.connectionQuality,
    ],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Filter chips (unified feed) ─────────────────────────────────── */}
      <View style={styles.filterBarWrap} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FEED_FILTER_OPTIONS.map((filter) => {
            const active = feedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => handleFilterChange(filter)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {t(
                    feedFilterLabelKey(filter),
                    feedFilterDefaultLabel(filter),
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      <FlashList
        ref={flashListRef}
        data={feedRows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={extraData}
        initialScrollIndex={videos.length > 0 ? 0 : undefined}
        maintainVisibleContentPosition={{ disabled: true }}
        onLoad={handleFlashListLoad}
        // ── Paging (critical for TikTok-style snap) ──
        pagingEnabled
        snapToInterval={PAGE_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        // ── Performance ─────────────────────────────
        drawDistance={PAGE_HEIGHT * 3}
        estimatedItemSize={PAGE_HEIGHT}
        removeClippedSubviews={Platform.OS === "android"}
        bounces={false}
        overScrollMode={Platform.OS === "android" ? "never" : undefined}
        showsVerticalScrollIndicator={false}
        // ── Visibility ──────────────────────────────
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        // ── Pagination: fetch when ~80% scrolled (spec) ─────────────────────
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isLoading) {
            fetchNextPage();
          }
          maybeLoadMore(activeIndex);
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <VideoSkeleton />
            </View>
          ) : (
            <View style={[styles.loadingContainer, styles.feedEmptyWrap]}>
              <Text style={styles.feedEmptyText}>
                {feedIsError
                  ? t(
                      "video.feedLoadError",
                      "Could not load videos. Check your connection and try again.",
                    )
                  : t("video.feedEmpty", "No videos to show yet.")}
              </Text>
              {feedIsError ? (
                <TouchableOpacity
                  style={styles.feedRetryBtn}
                  onPress={() => refetchActiveFeed()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.feedRetryText}>
                    {t("common.retry", "Try again")}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={null}
        style={styles.list}
      />

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={2500}
          onHide={() => setToast(null)}
        />
      )}

      {/* ── Profile Sheet ─────────────────────────────────────────────────────── */}
      <ProfileSheet
        userId={selectedProfileUserId}
        preview={profilePreview}
        onClose={handleCloseProfileSheet}
        onDismissed={handleProfileSheetDismissed}
        sheetRef={profileSheetRef}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  list: {
    height: PAGE_HEIGHT,
  },
  page: {
    height: PAGE_HEIGHT,
    width,
    backgroundColor: "#000",
  },
  // ── Loading state ──────────────────────────────────────────────────────────
  loadingContainer: {
    height: PAGE_HEIGHT,
    width,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  feedEmptyWrap: {
    paddingHorizontal: 24,
    gap: 16,
  },
  feedEmptyText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  feedRetryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "#FF6B6B",
  },
  feedRetryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  videoSkeleton: {
    height: PAGE_HEIGHT,
    width,
    backgroundColor: "#0a0a0a",
  },
  // ── Filter bar ─────────────────────────────────────────────────────────────
  filterBarWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 38,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  filterChipActive: {
    backgroundColor: "rgba(209,96,36,0.92)",
    borderColor: "rgba(209,96,36,1)",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },
  filterChipTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
});
