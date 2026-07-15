/**
 * Plot callout — geo-accurate: native pin at plot coordinate + screen overlay card.
 * Custom Marker snapshots mis-anchor large views; pointForCoordinate is reliable.
 */
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  I18nManager,
  Image,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CaretRight,
  MapPin,
  Buildings,
  Hash,
  Ruler,
  Mountains,
  ArrowsOutSimple,
  type Icon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import type { HabitatPlot, LatLng } from "../../types/habitat";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import { plotAnchorCoordinate } from "../../utils/habitatGeometry";
import { displayPlotNumber, localizedHabitatName, formatPlotDimensions } from "./cadastreFilterUtils";
import { theme } from "../../theme";

export const CARD_WIDTH = 288;
const CALLOUT_LIFT_GAP = 100;
const POINTER_HEIGHT = 22;
const PLOT_CARD_FADE_MS = 120;
const PLOT_SWITCH_MS = 200;
const PLOT_PAN_SYNC_MS = 32;
/** Design tokens for this card — warm accent + Airbnb-style neutral ink/gray scale. */
const ACCENT = theme["color-temporary-primary"];
const INK = "#222222";
const SUBTLE = "#717171";
const HAIRLINE = "rgba(0,0,0,0.06)";

export const HABITAT_CALLOUT_POINTER_OFFSET = CALLOUT_LIFT_GAP + POINTER_HEIGHT;

type CalloutRow = {
  key: string;
  label: string;
  value: string;
  icon: Icon;
};

