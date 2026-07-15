import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import { getMapProvider } from "../../utils/mapProvider";
import { getPlatformMapViewConfig } from "../../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "../map/PlatformMapTileLayer";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  ArrowLeft,
  DotsThreeVertical,
  Images,
  MapPin,
  NavigationArrow,
  Phone,
  Play,
  ShareNetwork,
  VideoCamera,
} from "phosphor-react-native";
import { Video, ResizeMode } from "expo-av";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import type { Region } from "react-native-maps";
import type { LatLng } from "../../types/habitat";
import type { HabitatPlot } from "../../types/habitat";
import { theme } from "../../theme";
import { ListingPapersCard } from "../ListingPapersCard";
import type { PaperDisplayItem } from "../../utils/paperDisplay";
import ListedByHostSection from "../ListedByHostSection";
import { Text } from "@ui-kitten/components";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ACCENT = theme["color-temporary-primary"];
const INK = "#222222";
const MUTED = "#717171";
const LINE = "#EBEBEB";
const SHEET_BG = "#FFFFFF";

export type LandmarkMapDetailLayoutProps = {
  mapRegion: Region;
  mapCenter: LatLng;
  polygonRings: LatLng[][];
  hasMapGeometry: boolean;
  routeCoords?: LatLng[];
  offroadSegment?: { start: LatLng; end: LatLng };
  routeSummary?: string;
  fetchingRoute?: boolean;
  hasRouteApiKey?: boolean;
  onBack: () => void;
  onShare: () => void;
  onOptions: () => void;
  onOpenMaps: () => void;
  onGetRoute: () => void;
  onGuidance: () => void;
  onContact: () => void;
  onVideoPress: () => void;
  showContact: boolean;
  title: string;
  priceDisplay: string | null;
  currency: string;
  locationLine: string;
  plotLabel?: string | null;
  plotVerified?: boolean;
  images: string[];
  videoUrl: string | null;
  habitatPlot?: HabitatPlot | null;
  areaLabel?: string | null;
  landTypeLabel?: string | null;
  detailRows: { label: string; value: string }[];
  description?: string | null;
  paperDisplayItems: PaperDisplayItem[];
  showPublisher: boolean;
  listedByData: Record<string, unknown>;
};

function SpecRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.specRow, last && styles.specRowLast]}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

