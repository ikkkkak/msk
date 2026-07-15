/**
 * Selected land listing — image card anchored to parcel centroid on the cadastre map.
 */
import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { CaretRight } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import type { LatLng } from "../../types/habitat";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";
import {
  landmarkCentroid,
  landmarkDisplayPrice,
  landmarkDisplayTitle,
  landmarkMarkerImage,
  type MapLandmarkRecord,
} from "../../utils/landmarkMapMarkers";
import { theme } from "../../theme";

export const LAND_CARD_WIDTH = 280;
const LIFT_GAP = 96;
const POINTER_HEIGHT = 24;
export const LAND_CALLOUT_POINTER_OFFSET = LIFT_GAP + POINTER_HEIGHT;
const LAND_CARD_FADE_MS = 120;
const LAND_SWITCH_MS = 200;
const LAND_CLOSE_MS = 120;
const LAND_PAN_SYNC_MS = 32;
const BRAND = theme["color-temporary-primary"];

export const HabitatLandMapCalloutCard = memo(function HabitatLandMapCalloutCard({
  landmark,
  onClose,
  onViewDetails,
}: {
  landmark: MapLandmarkRecord;
  onClose: () => void;
  onViewDetails?: (landmark: MapLandmarkRecord) => void;
}) {
  const { t } = useTranslation();
  const imageUrl = landmarkMarkerImage(landmark);
  const title = landmarkDisplayTitle(landmark);
  const price = landmarkDisplayPrice(landmark);
  const area = Number(landmark.area);
  const areaUnit = String(landmark.area_unit || "m²");
  const sides = Array.isArray(landmark.sides) ? landmark.sides : [];

  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <MaterialIcons name="close" size={16} color="#444" />
        </Pressable>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <MaterialIcons name="landscape" size={28} color="#FFF" />
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {price ? <Text style={styles.price}>{price}</Text> : null}
          {Number.isFinite(area) && area > 0 ? (
            <Text style={styles.meta}>
              {area.toLocaleString()} {areaUnit}
              {landmark.zone_name ? ` · ${landmark.zone_name}` : ""}
            </Text>
          ) : null}
          {sides.length > 0 ? (
            <Text style={styles.sides} numberOfLines={2}>
              {t("landmark.map.sides", "Sides")}: {sides.join(" × ")}
            </Text>
          ) : null}

          {onViewDetails ? (
            <Pressable
              style={styles.cta}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onViewDetails(landmark);
              }}
            >
              <Text style={styles.ctaText}>
                {t("landmark.map.viewDetails", "View listing")}
              </Text>
              <CaretRight size={14} color="#FFFFFF" weight="bold" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
});

