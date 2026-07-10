/**
 * PropertySaleList.tsx — Clean Animation Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Animation philosophy:
 *   • NEVER flash white between states — old data stays visible while new
 *     data loads (opacity crossfade, not unmount/remount).
 *   • Skeleton only on TRUE first load (no data yet, not refreshing).
 *   • Refresh keeps the list visible, adds a subtle top overlay indicator.
 *   • Cards enter with a staggered fade+slide — index-capped so bulk data
 *     doesn't lag forever.
 *   • Pagination footer: fixed height, spinner fades in/out in place.
 *   • Error / empty states crossfade in — never pop.
 *   • All state transitions use the same 280ms ease-out curve for coherence.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Image } from "expo-image";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { ZillowStylePropertyCardSkeleton } from "../../components/ZillowStylePropertyCard";
import { PropertyCardWithQuery } from "../../components/PropertyCardWithQuery";
import { SmartAddHomeSection } from "../../components/SmartAddHomeSection";
import { DiscoverLandsHomeRow } from "../../components/DiscoverLandsHomeRow";
import type { PropertySaleItem } from "../../hooks/usePropertiesInfinite";
import {
  useBannersQuery,
  type Banner,
} from "../../hooks/queries/useBannersQuery";
import { useDiscoverLandmarksPreview } from "../../hooks/queries/useDiscoverLandmarksPreview";
import { extractLandmarkImageUrls } from "../../utils/landmarkMedia";
import { prefetchFeedListingImages } from "../../services/imagePrefetch";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");

const CARD_IMAGE_H = 224;
const CARD_CONTENT_H = 227;
export const PROPERTY_ITEM_H = CARD_IMAGE_H + CARD_CONTENT_H + 16;
export const BANNER_ITEM_H = Math.round(SCREEN_W / 2.5) + 16;
export const TRY_AI_ITEM_H = 92 + 16;
/** Discover Lands horizontal strip (gradient + 4 cards + header) */
export const DISCOVER_LANDS_ITEM_H = 300;

const FIRST_BANNER_AFTER = 4;
const BANNER_STEP = 6;
const FOOTER_H = 72;

/** Filter Metro / device logs with this line */
export const PROPERTY_SKELETON_LOG =
  "-------------------- property skeleton log --------------------";

function logPropertySkeleton(
  phase: string,
  details: Record<string, unknown> = {},
) {
  if (!__DEV__) return;
  console.log(PROPERTY_SKELETON_LOG, `\n${phase}`, {
    iso: new Date().toISOString(),
    ...details,
  });
}

/** Global transition curve used for all state changes */
const EASE_OUT = Easing.out(Easing.cubic);
const STATE_DUR = 280;
const PAGINATION_LOCK_COOLDOWN_MS = 900;
const PAGINATION_RETRY_DELAY_MS = 1800;
const MAX_SILENT_RETRIES = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PropertySaleListProps {
  data?: PropertySaleItem[];
  isLoading?: boolean;
  /** When filters/query key change, pass a new key so stale rows are not shown under skeleton */
  fetchSessionKey?: string;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  error?: Error | null;
  onEndReached?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onPress?: (id: number, initialImageIndex?: number) => void;
  onCall?: (phone?: string) => void;
  onEmail?: (website?: string) => void;
  onFavorite?: (id: number) => void;
  favorites?: number[];
  emptyMessage?: string;
  skeletonCount?: number;
  /** When both callbacks are set, injects a “Discover lands” row in the feed (random slot + fresh shuffle on refresh). */
  onDiscoverLandPress?: (landmark: any) => void;
  onDiscoverLandsViewAll?: () => void;
  onBecomeHostPress?: () => void;
}

type BannerListItem = { id: string; __type: "banner"; banner: Banner };
type TryAiListItem = { id: string; __type: "try_ai" };
type DiscoverLandsListItem = { id: string; __type: "discover_lands" };
type ListItem =
  | PropertySaleItem
  | BannerListItem
  | TryAiListItem
  | DiscoverLandsListItem;