export function LandmarkMapDetailLayout({
  mapRegion,
  mapCenter,
  polygonRings,
  hasMapGeometry,
  routeCoords = [],
  offroadSegment,
  routeSummary,
  fetchingRoute,
  hasRouteApiKey,
  onBack,
  onShare,
  onOptions,
  onOpenMaps,
  onGetRoute,
  onGuidance,
  onContact,
  onVideoPress,
  showContact,
  title,
  priceDisplay,
  currency,
  locationLine,
  plotLabel,
  plotVerified,
  images,
  videoUrl,
  habitatPlot,
  areaLabel,
  landTypeLabel,
  detailRows,
  description,
  paperDisplayItems,
  showPublisher,
  listedByData,
}: LandmarkMapDetailLayoutProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%", "90%"], []);
  const [imgIndex, setImgIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const primaryRing = polygonRings[0] ?? [];
  const cadastreArea =
    habitatPlot?.area_m2 != null
      ? `${habitatPlot.area_m2} m²`
      : areaLabel ?? null;
  const ilLabel =
    habitatPlot?.il_value != null
      ? `${habitatPlot.il_value} m`
      : null;

  const locationParts = useMemo(() => {
    const parts: string[] = [];
    if (habitatPlot?.plan?.name || habitatPlot?.plan?.name_ar) {
      parts.push(
        habitatPlot.plan.name_ar || habitatPlot.plan.name || "",
      );
    }
    if (habitatPlot?.sector?.name || habitatPlot?.sector?.name_ar) {
      parts.push(
        habitatPlot.sector.name_ar || habitatPlot.sector.name || "",
      );
    }
    if (locationLine) parts.push(locationLine);
    return parts.filter(Boolean).join(" · ");
  }, [habitatPlot, locationLine]);

  const mapBadge = [plotLabel, cadastreArea, ilLabel ? `IL ${ilLabel}` : null]
    .filter(Boolean)
    .join(" · ");

  const renderSheetBody = useCallback(
    () => (
      <View style={styles.sheetInner}>
        {images.length > 0 ? (
          <View style={styles.mediaBlock}>
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
              {images.map((uri, i) => (
                <Image
                  key={`${uri}-${i}`}
                  source={{ uri }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 ? (
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>
                  {imgIndex + 1}/{images.length}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {videoUrl ? (
          <Pressable style={styles.videoCard} onPress={onVideoPress}>
            <Video
              source={{ uri: videoUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
            />
            <View style={styles.videoOverlay}>
              <View style={styles.videoPlay}>
                <Play size={22} color="#FFF" weight="fill" />
              </View>
              <Text style={styles.videoLabel}>
                {t("propertySaleDetails.hero.tabVideo", "Video")}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {(images.length > 0 || videoUrl) && (
          <View style={styles.thumbRow}>
            {images.slice(0, 6).map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.thumb} />
            ))}
            {videoUrl ? (
              <Pressable style={styles.thumbVideo} onPress={onVideoPress}>
                <VideoCamera size={18} color={INK} />
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.specCard}>
          {detailRows.map((row, i) => (
            <SpecRow
              key={row.label}
              label={row.label}
              value={row.value}
              last={i === detailRows.length - 1}
            />
          ))}
        </View>

        {description ? (
          <View style={styles.descBlock}>
            <Text style={styles.sectionLabel}>
              {t("common.description", "Description")}
            </Text>
            <Text
              style={styles.descText}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {description}
            </Text>
            {String(description).length > 120 ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowFullDescription((v) => !v);
                }}
              >
                <Text style={styles.readMore}>
                  {showFullDescription
                    ? t("propertySaleDetails.actions.collapse", "Show less")
                    : t("propertySaleDetails.actions.readMore", "Read more")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {paperDisplayItems.length > 0 ? (
          <ListingPapersCard
            title={t("listing.common.papersSectionTitle", "Legal documents")}
            subtitle={t(
              "listing.common.papersSectionSubtitle",
              "Verify originals before payment.",
            )}
            items={paperDisplayItems}
          />
        ) : null}

        {hasMapGeometry ? (
          <View style={styles.mapActions}>
            <Pressable style={styles.mapActionBtn} onPress={onOpenMaps}>
              <MapPin size={16} color={INK} />
              <Text style={styles.mapActionText}>
                {t("landmarkDetails.openInMaps", "Open in Maps")}
              </Text>
            </Pressable>
            {hasRouteApiKey ? (
              <Pressable
                style={[styles.mapActionBtn, styles.mapActionPrimary]}
                onPress={onGetRoute}
                disabled={fetchingRoute}
              >
                {fetchingRoute ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <NavigationArrow size={16} color="#FFF" weight="fill" />
                    <Text style={[styles.mapActionText, { color: "#FFF" }]}>
                      {t("landmarkDetails.getRoute", "Route")}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {routeSummary ? (
          <Text style={styles.routeSummary}>{routeSummary}</Text>
        ) : null}

        {showPublisher ? (
          <ListedByHostSection
            sectionStyle={{ marginTop: 8 }}
            data={listedByData as any}
            onContactHost={onContact}
            onOpenContactOptions={onContact}
          />
        ) : null}

        <View style={{ height: 100 }} />
      </View>
    ),
    [
      images,
      videoUrl,
      imgIndex,
      detailRows,
      description,
      showFullDescription,
      paperDisplayItems,
      hasMapGeometry,
      hasRouteApiKey,
      fetchingRoute,
      routeSummary,
      showPublisher,
      listedByData,
      t,
      onVideoPress,
      onOpenMaps,
      onGetRoute,
      onContact,
    ],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <MapView
        provider={getMapProvider()}
        mapType={getPlatformMapViewConfig("satellite").mapType}
        style={StyleSheet.absoluteFill}
        initialRegion={mapRegion}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <PlatformMapTileLayer mapStyle="satellite" />
        {polygonRings.map((ring, idx) => (
          <Polygon
            key={`ring-${idx}`}
            coordinates={ring}
            fillColor="rgba(196,30,58,0.22)"
            strokeColor={ACCENT}
            strokeWidth={2.5}
          />
        ))}
        {hasMapGeometry ? (
          <Marker coordinate={mapCenter} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.plotPin}>
              <View style={styles.plotPinDot} />
            </View>
          </Marker>
        ) : null}
        {routeCoords.length > 1 ? (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#2563EB"
            strokeWidth={3}
          />
        ) : null}
        {offroadSegment ? (
          <Polyline
            coordinates={[offroadSegment.start, offroadSegment.end]}
            strokeColor="#D97706"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        ) : null}
      </MapView>

      {/* Top chrome ~10% */}
      <SafeAreaView style={styles.topChrome} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable style={styles.topBtn} onPress={onBack} hitSlop={8}>
            <ArrowLeft size={20} color={INK} weight="bold" />
          </Pressable>
          <View style={styles.topActions}>
            <Pressable style={styles.topBtn} onPress={onShare} hitSlop={8}>
              <ShareNetwork size={20} color={INK} />
            </Pressable>
            <Pressable style={styles.topBtn} onPress={onOptions} hitSlop={8}>
              <DotsThreeVertical size={20} color={INK} weight="bold" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Map overlay card (visible above collapsed sheet) */}
      {mapBadge || images[0] ? (
        <View style={styles.mapFloatCard} pointerEvents="none">
          {images[0] ? (
            <Image source={{ uri: images[0] }} style={styles.mapFloatThumb} />
          ) : (
            <View style={[styles.mapFloatThumb, styles.mapFloatPlaceholder]}>
              <Images size={20} color={MUTED} />
            </View>
          )}
          <View style={styles.mapFloatText}>
            {mapBadge ? (
              <Text style={styles.mapFloatTitle} numberOfLines={2}>
                {mapBadge}
              </Text>
            ) : null}
            {landTypeLabel ? (
              <Text style={styles.mapFloatSub} numberOfLines={1}>
                {landTypeLabel}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        topInset={Platform.OS === "ios" ? 0 : StatusBar.currentHeight ?? 0}
      >
        <View style={styles.peek}>
          <Text style={styles.peekPrice} numberOfLines={1}>
            {priceDisplay ? (
              <>
                {priceDisplay}
                <Text style={styles.peekCurrency}> {currency}</Text>
              </>
            ) : (
              t("landmarkDetails.priceOnRequest", "Price on request")
            )}
          </Text>
          <Text style={styles.peekTitle} numberOfLines={1}>
            {title}
          </Text>
          {locationParts ? (
            <Text style={styles.peekLocation} numberOfLines={1}>
              {locationParts}
            </Text>
          ) : null}
          {plotLabel ? (
            <View style={styles.peekPlotRow}>
              <Text style={styles.peekPlot}>
                {plotVerified ? "✓ " : ""}
                {plotLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScroll}
          keyboardShouldPersistTaps="handled"
        >
          {renderSheetBody()}
        </BottomSheetScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerPrimary}
            onPress={onGuidance}
            activeOpacity={0.88}
          >
            <NavigationArrow size={18} color="#FFF" weight="fill" />
            <Text style={styles.footerPrimaryText}>
              {t("guidance.start", "Navigate")}
            </Text>
          </TouchableOpacity>
          {showContact ? (
            <TouchableOpacity
              style={styles.footerSecondary}
              onPress={onContact}
              activeOpacity={0.88}
            >
              <Phone size={18} color={INK} />
            </TouchableOpacity>
          ) : null}
        </View>
      </BottomSheet>
    </View>
  );
}

const MAP_FLOAT_BOTTOM = SCREEN_H * 0.22 + 12;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E8E8E8" },
  topChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 6,
    minHeight: SCREEN_H * 0.08,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  topActions: { flexDirection: "row", gap: 8 },
  plotPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ACCENT,
  },
  plotPinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  mapFloatCard: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: MAP_FLOAT_BOTTOM,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 12,
    padding: 8,
    zIndex: 5,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mapFloatThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: LINE,
  },
  mapFloatPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapFloatText: { flex: 1, minWidth: 0 },
  mapFloatTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
    lineHeight: 18,
  },
  mapFloatSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  sheetBackground: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDDDDD",
    borderRadius: 2,
  },
  peek: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  peekPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: INK,
    letterSpacing: -0.3,
  },
  peekCurrency: { fontSize: 15, fontWeight: "600", color: MUTED },
  peekTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: INK,
    marginTop: 4,
  },
  peekLocation: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  peekPlotRow: { marginTop: 6 },
  peekPlot: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
  },
  sheetScroll: { paddingBottom: 8 },
  sheetInner: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  mediaBlock: {
    marginHorizontal: -20,
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImage: {
    width: SCREEN_W - 40,
    height: 220,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  photoCounter: {
    position: "absolute",
    bottom: 10,
    right: 30,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCounterText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  videoCard: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  videoPlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoLabel: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  thumbRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: LINE,
  },
  thumbVideo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  specCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    overflow: "hidden",
  },
  specRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
    gap: 3,
  },
  specRowLast: { borderBottomWidth: 0 },
  specLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  specValue: {
    fontSize: 15,
    fontWeight: "600",
    color: INK,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
    marginBottom: 8,
  },
  descBlock: { gap: 6 },
  descText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#484848",
  },
  readMore: {
    fontSize: 14,
    fontWeight: "600",
    color: INK,
    textDecorationLine: "underline",
    marginTop: 4,
  },
  mapActions: {
    flexDirection: "row",
    gap: 8,
  },
  mapActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#FAFAFA",
  },
  mapActionPrimary: {
    backgroundColor: INK,
    borderColor: INK,
  },
  mapActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: INK,
  },
  routeSummary: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
    backgroundColor: SHEET_BG,
  },
  footerPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: INK,
    borderRadius: 12,
    paddingVertical: 14,
  },
  footerPrimaryText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  footerSecondary: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
});