function formatElevation(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value} m`;
}

function buildCalloutRows(
  plot: HabitatPlot,
  isRtl: boolean,
  arLabel: (key: string, fallback: string) => string,
): CalloutRow[] {
  const planName = localizedHabitatName(
    isRtl,
    plot.plan?.name,
    plot.plan?.name_ar,
  );
  const planCode = plot.plan?.code?.trim() || "";
  const sectorName = localizedHabitatName(
    isRtl,
    plot.sector?.name,
    plot.sector?.name_ar,
  );
  const sectorCode = plot.sector?.code?.trim() || "";
  const area = plot.area_m2 ?? plot.area_rounded;
  const plotNo = displayPlotNumber(plot.plot_number);

  return [
    {
      key: "district",
      label: arLabel("habitatCadastre.card.zone", "المنطقة"),
      value: (planName || planCode || "—").toLowerCase(),
      icon: MapPin,
    },
    {
      key: "module",
      label: arLabel("habitatCadastre.card.module", "الوحدة"),
      value: sectorCode || sectorName || "—",
      icon: Buildings,
    },
    {
      key: "number",
      label: arLabel("habitatCadastre.card.plotNumber", "رقم القطعة"),
      value: plotNo || "—",
      icon: Hash,
    },
    {
      key: "area",
      label: arLabel("habitatCadastre.card.areaSize", "المساحة"),
      value: area != null && Number(area) > 0 ? `${area} m²` : "—",
      icon: Ruler,
    },
    {
      key: "elevation",
      label: arLabel("habitatCadastre.card.elevation", "الارتفاع"),
      value: formatElevation(plot.el_value),
      icon: Mountains,
    },
    {
      key: "dimensions",
      label: arLabel("habitatCadastre.card.sides", "الأضلاع"),
      value: formatPlotDimensions(plot),
      icon: ArrowsOutSimple,
    },
  ];
}

const CalloutPointer = memo(function CalloutPointer() {
  return (
    <View style={styles.pointerWrap} pointerEvents="none">
      <View style={styles.pointerDiamond} />
    </View>
  );
});

export const HabitatPlotCalloutCard = memo(function HabitatPlotCalloutCard({
  plot,
  onClose,
  onViewAllDetails,
}: {
  plot: HabitatPlot;
  onClose: () => void;
  onViewAllDetails?: (plot: HabitatPlot) => void;
}) {
  const { t, i18n } = useTranslation();
  const isRtl =
    I18nManager.isRTL || (i18n.language || "").toLowerCase().startsWith("ar");
  const isForSale = plot.is_for_sale === true;

  const arLabel = useCallback(
    (key: string, fallback: string) =>
      i18n.t(key, { lng: "ar", defaultValue: fallback }),
    [i18n],
  );

  const rows = useMemo(
    () => buildCalloutRows(plot, isRtl, arLabel),
    [plot, isRtl, arLabel],
  );

  const dismiss = () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const openListing = () => {
    if (!isForSale || !onViewAllDetails) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onViewAllDetails(plot);
  };

  return (
    <View style={styles.cardShadowWrap}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo-bg-white.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          {isForSale ? (
            <View style={styles.forSalePill}>
              <View style={styles.forSaleDot} />
              <Text style={styles.forSalePillText}>
                {t("habitatCadastre.card.forSale", "For sale")}
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={dismiss}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Close")}
          >
            <MaterialIcons name="close" size={16} color={INK} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {rows.map((row) => {
            const RowIcon = row.icon;
            return (
              <View key={row.key} style={styles.gridCell}>
                <View style={styles.gridIconWrap}>
                  <RowIcon size={15} color={ACCENT} weight="bold" />
                </View>
                <View style={styles.gridTextWrap}>
                  <Text style={styles.gridValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {isForSale && onViewAllDetails ? (
          <Pressable
            style={({ pressed }) => [
              styles.saleCta,
              pressed && styles.saleCtaPressed,
            ]}
            onPress={openListing}
            accessibilityRole="button"
            accessibilityLabel={t(
              "habitatCadastre.card.viewListing",
              "View listing",
            )}
          >
            <Text style={styles.saleCtaText}>
              {t("habitatCadastre.card.viewListing", "View listing")}
            </Text>
            <CaretRight
              size={15}
              color="#FFFFFF"
              weight="bold"
              style={isRtl ? styles.caretRtl : undefined}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

/** Native pin — always locked to the plot's lat/lng on the map. */
export const HabitatPlotPinMarker = memo(function HabitatPlotPinMarker({
  coordinate,
  onPress,
}: {
  coordinate: LatLng;
  onPress?: () => void;
}) {
  const pinScale = useSharedValue(1);

  useEffect(() => {
    pinScale.value = 1.4;
    pinScale.value = withTiming(1, {
      duration: PLOT_SWITCH_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [coordinate.latitude, coordinate.longitude, pinScale]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinScale.value }],
  }));

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={1001}
      tracksViewChanges={false}
      tappable={!!onPress}
      onPress={onPress}
    >
      <Animated.View style={[styles.pinDot, pinStyle]} pointerEvents="none" />
    </Marker>
  );
});

export const HABITAT_PLOT_PREVIEW_HEIGHT = 0;

/** Parent bumps this ref on map pan/zoom — avoids re-rendering the map tree. */
export type PlotCalloutRegionSyncRef = React.MutableRefObject<
  (() => void) | null
>;

type OverlayProps = {
  mapRef: React.RefObject<CadastreMapHandle | null>;
  plot: HabitatPlot;
  coordinate: LatLng;
  regionSyncRef: PlotCalloutRegionSyncRef;
  regionIdleSyncRef?: PlotCalloutRegionSyncRef;
  onClose: () => void;
  onViewAllDetails?: (plot: HabitatPlot) => void;
};

/** Card floated above the plot using map projection (pointForCoordinate). */
export const HabitatPlotCalloutOverlay = memo(
  function HabitatPlotCalloutOverlay({
    mapRef,
    plot,
    coordinate,
    regionSyncRef,
    regionIdleSyncRef,
    onClose,
    onViewAllDetails,
  }: OverlayProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);
    const cardContentOpacity = useSharedValue(1);
    const cardScale = useSharedValue(1);

    const cardHeightRef = useRef(320);
    const readyRef = useRef(false);
    const mountedRef = useRef(true);
    const prevPlotIdRef = useRef<number | null>(null);
    const syncGenRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const lastSyncAtRef = useRef(0);

    const applyScreenPoint = useCallback(
      (x: number, y: number) => {
        if (!mountedRef.current) return;
        const stackHeight =
          cardHeightRef.current + HABITAT_CALLOUT_POINTER_OFFSET;
        translateX.value = x - CARD_WIDTH / 2;
        translateY.value = y - stackHeight;
        if (!readyRef.current) {
          readyRef.current = true;
          overlayOpacity.value = withTiming(1, { duration: PLOT_CARD_FADE_MS });
        }
      },
      [overlayOpacity, translateX, translateY],
    );

    const syncScreenPoint = useCallback(async () => {
      if (!mountedRef.current) return;
      const map = mapRef.current;
      if (!map?.pointForCoordinate) return;
      const gen = ++syncGenRef.current;
      try {
        const point = await map.pointForCoordinate(coordinate);
        if (!mountedRef.current || gen !== syncGenRef.current) return;
        if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
          applyScreenPoint(point.x, point.y);
        }
      } catch {
        /* map not ready */
      }
    }, [applyScreenPoint, coordinate, mapRef]);

    const scheduleSync = useCallback(() => {
      if (!mountedRef.current) return;
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        void syncScreenPoint();
      });
    }, [syncScreenPoint]);

    const scheduleSyncThrottled = useCallback(() => {
      if (!mountedRef.current) return;
      const now = Date.now();
      if (now - lastSyncAtRef.current < PLOT_PAN_SYNC_MS) return;
      lastSyncAtRef.current = now;
      scheduleSync();
    }, [scheduleSync]);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        syncGenRef.current += 1;
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      regionSyncRef.current = scheduleSyncThrottled;
      return () => {
        regionSyncRef.current = null;
        readyRef.current = false;
      };
    }, [regionSyncRef, scheduleSyncThrottled]);

    useEffect(() => {
      if (!regionIdleSyncRef) return;
      regionIdleSyncRef.current = scheduleSync;
      return () => {
        regionIdleSyncRef.current = null;
      };
    }, [regionIdleSyncRef, scheduleSync]);

    useEffect(() => {
      const switched =
        prevPlotIdRef.current != null && prevPlotIdRef.current !== plot.id;
      if (switched) {
        cardScale.value = 0.97;
        cardContentOpacity.value = withTiming(0.62, { duration: 90 }, (finished) => {
          if (finished) {
            cardContentOpacity.value = withTiming(1, { duration: PLOT_SWITCH_MS });
          }
        });
        cardScale.value = withTiming(1, {
          duration: PLOT_SWITCH_MS,
          easing: Easing.out(Easing.cubic),
        });
      }
      prevPlotIdRef.current = plot.id ?? null;
    }, [plot.id, cardContentOpacity, cardScale]);

    useEffect(() => {
      if (!readyRef.current) {
        overlayOpacity.value = 0;
      }
      syncGenRef.current += 1;
      void syncScreenPoint();
      const followUp = requestAnimationFrame(() => {
        void syncScreenPoint();
      });
      return () => {
        cancelAnimationFrame(followUp);
        syncGenRef.current += 1;
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, [
      coordinate.latitude,
      coordinate.longitude,
      overlayOpacity,
      plot.id,
      syncScreenPoint,
    ]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: overlayOpacity.value,
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      opacity: cardContentOpacity.value,
      transform: [{ scale: cardScale.value }],
    }));

    const handleCardLayout = useCallback(
      (height: number) => {
        if (height > 0 && Math.abs(height - cardHeightRef.current) > 2) {
          cardHeightRef.current = height;
          scheduleSync();
        }
      },
      [scheduleSync],
    );

    return (
      <Animated.View
        pointerEvents="box-none"
        collapsable={false}
        style={[styles.overlayHost, animatedStyle]}
      >
        <Animated.View style={cardAnimatedStyle}>
          <CalloutCardMeasure onHeight={handleCardLayout}>
            <HabitatPlotCalloutCard
              plot={plot}
              onClose={onClose}
              onViewAllDetails={onViewAllDetails}
            />
          </CalloutCardMeasure>
        </Animated.View>
        <View style={styles.liftGap} pointerEvents="none" />
        <CalloutPointer />
      </Animated.View>
    );
  },
);

const CalloutCardMeasure = memo(function CalloutCardMeasure({
  children,
  onHeight,
}: {
  children: React.ReactNode;
  onHeight: (height: number) => void;
}) {
  return (
    <View
      onLayout={(e) => {
        onHeight(e.nativeEvent.layout.height);
      }}
    >
      {children}
    </View>
  );
});

export function resolveSelectedPlotCoordinate(
  plot: HabitatPlot | null | undefined,
): LatLng | null {
  if (!plot) return null;
  return plotAnchorCoordinate(plot);
}

const styles = StyleSheet.create({
  overlayHost: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CARD_WIDTH,
    zIndex: 10220,
    elevation: 10220,
    alignItems: "center",
  },
  cardShadowWrap: {
    width: CARD_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: { elevation: 14 },
    }),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  forSalePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  forSaleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DC2626",
  },
  forSalePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    letterSpacing: 0.2,
  },
  closeBtn: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    paddingTop: 12,
  },
  gridCell: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  gridIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(209, 96, 36, 0.1)",
  },
  gridTextWrap: { flex: 1, minWidth: 0 },
  gridValue: {
    fontSize: 13,
    fontWeight: "700",
    color: INK,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: SUBTLE,
    marginTop: 1,
  },
  saleCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: "#DC2626",
  },
  saleCtaPressed: { opacity: 0.85 },
  saleCtaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  caretRtl: {
    transform: [{ scaleX: -1 }],
  },
  liftGap: { width: CARD_WIDTH, height: CALLOUT_LIFT_GAP },
  pointerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH,
    height: POINTER_HEIGHT,
  },
  pointerDiamond: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    marginTop: -POINTER_HEIGHT / 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
});
