import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ui-kitten/components";
import MapView, { Marker } from "react-native-maps";
import { getMapProvider } from "../utils/mapProvider";
import { getPlatformMapViewConfig } from "../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "./map/PlatformMapTileLayer";
import {
  MapPin,
  House,
  GraduationCap,
  FirstAid,
  ForkKnife,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import {
  MAP_CONFIGS,
  MAP_PERFORMANCE,
  MAP_UI,
  MAP_ZOOM_LEVELS,
  getSafeCoordinates,
  isValidCoordinate,
} from "../config/maps.config";

const BLACK = "#222222";
const MUTED = "#484848";
const DARK_MUTED = "#484848";
const ACCENT = "#C9A96E";

const getMultiMarker = (
  icon: React.ReactNode,
  color: string,
  deeperColor: string,
) => (
  <View style={styles.multiMarkerOuter}>
    <View style={[styles.multiMarkerMid, { backgroundColor: deeperColor }]}>
      <View style={[styles.multiMarkerInner, { backgroundColor: color }]}>
        {icon}
      </View>
    </View>
  </View>
);

type NearbyPlaces = {
  schools?: any[];
  hospitals?: any[];
  restaurants?: any[];
} | null;

type ExactLocationData = {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
};

export default function ExactLocationMapSection({
  sectionStyle,
  hasCoordinates,
  data,
  nearby,
}: {
  sectionStyle?: any;
  hasCoordinates: boolean;
  data: Partial<ExactLocationData> | null | undefined;
  nearby?: NearbyPlaces;
}) {
  const { t } = useTranslation();

  const markerCoordinate = useMemo(
    () => getSafeCoordinates(data?.latitude, data?.longitude),
    [data?.latitude, data?.longitude],
  );

  const initialRegion = useMemo(
    () => ({
      ...markerCoordinate,
      ...MAP_ZOOM_LEVELS.STREET,
    }),
    [markerCoordinate.latitude, markerCoordinate.longitude],
  );

  const addressText = useMemo(() => {
    if (!data) {
      return t("locationNouakchott", "Nouakchott, Mauritania");
    }
    if (data.address) return data.address;
    const parts = [data.city, data.state, data.country].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return t("locationNouakchott", "Nouakchott, Mauritania");
  }, [data, t]);

  const locationCaption = hasCoordinates
    ? addressText
    : t(
        "propertySaleDetails.location.approximate",
        "Approximate area — exact pin unavailable",
      );

  return (
    <View style={sectionStyle}>
      <Text style={styles.sectionTitle}>
        {t("propertySaleDetails.location.exactLocation", "Location")}
      </Text>

      <MapView
        provider={getMapProvider()}
        style={styles.map}
        mapType={getPlatformMapViewConfig("standard").mapType}
        initialRegion={initialRegion}
        {...MAP_CONFIGS.PROPERTY_DETAILS}
        {...MAP_UI}
        {...MAP_PERFORMANCE}
        zoomTapEnabled={false}
        scrollDuringRotateOrZoomEnabled={false}
      >
        <PlatformMapTileLayer mapStyle="standard" />
        <Marker coordinate={markerCoordinate} tracksViewChanges={false}>
          {getMultiMarker(
            <House size={22} color={ACCENT} weight="fill" />,
            "#FFFBF5",
            "#E7D5BA",
          )}
        </Marker>

        {hasCoordinates &&
          nearby?.schools?.map((p: any, i: number) => {
            const lat = p?.latitude ?? p?.lat;
            const lng = p?.longitude ?? p?.lng;
            if (!isValidCoordinate(lat, lng)) return null;
            return (
              <Marker
                key={`s-${i}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                {getMultiMarker(
                  <GraduationCap size={22} color="#0066CC" weight="fill" />,
                  "#E8F0FB",
                  "#C6DAF8",
                )}
              </Marker>
            );
          })}

        {hasCoordinates &&
          nearby?.hospitals?.map((p: any, i: number) => {
            const lat = p?.latitude ?? p?.lat;
            const lng = p?.longitude ?? p?.lng;
            if (!isValidCoordinate(lat, lng)) return null;
            return (
              <Marker
                key={`h-${i}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                {getMultiMarker(
                  <FirstAid size={22} color="#DC2626" weight="fill" />,
                  "#FCEAEA",
                  "#F7B8B8",
                )}
              </Marker>
            );
          })}

        {hasCoordinates &&
          nearby?.restaurants?.map((p: any, i: number) => {
            const lat = p?.latitude ?? p?.lat;
            const lng = p?.longitude ?? p?.lng;
            if (!isValidCoordinate(lat, lng)) return null;
            return (
              <Marker
                key={`r-${i}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                {getMultiMarker(
                  <ForkKnife size={22} color="#F59E0B" weight="fill" />,
                  "#FFF4E0",
                  "#F8DFB9",
                )}
              </Marker>
            );
          })}
      </MapView>

      <View style={styles.mapAddrRow}>
        <MapPin size={14} color={MUTED} weight="fill" />
        <Text style={styles.mapAddrText}>{locationCaption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: BLACK,
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 26,
    fontFamily: "CircularStd-Bold",
  },
  map: { height: 230, borderRadius: 12, overflow: "hidden" },
  multiMarkerOuter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,52,52,0.06)",
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: "#BBB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 7,
    elevation: 5,
  },
  multiMarkerMid: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEE",
  },
  multiMarkerInner: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  mapAddrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  mapAddrText: { fontSize: 12, color: DARK_MUTED, flex: 1, lineHeight: 18 },
});
