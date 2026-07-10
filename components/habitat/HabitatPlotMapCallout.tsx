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
import { CaretRight } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import type { HabitatPlot, LatLng } from "../../types/habitat";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import { plotAnchorCoordinate } from "../../utils/habitatGeometry";
import { displayPlotNumber, localizedHabitatName, formatPlotDimensions } from "./cadastreFilterUtils";
import { theme } from "../../theme";

export const CARD_WIDTH = 272;
const CALLOUT_LIFT_GAP = 100;
const POINTER_HEIGHT = 28;
const PLOT_CARD_FADE_MS = 140;
const PLOT_SWITCH_MS = 260;
const PINK = theme["color-temporary-primary"];

export const HABITAT_CALLOUT_POINTER_OFFSET = CALLOUT_LIFT_GAP + POINTER_HEIGHT;

type CalloutRow = { key: string; label: string; value: string };

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
    },
    // {
    //   key: "extension",
    //   label: arLabel("habitatCadastre.card.plan", "المخطط"),
    //   value: planCode || planName || "—",
    // },
    {
      key: "module",
      label: arLabel("habitatCadastre.card.module", "الوحدة"),
      value: sectorCode || sectorName || "—",
    },
    {
      key: "number",
      label: arLabel("habitatCadastre.card.plotNumber", "رقم القطعة"),
      value: plotNo || "—",
    },
    {
      key: "area",
      label: arLabel("habitatCadastre.card.areaSize", "المساحة"),
      value: area != null && Number(area) > 0 ? `${area} m²` : "—",
    },
    {
      key: "elevation",
      label: arLabel("habitatCadastre.card.elevation", "الارتفاع"),
      value: formatElevation(plot.el_value),
    },
    {
      key: "dimensions",
      label: arLabel("habitatCadastre.card.sides", "الأضلاع"),
      value: formatPlotDimensions(plot),
    },
  ];
}

const CalloutPointer = memo(function CalloutPointer() {
  return (
    <View style={styles.pointerWrap} pointerEvents="none">
      <View style={styles.pointerOuter} />
      <View style={styles.pointerInner} />
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
        <View style={[styles.headerStripe, styles.headerStripeGreen]}>
          {/* <Text style={styles.headerStripeTitle} numberOfLines={1}>
            {t("onboarding.welcome.meskeny", "MESKENY")}
          </Text> */}
          {/*  add here a logo */}
          <Image
            source={require("../../assets/logo-bg-white.png")}
            style={{
              width: 40,
              height: 40,
            }}
          />
          <Pressable
            onPress={dismiss}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Close")}
          >
            <MaterialIcons name="close" size={18} color="#374151" />
          </Pressable>
        </View>

        {/* <View style={[styles.headerStripe, styles.headerStripeLavender]}>
          <View style={[styles.logoCircle, styles.logoCircleAlt]}>
            <Text style={styles.logoTextAlt}>⌂</Text>
          </View>
          <Text style={styles.headerStripeSubtitle} numberOfLines={1}>
            {arLabel("habitatCadastre.card.officialRecord", "قطعة مسحية")}
          </Text>
        </View> */}

        <View style={styles.table}>
          {rows.map((row, index) => (
            <View
              key={row.key}
              style={[
                styles.tableRow,
                index === rows.length - 1 && styles.tableRowLast,
              ]}
            >
              <Text style={styles.valueCell} numberOfLines={3}>
                {row.value}
              </Text>
              <View style={styles.colDivider} />
              <Text style={styles.labelCell} numberOfLines={2}>
                {row.label}
              </Text>
            </View>
          ))}
        </View>

        {isForSale && onViewAllDetails ? (
          <View style={styles.saleFooter}>
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>
                {t("habitatCadastre.card.forSale", "For sale")}
              </Text>
            </View>
            <Pressable
              style={styles.saleCta}
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
                size={14}
                color="#B91C1C"
                weight="bold"
                style={isRtl ? styles.caretRtl : undefined}
              />
            </Pressable>
          </View>
        ) : null}

        {/* <View style={styles.footer}>
          <Text style={styles.footerBrand}>meskeny</Text>
        </View> */}
      </View>
    </View>
  );
});

/** Native pin — always locked to the plot's lat/lng on the map. */
export const HabitatPlotPinMarker = memo(function HabitatPlotPinMarker({
  coordinate,
}: {
  coordinate: LatLng;
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
      tappable={false}
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
    const prevPlotIdRef = useRef<number | null>(null);
    const syncGenRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    const applyScreenPoint = useCallback(
      (x: number, y: number) => {
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
      const map = mapRef.current;
      if (!map?.pointForCoordinate) return;
      const gen = ++syncGenRef.current;
      try {
        const point = await map.pointForCoordinate(coordinate);
        if (gen !== syncGenRef.current) return;
        if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
          applyScreenPoint(point.x, point.y);
        }
      } catch {
        /* map not ready */
      }
    }, [applyScreenPoint, coordinate, mapRef]);

    const scheduleSync = useCallback(() => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        void syncScreenPoint();
      });
    }, [syncScreenPoint]);

    useEffect(() => {
      regionSyncRef.current = scheduleSync;
      return () => {
        regionSyncRef.current = null;
        readyRef.current = false;
      };
    }, [regionSyncRef, scheduleSync]);

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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    overflow: "hidden",
  },
  closeBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 13,
  },
  headerStripe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#B8B8B8",
  },
  headerStripeGreen: {
    backgroundColor: "#FFF",
  },
  headerStripeLavender: { backgroundColor: "#DDD6F3" },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircleAlt: { backgroundColor: "#F8F7FF" },
  logoText: { fontSize: 12, fontWeight: "800", color: "#166534" },
  logoTextAlt: { fontSize: 13, fontWeight: "700", color: "#5B4B8A" },
  headerStripeTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.8,
  },
  headerStripeSubtitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
    writingDirection: "rtl",
  },
  table: { borderTopWidth: 0 },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 34,
    borderBottomWidth: 1,
    borderBottomColor: "#C8C8C8",
    backgroundColor: "#FFFFFF",
  },
  tableRowLast: { borderBottomWidth: 0 },
  valueCell: {
    flex: 0.56,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    textAlign: "left",
  },
  labelCell: {
    flex: 0.44,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "right",
    writingDirection: "rtl",
  },
  colDivider: { width: 1, backgroundColor: "#C8C8C8" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#C8C8C8",
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    letterSpacing: 0.3,
  },
  saleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#FEF2F2",
  },
  saleBadge: {
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B91C1C",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  saleCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  saleCtaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B91C1C",
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
  pointerOuter: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 13,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#B0B0B0",
  },
  pointerInner: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PINK,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