export const HabitatLandMapCalloutOverlay = memo(function HabitatLandMapCalloutOverlay({
  mapRef,
  landmark,
  coordinate,
  regionSyncRef,
  regionIdleSyncRef,
  dismissRef,
  onClose,
  onViewDetails,
}: {
  mapRef: React.RefObject<CadastreMapHandle | null>;
  landmark: MapLandmarkRecord;
  coordinate: LatLng;
  regionSyncRef?: React.MutableRefObject<(() => void) | null>;
  regionIdleSyncRef?: React.MutableRefObject<(() => void) | null>;
  dismissRef?: React.MutableRefObject<(() => void) | null>;
  onClose: () => void;
  onViewDetails?: (landmark: MapLandmarkRecord) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const cardContentOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const cardHeightRef = useRef(180);
  const readyRef = useRef(false);
  const mountedRef = useRef(true);
  const closingRef = useRef(false);
  const prevLandIdRef = useRef<number | null>(null);
  const syncGenRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const applyScreenPoint = useCallback(
    (x: number, y: number) => {
      if (!mountedRef.current || closingRef.current) return;
      const stackHeight = cardHeightRef.current + LAND_CALLOUT_POINTER_OFFSET;
      translateX.value = x - LAND_CARD_WIDTH / 2;
      translateY.value = y - stackHeight;
      if (!readyRef.current) {
        readyRef.current = true;
        overlayOpacity.value = withTiming(1, { duration: LAND_CARD_FADE_MS });
      }
    },
    [overlayOpacity, translateX, translateY],
  );

  const syncScreenPoint = useCallback(async () => {
    if (!mountedRef.current || closingRef.current) return;
    const map = mapRef.current;
    if (!map?.pointForCoordinate) return;
    const gen = ++syncGenRef.current;
    try {
      const point = await map.pointForCoordinate(coordinate);
      if (!mountedRef.current || closingRef.current) return;
      if (gen !== syncGenRef.current) return;
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        applyScreenPoint(point.x, point.y);
      }
    } catch {
      /* map not ready */
    }
  }, [applyScreenPoint, coordinate, mapRef]);

  const scheduleSync = useCallback(() => {
    if (!mountedRef.current || closingRef.current) return;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      void syncScreenPoint();
    });
  }, [syncScreenPoint]);

  const lastSyncAtRef = useRef(0);
  const scheduleSyncThrottled = useCallback(() => {
    if (!mountedRef.current || closingRef.current) return;
    const now = Date.now();
    if (now - lastSyncAtRef.current < LAND_PAN_SYNC_MS) return;
    lastSyncAtRef.current = now;
    scheduleSync();
  }, [scheduleSync]);

  const finishClose = useCallback(() => {
    if (!mountedRef.current) return;
    onClose();
  }, [onClose]);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    syncGenRef.current += 1;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (regionSyncRef) regionSyncRef.current = null;
    Haptics.selectionAsync().catch(() => {});
    overlayOpacity.value = withTiming(0, { duration: LAND_CLOSE_MS }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  }, [finishClose, overlayOpacity, regionSyncRef]);

  useEffect(() => {
    mountedRef.current = true;
    closingRef.current = false;
    return () => {
      mountedRef.current = false;
      closingRef.current = true;
      syncGenRef.current += 1;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (dismissRef) dismissRef.current = dismiss;
    return () => {
      if (dismissRef) dismissRef.current = null;
    };
  }, [dismiss, dismissRef]);

  useEffect(() => {
    if (regionSyncRef) regionSyncRef.current = scheduleSyncThrottled;
    return () => {
      if (regionSyncRef) regionSyncRef.current = null;
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
      prevLandIdRef.current != null && prevLandIdRef.current !== landmark.id;
    if (switched) {
      closingRef.current = false;
      cardScale.value = 0.97;
      cardContentOpacity.value = withTiming(0.62, { duration: 90 }, (finished) => {
        if (finished) {
          cardContentOpacity.value = withTiming(1, { duration: LAND_SWITCH_MS });
        }
      });
      cardScale.value = withTiming(1, { duration: LAND_SWITCH_MS });
    }
    prevLandIdRef.current = landmark.id ?? null;
  }, [landmark.id, cardContentOpacity, cardScale]);

  useEffect(() => {
    if (!readyRef.current) {
      overlayOpacity.value = 0;
    }
    closingRef.current = false;
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
    landmark.id,
    overlayOpacity,
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

  return (
    <Animated.View
      pointerEvents="box-none"
      collapsable={false}
      style={[styles.overlayHost, animatedStyle]}
    >
      <Animated.View style={cardAnimatedStyle}>
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - cardHeightRef.current) > 2) {
              cardHeightRef.current = h;
              scheduleSync();
            }
          }}
        >
          <HabitatLandMapCalloutCard
            landmark={landmark}
            onClose={dismiss}
            onViewDetails={onViewDetails}
          />
        </View>
      </Animated.View>
      <View style={styles.pointer} />
    </Animated.View>
  );
});

export function resolveLandmarkCoordinate(
  landmark: MapLandmarkRecord | null | undefined,
): LatLng | null {
  if (!landmark) return null;
  return landmarkCentroid(landmark);
}

const styles = StyleSheet.create({
  overlayHost: {
    position: "absolute",
    left: 0,
    top: 0,
    width: LAND_CARD_WIDTH,
    zIndex: 10230,
    elevation: 10230,
    alignItems: "center",
  },
  cardShadow: {
    width: LAND_CARD_WIDTH,
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
    width: LAND_CARD_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },
  hero: {
    width: "100%",
    height: 132,
    backgroundColor: "#E5E7EB",
  },
  heroPlaceholder: {
    width: "100%",
    height: 132,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    paddingRight: 24,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
  },
  sides: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  cta: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: BRAND,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: POINTER_HEIGHT,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFF",
    marginTop: -1,
  },
});
