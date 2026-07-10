/**
 * Redfin / Realtor-style map controls — top-right, grouped, high contrast.
 */
import React, { memo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  GlobeHemisphereWest,
  MapTrifold,
  Minus,
  Plus,
  Crosshair,
  Stack,
} from "phosphor-react-native";
import type { Region } from "react-native-maps";
import type { CadastreMapHandle } from "../../utils/habitatCadastreMapRef";

type MapType = "standard" | "satellite";

type Props = {
  mapRef: React.RefObject<CadastreMapHandle | null>;
  region: Region;
  mapType: MapType;
  onMapTypeChange: (type: MapType) => void;
  topOffset?: number;
  style?: ViewStyle;
  showZoom?: boolean;
  showMapType?: boolean;
  showLocate?: boolean;
  onLocate?: () => void;
  showLayers?: boolean;
  layersActive?: boolean;
  onLayersPress?: () => void;
};

const BTN = 44;
const ZOOM_FACTOR = 0.55;

function ToolbarBtn({
  onPress,
  active,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  active?: boolean;
  children: React.ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.btn,
        active && styles.btnActive,
        pressed && styles.btnPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

export const MapToolbar = memo(function MapToolbar({
  mapRef,
  region,
  mapType,
  onMapTypeChange,
  topOffset = 0,
  style,
  showZoom = true,
  showMapType = true,
  showLocate = false,
  onLocate,
  showLayers = false,
  layersActive = false,
  onLayersPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const top = insets.top + 10 + topOffset;

  const zoomBy = useCallback(
    (factor: number) => {
      const r = region;
      if (!mapRef.current) return;
      const next: Region = {
        latitude: r.latitude,
        longitude: r.longitude,
        latitudeDelta: Math.min(Math.max(r.latitudeDelta * factor, 0.0008), 2),
        longitudeDelta: Math.min(Math.max(r.longitudeDelta * factor, 0.0008), 2),
      };
      mapRef.current.animateToRegion(next, 280);
    },
    [mapRef, region],
  );

  const toggleMap = useCallback(() => {
    onMapTypeChange(mapType === "standard" ? "satellite" : "standard");
  }, [mapType, onMapTypeChange]);

  return (
    <View style={[styles.wrap, { top }, style]} pointerEvents="box-none">
      <View style={styles.group}>
        {showZoom ? (
          <>
            <ToolbarBtn
              onPress={() => zoomBy(ZOOM_FACTOR)}
              accessibilityLabel="Zoom in"
            >
              <Plus size={22} color="#111827" weight="bold" />
            </ToolbarBtn>
            <View style={styles.divider} />
            <ToolbarBtn
              onPress={() => zoomBy(1 / ZOOM_FACTOR)}
              accessibilityLabel="Zoom out"
            >
              <Minus size={22} color="#111827" weight="bold" />
            </ToolbarBtn>
            {(showMapType || showLocate) && <View style={styles.divider} />}
          </>
        ) : null}

        {showMapType ? (
          <>
            <ToolbarBtn
              onPress={toggleMap}
              active={mapType === "satellite"}
              accessibilityLabel={
                mapType === "satellite" ? "Map view" : "Satellite view"
              }
            >
              {mapType === "satellite" ? (
                <MapTrifold size={21} color="#111827" weight="duotone" />
              ) : (
                <GlobeHemisphereWest size={21} color="#111827" weight="duotone" />
              )}
            </ToolbarBtn>
            {showLocate ? <View style={styles.divider} /> : null}
          </>
        ) : null}

        {showLocate && onLocate ? (
          <>
            <ToolbarBtn onPress={onLocate} accessibilityLabel="My location">
              <Crosshair size={21} color="#111827" weight="bold" />
            </ToolbarBtn>
            {showLayers ? <View style={styles.divider} /> : null}
          </>
        ) : null}

        {showLayers && onLayersPress ? (
          <ToolbarBtn
            onPress={onLayersPress}
            active={layersActive}
            accessibilityLabel="Toggle zones"
          >
            <Stack
              size={21}
              color={layersActive ? "#2563EB" : "#111827"}
              weight={layersActive ? "fill" : "bold"}
            />
          </ToolbarBtn>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 14,
    zIndex: 200,
    alignItems: "flex-end",
  },
  group: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  btn: {
    width: BTN,
    height: BTN,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  btnActive: {
    backgroundColor: "#F3F4F6",
  },
  btnPressed: {
    backgroundColor: "#E5E7EB",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 8,
  },
});
