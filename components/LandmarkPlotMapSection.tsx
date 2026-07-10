import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "@ui-kitten/components";
import MapView, { Polyline } from "react-native-maps";
import { MapPin, NavigationArrow } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import type { LatLng } from "../types/habitat";
import { getMapProvider, isAppleMapsProvider } from "../utils/mapProvider";
import { theme } from "../theme";

const BLACK = "#222222";
const MUTED = "#484848";
const ACCENT = theme["color-temporary-primary"];
const BORDER = "#EBEBEB";

export type PlotMapDetail = {
  label: string;
  value: string;
};

type Props = {
  sectionStyle?: object;
  hasGeometry: boolean;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  polygonRings: LatLng[][];
  center: LatLng | null;
  locationLine: string;
  details: PlotMapDetail[];
  onOpenMaps?: () => void;
  onGetRoute?: () => void;
  fetchingRoute?: boolean;
  showRouteButton?: boolean;
  routeSummary?: string;
};

export default function LandmarkPlotMapSection({
  sectionStyle,
  hasGeometry,
  region,
  polygonRings,
  center,
  locationLine,
  details,
  onOpenMaps,
  onGetRoute,
  fetchingRoute,
  showRouteButton,
  routeSummary,
}: Props) {
  const { t } = useTranslation();

  const visibleDetails = useMemo(
    () => details.filter((d) => d.value && d.value !== "—"),
    [details],
  );

  const primaryRing = polygonRings[0] ?? [];

  return (
    <View style={sectionStyle}>
      <Text style={styles.sectionTitle}>
        {t("landmark.sections.plotOnMap", "Plot on map")}
      </Text>
      <Text style={styles.sectionSub}>
        {t(
          "landmark.sections.plotOnMapSub",
          isAppleMapsProvider()
            ? "Apple Maps — parcel boundary"
            : "Satellite view with parcel boundary lines",
        )}
      </Text>

      {hasGeometry && region && primaryRing.length >= 3 ? (
        <>
          <View style={styles.mapWrap}>
            <MapView
              provider={getMapProvider()}
              mapType={isAppleMapsProvider() ? "hybrid" : "satellite"}
              style={styles.map}
              initialRegion={region}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              showsCompass={false}
              showsPointsOfInterest={false}
              showsBuildings={false}
              showsTraffic={false}
            >
              {polygonRings.map((ring, idx) => (
                <Polyline
                  key={`plot-outline-${idx}`}
                  coordinates={ring}
                  strokeColor={ACCENT}
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
            </MapView>
          </View>

          {locationLine ? (
            <View style={styles.addrRow}>
              <MapPin size={14} color={MUTED} weight="fill" />
              <Text style={styles.addrText}>{locationLine}</Text>
            </View>
          ) : null}

          {visibleDetails.length > 0 ? (
            <View style={styles.detailGrid}>
              {visibleDetails.map((row) => (
                <View key={row.label} style={styles.detailCell}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.btnRow}>
            {onOpenMaps && center ? (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onOpenMaps}
                activeOpacity={0.85}
              >
                <MapPin size={16} color={BLACK} />
                <Text style={styles.btnSecondaryText}>
                  {t("landmarkDetails.openInMaps", "Open in Maps")}
                </Text>
              </TouchableOpacity>
            ) : null}
            {showRouteButton && onGetRoute ? (
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  fetchingRoute && { opacity: 0.7 },
                ]}
                onPress={onGetRoute}
                disabled={fetchingRoute}
                activeOpacity={0.85}
              >
                {fetchingRoute ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <NavigationArrow size={16} color="#FFF" weight="fill" />
                    <Text style={styles.btnPrimaryText}>
                      {t("landmarkDetails.getRoute", "Get route")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          {routeSummary ? (
            <Text style={styles.routeSummary}>{routeSummary}</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <MapPin size={40} color={MUTED} />
          <Text style={styles.emptyTitle}>
            {t(
              "landmark.sections.plotLocationUnavailable",
              "Plot location unavailable",
            )}
          </Text>
          <Text style={styles.emptySub}>
            {t(
              "landmark.sections.plotLocationUnavailableSub",
              "Boundary coordinates were not provided for this listing.",
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BLACK,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 14,
    lineHeight: 18,
  },
  mapWrap: {
    height: 260,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#E8E8E8",
  },
  map: { width: "100%", height: "100%" },
  addrRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  addrText: {
    flex: 1,
    fontSize: 14,
    color: MUTED,
    lineHeight: 20,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  detailCell: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: BLACK,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAFAFA",
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: BLACK,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BLACK,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  routeSummary: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    marginTop: 10,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BLACK,
    marginTop: 12,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 19,
  },
});
