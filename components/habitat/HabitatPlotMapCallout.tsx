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
/** Cadastre-sheet table border — visible hairline like the official document. */
const TABLE_BORDER = "#D8DCE1";

export const HABITAT_CALLOUT_POINTER_OFFSET = CALLOUT_LIFT_GAP + POINTER_HEIGHT;

type CalloutRow = {
  key: string;
  label: string;
  value: string;
};

function formatElevation(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value} m`;
}

/**
 * Official cadastre sheet rows — matches the reference table exactly:
 * المقاطعة (district/plan), المنطقة (zone/sector), القطعة (plot no.),
 * المساحة (area), الإرتفاع (elevation), الأضلاع (side lengths).
 * Labels are always Arabic on the right, values Latin on the left, like the
 * paper cadastre document, regardless of app language.
 */
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
  const elevation =
    plot.el_value != null
      ? plot.el_value
      : plot.il_value != null && Number.isFinite(Number(plot.il_value))
        ? Number(plot.il_value)
        : null;

  return [
    {
      key: "district",
      label: arLabel("habitatCadastre.card.district", "المقاطعة"),
      value: (planName || planCode || "—").toLowerCase(),
    },
    {
      key: "zone",
      label: arLabel("habitatCadastre.card.zone", "المنطقة"),
      value: sectorName || sectorCode || "—",
    },
    {
      key: "number",
      label: arLabel("habitatCadastre.card.plotNumber", "القطعة"),
      value: plotNo || "—",
    },
    {
      key: "area",
      label: arLabel("habitatCadastre.card.areaSize", "المساحة"),
      value: area != null && Number(area) > 0 ? `${area} m²` : "—",
    },
    {
      key: "elevation",
      label: arLabel("habitatCadastre.card.elevation", "الإرتفاع"),
      value: formatElevation(elevation),
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

  const subSectorName = useMemo(() => {
    const s = plot.sub_sector;
    const name = localizedHabitatName(isRtl, s?.name, s?.name_ar);
    return (name || plot.sub_sector_code || "").trim();
  }, [plot, isRtl]);

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
        <View style={styles.table}>
          {rows.map((row, idx) => (
            <View
              key={row.key}
              style={[styles.tableRow, idx === rows.length - 1 && !subSectorName && styles.tableRowLast]}
            >
              <View style={styles.valueCell}>
                {idx === 0 ? (
                  <Pressable
                    onPress={dismiss}
                    hitSlop={12}
                    style={styles.closeBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.close", "Close")}
                  >
                    <MaterialIcons name="close" size={15} color={INK} />
                  </Pressable>
                ) : null}
                <Text style={styles.valueText} numberOfLines={2}>
                  {row.value}
                </Text>
                {row.key === "elevation" ? (
                  <MaterialIcons
                    name="info-outline"
                    size={14}
                    color={SUBTLE}
                    style={styles.infoIcon}
                  />
                ) : null}
              </View>
              <View style={styles.labelCell}>
                <Text style={styles.labelText} numberOfLines={1}>
                  {row.label}
                </Text>
              </View>
            </View>
          ))}
          {subSectorName ? (
            <View style={[styles.tableRow, styles.tableRowLast]}>
              <View style={styles.footerCell}>
                <Text style={styles.footerText} numberOfLines={1}>
                  {subSectorName}
                </Text>
              </View>
            </View>
          ) : null}
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
    borderRadius: 10,
    overflow: "hidden",
  },
  closeBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    marginLeft: "auto",
  },
  /**
   * Official cadastre sheet table — full-width bordered rows, value cell on
   * the left (Latin), Arabic label cell on the right with a light header
   * tint, exactly like the paper/web cadastre document. Direction is forced
   * LTR so the layout matches the reference in RTL app language too.
   */
  table: {
    alignSelf: "stretch",
  },
  tableRow: {
    flexDirection: "row",
    direction: "ltr",
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
    minHeight: 38,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  valueCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  valueText: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: "600",
    color: INK,
    textAlign: "left",
  },
  labelCell: {
    width: 104,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F5F6F8",
    borderLeftWidth: 1,
    borderLeftColor: TABLE_BORDER,
  },
  labelText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: INK,
    textAlign: "right",
    writingDirection: "rtl",
  },
  footerCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: SUBTLE,
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
