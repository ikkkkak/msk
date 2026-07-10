/**
 * ProfileSheet — TikTok-quick-view + Airbnb host carousel hybrid.
 * Opens from video feed; theme-driven colors throughout.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text as RNText,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { Image as ExpoImage } from "expo-image";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { X, MapPin, House, Buildings } from "phosphor-react-native";
import {
  useUserProfile,
  useUserProperties,
  useUserLandmarks,
  profileTargetFromPreview,
} from "../hooks/useProfileSheet";
import { LandmarksSection } from "./LandmarksSection";
import {
  ProfileSheetSkeleton,
  CarouselSkeleton,
  LandmarksSkeleton,
} from "./SkeletonUI";
import { useTranslation } from "react-i18next";
import { theme } from "../theme";
import type { FeedProfileContext } from "../hooks/Videofeedtypes";

const PRIMARY = theme["color-temporary-primary"] as string;
const SURFACE = "#FFFFFF";
const CANVAS = "#FAFAFA";
const BORDER = "#EBEBEB";
const TEXT = "#222222";
const MUTED = "#717171";

function toArray<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : [];
}

function getPropertiesFromPages(pages: unknown[] | undefined): unknown[] {
  if (!pages || !Array.isArray(pages)) return [];
  const out: unknown[] = [];
  for (const p of pages) {
    if (
      p &&
      typeof p === "object" &&
      Array.isArray((p as { data?: unknown[] }).data)
    ) {
      out.push(...(p as { data: unknown[] }).data);
    }
  }
  return out;
}

function getLandmarksFromData(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { landmarks?: unknown[] }).landmarks)
  ) {
    return (data as { landmarks: unknown[] }).landmarks;
  }
  return [];
}

interface ProfileSheetProps {
  userId: number | string | null;
  preview?: FeedProfileContext | null;
  onClose: () => void;
  onDismissed?: () => void;
  sheetRef: React.RefObject<BottomSheetModal | null>;
}

const PLACEHOLDER_IMAGE =
  "https://cdn.apartmentsclone.com/static/img/property-fallback-light.jpg";

function firstUrlFromList(val: unknown): string | undefined {
  if (!Array.isArray(val) || val.length === 0) return undefined;
  const x = val[0];
  if (typeof x === "string" && x.trim()) return x.trim();
  if (
    x &&
    typeof x === "object" &&
    typeof (x as { url?: string }).url === "string"
  ) {
    return (x as { url: string }).url.trim();
  }
  return undefined;
}

function getCoverPhotoUrl(
  property: Record<string, unknown> | null | undefined,
): string {
  if (!property || typeof property !== "object") return PLACEHOLDER_IMAGE;
  const candidates: (string | undefined)[] = [
    typeof property.coverPhotoUrl === "string"
      ? property.coverPhotoUrl
      : undefined,
    typeof property.thumbnailUrl === "string"
      ? property.thumbnailUrl
      : undefined,
    typeof property.thumbnail_url === "string"
      ? property.thumbnail_url
      : undefined,
    typeof property.image === "string" ? property.image : undefined,
    typeof property.cover_image === "string" ? property.cover_image : undefined,
    firstUrlFromList(property.images),
    firstUrlFromList(property.photos),
    firstUrlFromList(property.image_urls),
    typeof property.primaryImage === "string"
      ? property.primaryImage
      : undefined,
  ];
  for (const c of candidates) {
    const u = c?.trim();
    if (u && (u.startsWith("http://") || u.startsWith("https://"))) return u;
  }
  for (const c of candidates) {
    const u = c?.trim();
    if (u) return u;
  }
  return PLACEHOLDER_IMAGE;
}

function formatMRU(val: number | undefined | null): string {
  if (typeof val !== "number" || isNaN(val)) return "";
  return `${val.toLocaleString("fr-MR")} MRU`;
}

function SectionLabel({
  title,
  icon,
}: {
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={s.sectionLabelRow}>
      {icon}
      <RNText style={s.sectionLabel}>{title}</RNText>
    </View>
  );
}

function PropertyMiniCard({
  property,
  onPress,
  cardWidth,
  imageHeight,
}: {
  property: any;
  onPress: (id: number) => void;
  cardWidth: number;
  imageHeight: number;
}) {
  const p = property as Record<string, unknown>;
  const imgUri = getCoverPhotoUrl(p);
  const pid = Number(p.id ?? p.ID ?? 0);
  const listingLabel = String(
    p.listing || p.type || p.status || "Listing",
  ).toUpperCase();
  return (
    <TouchableOpacity
      style={[cardStyles.card, { width: cardWidth }]}
      onPress={() => onPress(pid)}
      activeOpacity={0.9}
    >
      <View style={[cardStyles.imageWrap, { height: imageHeight }]}>
        <ExpoImage
          source={{ uri: imgUri }}
          style={cardStyles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`profile-sheet-prop-${pid}-${imgUri.slice(-40)}`}
          transition={150}
        />
        <View style={cardStyles.badge}>
          <RNText style={cardStyles.badgeTxt}>{listingLabel}</RNText>
        </View>
      </View>
      <View style={cardStyles.body}>
        <RNText style={cardStyles.title} numberOfLines={2}>
          {String(p.title ?? p.name ?? "Untitled")}
        </RNText>
        {typeof p.price === "number" ? (
          <RNText style={cardStyles.price} numberOfLines={1}>
            {formatMRU(p.price)}
          </RNText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function PropertyCarousel({
  items,
  onPress,
  onLoadMore,
  cardWidth,
  imageHeight,
  keyPrefix,
}: {
  items: unknown[];
  onPress: (id: number) => void;
  onLoadMore?: () => void;
  cardWidth: number;
  imageHeight: number;
  keyPrefix: string;
}) {
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!onLoadMore) return;
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      if (
        contentOffset.x + layoutMeasurement.width >=
        contentSize.width - 80
      ) {
        onLoadMore();
      }
    },
    [onLoadMore],
  );

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={200}
      onScroll={handleScroll}
      contentContainerStyle={s.carouselContent}
    >
      {items.map((item, i) => {
        const row = item as { id?: number; ID?: number };
        const key = String(row.id ?? row.ID ?? `${keyPrefix}-${i}`);
        return (
          <PropertyMiniCard
            key={key}
            property={item}
            onPress={onPress}
            cardWidth={cardWidth}
            imageHeight={imageHeight}
          />
        );
      })}
    </ScrollView>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: SURFACE,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  imageWrap: {
    width: "100%",
    backgroundColor: CANVAS,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.5,
  },
  body: { paddingHorizontal: 10, paddingVertical: 10, gap: 4 },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
    lineHeight: 17,
    letterSpacing: -0.15,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: PRIMARY,
    letterSpacing: -0.2,
  },
});

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: SURFACE },
  scroll: { paddingBottom: 32 },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CANVAS,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  profileBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingRight: 36,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CANVAS,
    borderWidth: 2,
    borderColor: SURFACE,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  metaCol: { flex: 1, paddingTop: 2, gap: 4 },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: -0.35,
  },
  statLine: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
  },
  bio: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginTop: 2,
  },
  statPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: CANVAS,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statPillTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: -0.2,
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sectionGap: { height: 4 },
  empty: { paddingHorizontal: 16, paddingVertical: 12 },
  emptyTxt: { fontSize: 14, color: MUTED },
  errWrap: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    backgroundColor: theme["color-danger-100"],
    alignItems: "center",
    gap: 10,
  },
  errTxt: { fontSize: 13, color: theme["color-danger-600"], textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    borderRadius: 20,
  },
  retryTxt: { fontSize: 14, color: "#FFF", fontWeight: "700" },
});

export const ProfileSheet = React.memo(function ProfileSheet({
  userId,
  preview,
  onClose,
  onDismissed,
  sheetRef,
}: ProfileSheetProps) {
  const nav = useNavigation<any>();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  const snapPoints = useMemo(
    () => [Math.round(height * 0.58), Math.round(height * 0.94)],
    [height],
  );
  const cardWidth = Math.max(148, Math.floor(width * 0.4));
  const cardImageHeight = Math.floor(cardWidth * 0.75);

  const sheetTarget = useMemo(
    () => profileTargetFromPreview(userId, preview),
    [userId, preview],
  );

  const profileQuery = useUserProfile(sheetTarget, !!sheetTarget);
  const saleQuery = useUserProperties(sheetTarget, "sale", !!sheetTarget);
  const rentQuery = useUserProperties(sheetTarget, "rent", !!sheetTarget);
  const landmarksQuery = useUserLandmarks(sheetTarget, !!sheetTarget);

  const profileAvatarUrl = useMemo(() => {
    const p = profileQuery.data as { avatarUrl?: string } | undefined;
    const u = p?.avatarUrl?.trim() || preview?.avatarUrl?.trim() || "";
    return u && /^https?:\/\//.test(u) ? u : "";
  }, [profileQuery.data, preview?.avatarUrl]);

  const previewDisplayName = preview?.displayName?.trim() || "";

  const propertyImagePrefetchUrls = useMemo(() => {
    const sale = getPropertiesFromPages(saleQuery.data?.pages);
    const rent = getPropertiesFromPages(rentQuery.data?.pages);
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const row of [...sale, ...rent]) {
      const u = getCoverPhotoUrl(row as Record<string, unknown>);
      if (!u || u === PLACEHOLDER_IMAGE) continue;
      if (!/^https?:\/\//.test(u)) continue;
      if (seen.has(u)) continue;
      seen.add(u);
      urls.push(u);
    }
    return urls;
  }, [saleQuery.data?.pages, rentQuery.data?.pages]);

  useEffect(() => {
    propertyImagePrefetchUrls.slice(0, 40).forEach((u) => {
      ExpoImage.prefetch(u).catch(() => {});
    });
  }, [propertyImagePrefetchUrls]);

  useEffect(() => {
    if (!profileAvatarUrl) return;
    ExpoImage.prefetch(profileAvatarUrl).catch(() => {});
  }, [profileAvatarUrl]);

  const saleProps = getPropertiesFromPages(saleQuery.data?.pages);
  const rentProps = getPropertiesFromPages(rentQuery.data?.pages);
  const landmarks = getLandmarksFromData(landmarksQuery.data);

  const onSalePropertyPress = useCallback(
    (id: number) => {
      onClose();
      setTimeout(
        () => nav.navigate("PropertySaleDetails", { propertyId: id }),
        110,
      );
    },
    [nav, onClose],
  );

  const onRentPropertyPress = useCallback(
    (id: number) => {
      onClose();
      setTimeout(
        () => nav.navigate("PropertyDetails", { propertyID: id }),
        110,
      );
    },
    [nav, onClose],
  );

  const onLm = useCallback(
    (id: number) => {
      const lm = toArray(landmarks).find((x: any) => x?.id === id);
      if (lm) {
        onClose();
        setTimeout(
          () => nav.navigate("LandmarkDetails", { landmark: lm }),
          100,
        );
      }
    },
    [landmarks, nav, onClose],
  );

  const onLoadSale = useCallback(() => {
    if (saleQuery.hasNextPage && !saleQuery.isFetchingNextPage)
      saleQuery.fetchNextPage();
  }, [saleQuery]);

  const onLoadRent = useCallback(() => {
    if (rentQuery.hasNextPage && !rentQuery.isFetchingNextPage)
      rentQuery.fetchNextPage();
  }, [rentQuery]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  let body: React.ReactNode;

  if (!userId) {
    body = (
      <View style={s.wrap}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <X size={16} color={TEXT} weight="bold" />
        </TouchableOpacity>
        <View style={[s.empty, { paddingTop: 48 }]}>
          <Text style={s.emptyTxt}>
            {t("profileSheet.emptyHint", "Tap a profile on a video to view")}
          </Text>
        </View>
      </View>
    );
  } else if (profileQuery.isError) {
    body = (
      <View style={s.wrap}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <X size={16} color={TEXT} weight="bold" />
        </TouchableOpacity>
        <View style={s.errWrap}>
          <Text style={s.errTxt}>
            {t("profileSheet.error", "Couldn't load profile.")}
          </Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => profileQuery.refetch()}
          >
            <RNText style={s.retryTxt}>
              {t("profileSheet.retry", "Retry")}
            </RNText>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (profileQuery.isLoading && !profileQuery.data) {
    body = (
      <View style={s.wrap}>
        {preview?.avatarUrl || previewDisplayName ? (
          <View style={s.profileBlock}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={16} color={TEXT} weight="bold" />
            </TouchableOpacity>
            <View style={s.profileRow}>
              {preview?.avatarUrl ? (
                <ExpoImage
                  source={{ uri: preview.avatarUrl }}
                  style={s.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View
                  style={[
                    s.avatar,
                    { justifyContent: "center", alignItems: "center" },
                  ]}
                >
                  <RNText
                    style={{ fontSize: 22, color: MUTED, fontWeight: "700" }}
                  >
                    {(preview?.initial || previewDisplayName[0] || "?").toUpperCase()}
                  </RNText>
                </View>
              )}
              <View style={s.metaCol}>
                <RNText style={s.name}>
                  {previewDisplayName ||
                    t("profileSheet.loadingHost", "Loading profile…")}
                </RNText>
              </View>
            </View>
          </View>
        ) : null}
        <ProfileSheetSkeleton />
      </View>
    );
  } else {
    const p = profileQuery.data || {};
    const name =
      (p as any).name ||
      previewDisplayName ||
      t("profileSheet.defaultHost", "Host");
    const avatarUrl =
      (p as any).avatarUrl || preview?.avatarUrl || profileAvatarUrl;
    const bio = (p as any).bio;
    const stats = (p as any).stats;
    const saleArr = toArray(saleProps);
    const rentArr = toArray(rentProps);
    const lmArr = toArray(landmarks);
    const listingCount = stats?.totalListings ?? saleArr.length + rentArr.length;

    body = (
      <BottomSheetScrollView
        style={s.wrap}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileBlock}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <X size={16} color={TEXT} weight="bold" />
          </TouchableOpacity>

          <View style={s.profileRow}>
            {avatarUrl ? (
              <ExpoImage
                source={{ uri: String(avatarUrl) }}
                style={s.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={`org-avatar-${(p as any).id ?? userId}`}
                transition={200}
              />
            ) : (
              <View
                style={[s.avatar, { justifyContent: "center", alignItems: "center" }]}
              >
                <RNText
                  style={{ fontSize: 22, color: MUTED, fontWeight: "700" }}
                >
                  {String(name)[0]?.toUpperCase() || "?"}
                </RNText>
              </View>
            )}

            <View style={s.metaCol}>
              <RNText style={s.name}>{name}</RNText>
              {preview?.isOrganization ? (
                <View style={s.statPill}>
                  <Buildings size={12} color={MUTED} />
                  <RNText style={s.statPillTxt}>
                    {t("profileSheet.organizationBadge", "Agency")}
                  </RNText>
                </View>
              ) : null}
              <RNText style={s.statLine}>
                {listingCount}{" "}
                {t("profileSheet.listings", "listings")}
                {lmArr.length > 0
                  ? ` · ${lmArr.length} ${t("profileSheet.landmarks", "landmarks")}`
                  : ""}
              </RNText>
              {bio ? (
                <RNText style={s.bio} numberOfLines={3}>
                  {bio}
                </RNText>
              ) : null}
            </View>
          </View>

          {(saleArr.length > 0 || rentArr.length > 0 || lmArr.length > 0) && (
            <View style={s.statPills}>
              {saleArr.length > 0 && (
                <View style={s.statPill}>
                  <House size={14} color={PRIMARY} weight="fill" />
                  <RNText style={s.statPillTxt}>
                    {saleArr.length} {t("profileSheet.forSaleShort", "sale")}
                  </RNText>
                </View>
              )}
              {rentArr.length > 0 && (
                <View style={s.statPill}>
                  <Buildings size={14} color={PRIMARY} weight="fill" />
                  <RNText style={s.statPillTxt}>
                    {rentArr.length} {t("profileSheet.forRentShort", "rent")}
                  </RNText>
                </View>
              )}
              {lmArr.length > 0 && (
                <View style={s.statPill}>
                  <MapPin size={14} color={PRIMARY} weight="fill" />
                  <RNText style={s.statPillTxt}>
                    {lmArr.length} {t("profileSheet.landmarksShort", "places")}
                  </RNText>
                </View>
              )}
            </View>
          )}
        </View>

        {saleQuery.isLoading ? (
          <CarouselSkeleton />
        ) : saleArr.length > 0 ? (
          <View>
            <SectionLabel
              title={t("profileSheet.propertiesForSale", "For sale")}
              icon={<House size={16} color={PRIMARY} weight="duotone" />}
            />
            <PropertyCarousel
              items={saleArr}
              onPress={onSalePropertyPress}
              onLoadMore={onLoadSale}
              cardWidth={cardWidth}
              imageHeight={cardImageHeight}
              keyPrefix="sale"
            />
          </View>
        ) : null}

        {landmarksQuery.isLoading ? (
          <LandmarksSkeleton />
        ) : lmArr.length > 0 ? (
          <View>
            <SectionLabel
              title={t("profileSheet.landmarks", "Landmarks")}
              icon={<MapPin size={16} color={PRIMARY} weight="duotone" />}
            />
            <LandmarksSection
              landmarks={lmArr as any[]}
              isLoading={false}
              onLandmarkPress={onLm}
              hideHeader
            />
          </View>
        ) : null}

        {rentQuery.isLoading ? (
          <CarouselSkeleton />
        ) : rentArr.length > 0 ? (
          <View>
            <SectionLabel
              title={t("profileSheet.propertiesForRent", "For rent")}
              icon={<Buildings size={16} color={PRIMARY} weight="duotone" />}
            />
            <PropertyCarousel
              items={rentArr}
              onPress={onRentPropertyPress}
              onLoadMore={onLoadRent}
              cardWidth={cardWidth}
              imageHeight={cardImageHeight}
              keyPrefix="rent"
            />
          </View>
        ) : null}

        {!saleQuery.isLoading &&
          !rentQuery.isLoading &&
          !landmarksQuery.isLoading &&
          saleArr.length === 0 &&
          rentArr.length === 0 &&
          lmArr.length === 0 && (
            <View style={s.empty}>
              <RNText style={s.emptyTxt}>
                {t("profileSheet.noContent", "No listings yet")}
              </RNText>
            </View>
          )}
      </BottomSheetScrollView>
    );
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose
      enableDynamicSizing={false}
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onDismiss={onDismissed}
      handleIndicatorStyle={{
        backgroundColor: "#DDDDDD",
        width: 36,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: SURFACE,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
    >
      {body}
    </BottomSheetModal>
  );
});