function isBannerItem(item: ListItem): item is BannerListItem {
  return (item as BannerListItem).__type === "banner";
}

function isTryAiItem(item: ListItem): item is TryAiListItem {
  return (item as TryAiListItem).__type === "try_ai";
}

function isDiscoverLandsItem(item: ListItem): item is DiscoverLandsListItem {
  return (item as DiscoverLandsListItem).__type === "discover_lands";
}

/** Stable empty array — avoids new `[]` each render from `data || []` in parent. */
const EMPTY_PROPERTY_LIST: PropertySaleItem[] = [];
/** Stable empty array — avoids new `[]` each render from query defaults. */
const EMPTY_BANNERS: Banner[] = [];

/** Deterministic-ish shuffle for “always new four” UX without unstable list order flicker */
function hashString(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed % 2147483647 || 12345;
  const rnd = (): number => {
    s = (s * 1103515245 + 12345) % 2147483647;
    return s / 2147483647;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// usePreviousData — keep the last non-empty data set so the list never
// blanks out while a refetch is in progress.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * While `keepPrevious` is true, show the last non-empty list so the UI does not flash empty
 * during refetch. Clears when `sessionKey` changes (e.g. new filter set).
 */
function usePreviousData<T>(
  current: T[],
  keepPrevious: boolean,
  sessionKey: string,
): T[] {
  const ref = useRef<T[]>([]);
  const keyRef = useRef(sessionKey);
  if (keyRef.current !== sessionKey) {
    keyRef.current = sessionKey;
    ref.current = [];
  }
  if (!keepPrevious && current.length > 0) {
    ref.current = current;
  }
  return keepPrevious && ref.current.length > 0 ? ref.current : current;
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedBannerCard
// ─────────────────────────────────────────────────────────────────────────────

const FeedBannerCard: React.FC<{ banner: Banner }> = React.memo(
  ({ banner }) => {
    const handlePress = useCallback(() => {
      if (banner.link_url?.trim())
        Linking.openURL(banner.link_url).catch(() => {});
    }, [banner.link_url]);

    const aspectRatio =
      banner.width && banner.height && banner.width > 0 && banner.height > 0
        ? banner.width / banner.height
        : 2.5;

    const inner = (
      <View style={[fb.card, { height: Math.round(SCREEN_W / aspectRatio) }]}>
        <Image
          source={{ uri: banner.image_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`banner-${banner.id}`}
          transition={200}
        />
      </View>
    );

    return banner.link_url?.trim() ? (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        {inner}
      </TouchableOpacity>
    ) : (
      inner
    );
  },
);

const fb = StyleSheet.create({
  card: { overflow: "hidden", backgroundColor: "#EEF0F3", borderRadius: 12 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonList — pulse skeleton that matches card proportions
// Fades OUT when real data arrives (crossfade, not pop-off)
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonListProps {
  count: number;
  visible: boolean;
  onHidden: () => void;
}
const SkeletonList: React.FC<SkeletonListProps> = React.memo(
  ({ count, visible, onHidden }) => {
    const opacity = useSharedValue(visible ? 1 : 0);

    useEffect(() => {
      if (!visible) {
        opacity.value = withTiming(
          0,
          { duration: STATE_DUR, easing: EASE_OUT },
          (finished) => {
            if (finished) runOnJS(onHidden)();
          },
        );
      } else {
        opacity.value = withTiming(1, {
          duration: STATE_DUR,
          easing: EASE_OUT,
        });
      }
    }, [visible]);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
      <Animated.View style={[styles.skeletonWrap, style]}>
        {Array.from({ length: count }).map((_, i) => (
          <ZillowStylePropertyCardSkeleton key={i} delay={i * 80} />
        ))}
      </Animated.View>
    );
  },
);

// CardWrapper — plain fragment (no Reanimated entering; breaks FlashList if animated)
const CardWrapper: React.FC<{ children: React.ReactNode }> = React.memo(
  ({ children }) => <>{children}</>,
);

// ─────────────────────────────────────────────────────────────────────────────
// ListFooter — fixed height, spinner fades in/out inside it
// ─────────────────────────────────────────────────────────────────────────────

const ListFooter: React.FC<{ loading: boolean }> = React.memo(({ loading }) => {
  const opacity = useSharedValue(loading ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(loading ? 1 : 0, {
      duration: 240,
      easing: EASE_OUT,
    });
  }, [loading]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.footer}>
      <Animated.View style={[styles.footerInner, style]}>
        <ActivityIndicator size="small" color="#9CA3AF" />
        <Text style={styles.footerTxt}>Finding more homes…</Text>
      </Animated.View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState / EmptyState — fade in cleanly
// ─────────────────────────────────────────────────────────────────────────────

const FadeInView: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Animated.View
    style={styles.centred}
    entering={FadeIn.duration(STATE_DUR).easing(EASE_OUT)}
  >
    {children}
  </Animated.View>
);

function humanizePropertyListError(error: Error): string {
  const msg = String(error?.message ?? "");
  const code = (error as any)?.code;
  if (msg.includes("timeout") || code === "ECONNABORTED") {
    return "The request timed out. Your network may be slow or the server is busy — try again.";
  }
  if (
    msg.includes("Network Error") ||
    code === "ERR_NETWORK" ||
    msg.includes("Failed to connect")
  ) {
    return "Cannot reach the API. Use your computer's Wi‑Fi IP in constants (or EXPO_PUBLIC_API_URL), start the backend on port 4000, and try again.";
  }
  const status = (error as any)?.response?.status;
  if (status === 401 || status === 403) {
    return "You don't have permission to load this list.";
  }
  if (status >= 500) {
    return "Server error while loading properties. Try again in a moment.";
  }
  return msg || "Failed to load properties";
}

const ErrorState: React.FC<{ error: Error; onRetry?: () => void }> = React.memo(
  ({ error, onRetry }) => (
    <FadeInView>
      <Text style={styles.errorTitle}>Couldn't load properties</Text>
      <Text style={styles.errorMsg}>{humanizePropertyListError(error)}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryTxt}>Try Again</Text>
        </TouchableOpacity>
      )}
    </FadeInView>
  ),
);

const EmptyState: React.FC<{ message?: string }> = React.memo(({ message }) => (
  <FadeInView>
    <Text style={styles.emptyTitle}>{message ?? "No properties found"}</Text>
    <Text style={styles.emptyMsg}>Try adjusting your search filters</Text>
  </FadeInView>
));

// ─────────────────────────────────────────────────────────────────────────────
// FlashList helpers (stable, module-level)
// ─────────────────────────────────────────────────────────────────────────────

function overrideItemLayout(
  layout: { span?: number; size?: number },
  item: ListItem,
) {
  layout.size = isBannerItem(item)
    ? BANNER_ITEM_H
    : isTryAiItem(item)
      ? TRY_AI_ITEM_H
      : isDiscoverLandsItem(item)
        ? DISCOVER_LANDS_ITEM_H
        : PROPERTY_ITEM_H;
}

function getItemType(item: ListItem): string {
  return isBannerItem(item)
    ? "banner"
    : isTryAiItem(item)
      ? "try_ai"
      : isDiscoverLandsItem(item)
        ? "discover_lands"
        : "property";
}

function keyExtractor(item: ListItem): string {
  if (isBannerItem(item) || isTryAiItem(item) || isDiscoverLandsItem(item))
    return item.id;
  return `property-${(item as PropertySaleItem).id}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

function PropertySaleList({
  data,
  isLoading,
  fetchSessionKey = "",
  isFetchingNextPage,
  hasNextPage,
  error,
  onEndReached,
  onRefresh,
  isRefreshing = false,
  onPress,
  onCall,
  onEmail,
  onFavorite,
  favorites = [],
  emptyMessage,
  skeletonCount = 4,
  onDiscoverLandPress,
  onDiscoverLandsViewAll,
  onBecomeHostPress,
}: PropertySaleListProps) {
  const discoverLandsActive = !!(onDiscoverLandPress && onDiscoverLandsViewAll);
  const [discoverShuffleTick, setDiscoverShuffleTick] = useState(0);
  const prevRefreshingDiscoverRef = useRef(false);
  const discoverLandmarksQ = useDiscoverLandmarksPreview(discoverLandsActive);

  const landmarkPoolVerified = useMemo(() => {
    const list = discoverLandmarksQ.data ?? [];
    return list.filter((lm: any) => {
      const status = String(lm?.status ?? "").toLowerCase();
      return (
        lm?.is_verified === true &&
        (lm?.is_published === true || status === "verified")
      );
    });
  }, [discoverLandmarksQ.data]);

  const discoverPicks = useMemo(() => {
    if (!discoverLandsActive || landmarkPoolVerified.length === 0) return [];
    const h = hashString(`${fetchSessionKey}|${discoverShuffleTick}|lands`);
    return shuffleWithSeed(landmarkPoolVerified, h).slice(0, 4);
  }, [
    discoverLandsActive,
    landmarkPoolVerified,
    fetchSessionKey,
    discoverShuffleTick,
  ]);

  const prevSessionKeyForDiscoverRef = useRef(fetchSessionKey);
  useEffect(() => {
    if (prevSessionKeyForDiscoverRef.current !== fetchSessionKey) {
      prevSessionKeyForDiscoverRef.current = fetchSessionKey;
      setDiscoverShuffleTick((x) => x + 1);
    }
  }, [fetchSessionKey]);

  useEffect(() => {
    if (prevRefreshingDiscoverRef.current && !isRefreshing) {
      setDiscoverShuffleTick((x) => x + 1);
    }
    prevRefreshingDiscoverRef.current = !!isRefreshing;
  }, [isRefreshing]);

  const allPropertiesRaw = data ?? EMPTY_PROPERTY_LIST;
  const showBecomeHostHeader = !!onBecomeHostPress;

  // Prevent duplicates when the smart feed updates mid-pagination.
  const allProperties = useMemo(() => {
    const seen = new Set<number>();
    const out: PropertySaleItem[] = [];
    for (const p of allPropertiesRaw) {
      const id = Number((p as any)?.id ?? (p as any)?.ID);
      if (!Number.isFinite(id) || id <= 0) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(p as PropertySaleItem);
    }
    return out;
  }, [allPropertiesRaw]);

  // Stabilize list order to prevent “where did I stop?” confusion:
  // never reorder already-rendered ids; only append new ids at the end.
  const stableOrderRef = useRef<number[]>([]);
  const stableMapRef = useRef<Map<number, PropertySaleItem>>(new Map());
  const stableListOutRef = useRef<PropertySaleItem[]>([]);
  const stableListSigRef = useRef("");

  const prevListSessionKeyRef = useRef(fetchSessionKey);
  useEffect(() => {
    if (prevListSessionKeyRef.current !== fetchSessionKey) {
      prevListSessionKeyRef.current = fetchSessionKey;
      stableOrderRef.current = [];
      stableMapRef.current = new Map();
    }
  }, [fetchSessionKey]);

  const stablePropertiesOrdered = useMemo(() => {
    const prevOrder = stableOrderRef.current;
    const nextMap = new Map<number, PropertySaleItem>(stableMapRef.current);

    // Update map with latest item data (keeps card fresh without reordering).
    for (const p of allProperties) nextMap.set(p.id, p);

    const inNext = new Set(allProperties.map((p) => p.id));
    const nextOrder: number[] = [];

    // Keep previous order for ids that still exist.
    for (const id of prevOrder) {
      if (inNext.has(id)) nextOrder.push(id);
    }
    // Append new ids in the order we received them.
    const seen2 = new Set(nextOrder);
    for (const p of allProperties) {
      if (!seen2.has(p.id)) {
        nextOrder.push(p.id);
        seen2.add(p.id);
      }
    }

    stableOrderRef.current = nextOrder;
    stableMapRef.current = nextMap;
    const sig = nextOrder.join(",");
    if (
      sig === stableListSigRef.current &&
      stableListOutRef.current.length > 0
    ) {
      for (let i = 0; i < nextOrder.length; i++) {
        const row = nextMap.get(nextOrder[i]);
        if (row) stableListOutRef.current[i] = row;
      }
      return stableListOutRef.current;
    }
    const result = nextOrder.map((id) => nextMap.get(id)!).filter(Boolean);
    stableListSigRef.current = sig;
    stableListOutRef.current = result;
    return result;
  }, [allProperties]);

  const keepPreviousListWhileBusy = !!(isLoading || isRefreshing);

  // ── Keep previous data to prevent blank-flash during refetch / pull-to-refresh ─
  const stableProperties = usePreviousData(
    stablePropertiesOrdered,
    keepPreviousListWhileBusy,
    fetchSessionKey,
  );

  const discoverInsertAfterIndex = useMemo(() => {
    if (!discoverLandsActive) return -1;
    const n = stableProperties.length;
    if (n < 4) return -1;
    const h = hashString(`${fetchSessionKey}|${discoverShuffleTick}|slot`);
    const hi = Math.min(9, n - 2);
    const lo = 2;
    return lo + (h % Math.max(1, hi - lo + 1));
  }, [
    discoverLandsActive,
    stableProperties.length,
    fetchSessionKey,
    discoverShuffleTick,
  ]);

  useEffect(() => {
    const seen = new Set<string>();
    const push = (u: unknown) => {
      if (typeof u !== "string" || !u.trim()) return;
      const t = u.trim();
      if (!seen.has(t)) seen.add(t);
    };
    for (const lm of discoverPicks as any[]) {
      for (const u of extractLandmarkImageUrls(lm)) {
        push(u);
      }
    }
    const urls = [...seen];
    if (urls.length > 0) {
      Image.prefetch(urls.slice(0, 16)).catch(() => {});
    }
  }, [discoverPicks]);

  const onDiscoverLandPressRef = useRef(onDiscoverLandPress);
  const onDiscoverLandsViewAllRef = useRef(onDiscoverLandsViewAll);
  const onBecomeHostPressRef = useRef(onBecomeHostPress);
  useEffect(() => {
    onDiscoverLandPressRef.current = onDiscoverLandPress;
  }, [onDiscoverLandPress]);
  useEffect(() => {
    onDiscoverLandsViewAllRef.current = onDiscoverLandsViewAll;
  }, [onDiscoverLandsViewAll]);
  useEffect(() => {
    onBecomeHostPressRef.current = onBecomeHostPress;
  }, [onBecomeHostPress]);

  // Debug: print the order of property ids rendered by this list.
  // Goal: confirm smart-feed shuffle/rotation across reloads and page loads.
  const debugHeadId = stableProperties[0]?.id;
  const prevDebugIdsRef = useRef<number[]>([]);
  const firstLoadLoggedRef = useRef(false);
  useEffect(() => {
    const ids = stableProperties
      .map((p) => p?.id)
      .filter((id): id is number => typeof id === "number");

    if (ids.length === 0) {
      prevDebugIdsRef.current = [];
      firstLoadLoggedRef.current = false;
      return;
    }

    // Log once on the first time we get real data.
    if (!firstLoadLoggedRef.current) {
      console.log(
        `[PropertySaleList] initial ids(${ids.length}):`,
        ids.slice(0, 30),
      );
      firstLoadLoggedRef.current = true;
      prevDebugIdsRef.current = ids;
      return;
    }

    const prev = prevDebugIdsRef.current;
    const prevFirst = prev[0];
    const nextFirst = ids[0];

    if (ids.length > prev.length) {
      const appended = ids.slice(prev.length);
      console.log(
        `[PropertySaleList] appended ids (${prev.length} -> ${ids.length}) appended:`,
        appended.slice(0, 30),
      );
      prevDebugIdsRef.current = ids;
      return;
    }

    // If the first card changes, log the new order head (helps detect reshuffle).
    if (prevFirst !== nextFirst) {
      console.log(
        `[PropertySaleList] reshuffle/rotation head changed: ${prevFirst} -> ${nextFirst}. Head ids:`,
        ids.slice(0, 30),
      );
      prevDebugIdsRef.current = ids;
    }
  }, [stableProperties.length, debugHeadId, isFetchingNextPage, isLoading]);

  const { data: bannersData } = useBannersQuery({
    // Fetch independently so banner loading is not blocked by property loading state.
    enabled: true,
  });
  const banners = bannersData ?? EMPTY_BANNERS;

  /**
   * Skeleton only when we're waiting on the server and have nothing to render yet.
   * Errors never use skeletons (handled below). Rows stay visible during background refresh.
   */
  const showSkeletonOverlay =
    !error &&
    (isLoading || (isRefreshing && allProperties.length === 0)) &&
    stableProperties.length === 0;

  const skeletonInitLoggedRef = useRef(false);
  useEffect(() => {
    if (!__DEV__) return;
    if (showSkeletonOverlay && !skeletonInitLoggedRef.current) {
      skeletonInitLoggedRef.current = true;
      logPropertySkeleton("SKELETON_SHOWING", {
        isLoading: !!isLoading,
        isRefreshing,
        rawDataFromParent: allPropertiesRaw.length,
      });
      return;
    }
    if (!showSkeletonOverlay) {
      skeletonInitLoggedRef.current = false;
    }
  }, [showSkeletonOverlay, isLoading, isRefreshing, allPropertiesRaw.length]);

  // ── Prefetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (banners.length > 0) {
      Image.prefetch(banners.map((b) => b.image_url)).catch(() => {});
    }
  }, [banners]);

  useEffect(() => {
    if (allProperties.length > 0) {
      prefetchFeedListingImages(allProperties);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProperties.length === 0 ? 0 : allProperties[0]?.id]);

  // ── Banner injection ──────────────────────────────────────────────────────
  const listData = useMemo<ListItem[]>(() => {
    // Always inject the TryAI section after the 2nd property,
    // even if there are no remote banners.
    const sorted = [...banners].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const result: ListItem[] = [];
    let bi = 0;
    let injectedTryAi = false;
    let discoverInjected = false;

    const discoverItem: DiscoverLandsListItem | null =
      discoverLandsActive && discoverInsertAfterIndex >= 0
        ? ({
            id: `discover-lands-${fetchSessionKey}-${discoverShuffleTick}`,
            __type: "discover_lands",
          } as const)
        : null;

    for (let i = 0; i < stableProperties.length; i++) {
      result.push(stableProperties[i]);
      const count = i + 1;

      // Discover lands strip — randomized slot in the upper part of the feed
      if (discoverItem && !discoverInjected && i === discoverInsertAfterIndex) {
        result.push(discoverItem);
        discoverInjected = true;
      }

      if (!injectedTryAi && count === 2) {
        result.push({ id: "try-ai-home", __type: "try_ai" });
        injectedTryAi = true;
      }

      if (
        bi < sorted.length &&
        count === FIRST_BANNER_AFTER + BANNER_STEP * bi
      ) {
        const banner = sorted[bi];
        result.push({
          // Stable key per slot so fast scrolling / pagination doesn't remount banners.
          id: `banner-${banner.id}-slot-${bi}`,
          __type: "banner",
          banner,
        });
        bi++;
      }
    }
    return result;
  }, [
    stableProperties,
    banners,
    discoverLandsActive,
    discoverInsertAfterIndex,
    fetchSessionKey,
    discoverShuffleTick,
  ]);

  const listDataStableRef = useRef<ListItem[]>([]);
  const listDataSigRef = useRef("");
  const listDataForList = useMemo(() => {
    const sig = listData.map((item) => keyExtractor(item)).join("|");
    if (
      sig === listDataSigRef.current &&
      listDataStableRef.current.length > 0
    ) {
      return listDataStableRef.current;
    }
    listDataSigRef.current = sig;
    listDataStableRef.current = listData;
    return listData;
  }, [listData]);

  // ── Pagination orchestration (early prefetch + lock + silent retries) ─────
  const paginationLockRef = useRef(false);
  const paginationCooldownTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const paginationRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingFetchMetaRef = useRef<{
    expectedMinCount: number;
    retries: number;
  } | null>(null);
  const listDataLengthRef = useRef(0);
  listDataLengthRef.current = listDataForList.length;

  const clearPaginationTimers = useCallback(() => {
    if (paginationCooldownTimerRef.current) {
      clearTimeout(paginationCooldownTimerRef.current);
      paginationCooldownTimerRef.current = null;
    }
    if (paginationRetryTimerRef.current) {
      clearTimeout(paginationRetryTimerRef.current);
      paginationRetryTimerRef.current = null;
    }
  }, []);

  const performPaginationFetch = useCallback(
    (reason: "end_reached" | "prefetch" | "silent_retry") => {
      if (!hasNextPage || isLoading || isFetchingNextPage) return;
      if (paginationLockRef.current) return;
      paginationLockRef.current = true;

      pendingFetchMetaRef.current = {
        expectedMinCount: stableProperties.length + 1,
        retries: reason === "silent_retry" ? 1 : 0,
      };
      onEndReached?.();
    },
    [
      hasNextPage,
      isLoading,
      isFetchingNextPage,
      onEndReached,
      stableProperties.length,
    ],
  );

  useEffect(() => {
    return () => clearPaginationTimers();
  }, [clearPaginationTimers]);

  useEffect(() => {
    // Unlock only after network fetch settles + short cooldown to avoid rapid re-entry.
    if (isFetchingNextPage) return;
    if (!paginationLockRef.current) return;

    clearPaginationTimers();
    paginationCooldownTimerRef.current = setTimeout(() => {
      paginationLockRef.current = false;
      paginationCooldownTimerRef.current = null;
    }, PAGINATION_LOCK_COOLDOWN_MS);

    // Silent retry if fetch settled but did not increase list size.
    const meta = pendingFetchMetaRef.current;
    if (!meta || !hasNextPage) return;

    const didGrow = stableProperties.length >= meta.expectedMinCount;
    if (didGrow) {
      pendingFetchMetaRef.current = null;
      return;
    }

    if (meta.retries >= MAX_SILENT_RETRIES) {
      pendingFetchMetaRef.current = null;
      return;
    }

    const nextRetryCount = meta.retries + 1;
    pendingFetchMetaRef.current = {
      expectedMinCount: meta.expectedMinCount,
      retries: nextRetryCount,
    };

    paginationRetryTimerRef.current = setTimeout(() => {
      paginationRetryTimerRef.current = null;
      paginationLockRef.current = false; // allow retry attempt
      performPaginationFetch("silent_retry");
    }, PAGINATION_RETRY_DELAY_MS * nextRetryCount);
  }, [
    isFetchingNextPage,
    hasNextPage,
    stableProperties.length,
    clearPaginationTimers,
    performPaginationFetch,
  ]);

  // ── Stable callback refs ──────────────────────────────────────────────────
  const onPressRef = useRef(onPress);
  const onCallRef = useRef(onCall);
  const onEmailRef = useRef(onEmail);
  const onFavoriteRef = useRef(onFavorite);
  const favoritesRef = useRef(favorites);

  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);
  useEffect(() => {
    onCallRef.current = onCall;
  }, [onCall]);
  useEffect(() => {
    onEmailRef.current = onEmail;
  }, [onEmail]);
  useEffect(() => {
    onFavoriteRef.current = onFavorite;
  }, [onFavorite]);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // ── renderItem — stable, wraps each card in CardWrapper for stagger ───────
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ListItem>) => {
      if (isBannerItem(item)) {
        return (
          <CardWrapper>
            <View style={styles.itemPad}>
              <FeedBannerCard banner={item.banner} />
            </View>
          </CardWrapper>
        );
      }
      if (isTryAiItem(item)) {
        return (
          <CardWrapper>
            <View style={styles.itemPad}>
              <SmartAddHomeSection />
            </View>
          </CardWrapper>
        );
      }
      if (isDiscoverLandsItem(item)) {
        return (
          <CardWrapper>
            <View style={styles.itemPad}>
              <DiscoverLandsHomeRow
                landmarks={discoverPicks}
                isLoading={
                  discoverLandmarksQ.isLoading || discoverLandmarksQ.isFetching
                }
                onPressLand={(lm) =>
                  onDiscoverLandPressRef.current?.(lm as any)
                }
                onViewAll={() => onDiscoverLandsViewAllRef.current?.()}
              />
            </View>
          </CardWrapper>
        );
      }
      return (
        <CardWrapper>
          <View style={styles.itemPad}>
            <PropertyCardWithQuery
              propertyId={item.id}
              initialProperty={item}
              onPress={onPressRef.current ?? ((_: number, __?: number) => {})}
              onCall={onCallRef.current}
              onEmail={onEmailRef.current}
              onFavorite={onFavoriteRef.current}
              isFavorite={favoritesRef.current.includes(item.id)}
            />
          </View>
        </CardWrapper>
      );
    },
    [
      discoverPicks,
      discoverLandmarksQ.isLoading,
      discoverLandmarksQ.isFetching,
    ],
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const lastEndReachedAtRef = useRef(0);
  const handleEndReached = useCallback(() => {
    const now = Date.now();
    if (now - lastEndReachedAtRef.current < 900) return;
    lastEndReachedAtRef.current = now;
    performPaginationFetch("end_reached");
  }, [performPaginationFetch]);

  const listFooter = useMemo(
    () => <ListFooter loading={!!isFetchingNextPage} />,
    [isFetchingNextPage],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={false} // we handle the visual ourselves — avoids native bounce conflict
        onRefresh={() => onRefresh?.()}
        tintColor="#9CA3AF"
        colors={["#9CA3AF"]}
      />
    ),
    [onRefresh],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // Error state (no prior data) — never stack skeleton on top of errors
  if (error && stableProperties.length === 0) {
    return (
      <View style={styles.flex}>
        <ErrorState error={error} onRetry={onRefresh} />
      </View>
    );
  }

  // First load: skeleton only (no FlashList underneath — avoids update loops)
  if (showSkeletonOverlay) {
    return (
      <View style={[styles.flex, styles.skeletonWrap]}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ZillowStylePropertyCardSkeleton key={`sk-${i}`} delay={i * 80} />
        ))}
      </View>
    );
  }

  // Empty state (loaded, no results)
  if (!isLoading && !isRefreshing && !error && listData.length === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState message={emptyMessage} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* List — always rendered; silent background refresh (no disruptive UI) */}
      <View style={styles.flex}>
        <FlashList<ListItem>
          data={listDataForList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          overrideItemLayout={overrideItemLayout}
          // @ts-expect-error FlashList props differ across versions
          estimatedItemSize={PROPERTY_ITEM_H}
          removeClippedSubviews={Platform.OS !== "web"}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={7}
          drawDistance={SCREEN_W * 2}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.35}
          ListFooterComponent={listFooter}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

export default React.memo(PropertySaleList);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  itemPad: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonWrap: {
    paddingTop: 8,
    backgroundColor: "#FAFAF8",
    flex: 1,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    height: FOOTER_H,
    alignItems: "center",
    justifyContent: "center",
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerTxt: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  // ── Centred states ────────────────────────────────────────────────────────
  centred: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryTxt: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMsg: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
