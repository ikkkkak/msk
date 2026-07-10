import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import MapView, { Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, { FadeIn } from "react-native-reanimated";
import { MapPin } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { regionForLandmarkDetailMap } from "../utils/landmarkMapGeometry";
import type { PropertyRecommendation } from "../../services/aiService";

type LatLng = { latitude: number; longitude: number };

function toMapCoords(
  corners: NonNullable<PropertyRecommendation["plot_corners"]>,
): LatLng[] {
  return corners
    .filter((c) => typeof c.lat === "number" && typeof c.lng === "number")
    .map((c) => ({ latitude: c.lat, longitude: c.lng }));
}

type Props = {
  rec: PropertyRecommendation;
  compact?: boolean;
};

export function AILandPlotMap({ rec, compact = false }: Props) {
  const { t } = useTranslation();

  const ring = useMemo(
    () => toMapCoords(rec.plot_corners ?? []),
    [rec.plot_corners],
  );

  const region = useMemo(() => {
    if (ring.length >= 3) {
      const r = regionForLandmarkDetailMap(ring);
      if (r) return r;
    }
    if (typeof rec.lat === "number" && typeof rec.lng === "number") {
      return {
        latitude: rec.lat,
        longitude: rec.lng,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      };
    }
    return null;
  }, [ring, rec.lat, rec.lng]);

  if (!region || ring.length < 3) return null;

  const height = compact ? 140 : 220;

  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.wrap}>
      <View style={styles.labelRow}>
        <MapPin size={14} color="#484848" weight="fill" />
        <Text style={styles.label}>
          {rec.plot_number
            ? t("aiChat.plotNumber", {
                defaultValue: "Plot {{number}}",
                number: rec.plot_number,
              })
            : t("aiChat.plotBoundary", "Plot boundary")}
        </Text>
        {rec.size_m2 ? (
          <Text style={styles.area}>{Math.round(rec.size_m2)} m²</Text>
        ) : null}
      </View>
      <View style={[styles.mapShell, { height }]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          mapType="satellite"
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsBuildings={false}
          toolbarEnabled={false}
        >
          <Polygon
            coordinates={ring}
            strokeColor="#DA8050"
            strokeWidth={2.5}
            fillColor="rgba(218, 128, 80, 0.22)"
          />
        </MapView>
      </View>
      {(rec.location_label || rec.city) && !compact ? (
        <Text style={styles.loc} numberOfLines={1}>
          {rec.location_label || rec.city}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
  },
  area: {
    fontSize: 12,
    fontWeight: "600",
    color: "#717171",
  },
  mapShell: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#ECECEC",
  },
  loc: {
    fontSize: 12,
    color: "#717171",
    paddingHorizontal: 2,
  },
});
