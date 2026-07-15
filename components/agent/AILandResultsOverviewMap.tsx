import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Polygon } from "react-native-maps";
import { getMapProvider } from "../../utils/mapProvider";
import { getPlatformMapViewConfig } from "../../utils/mapTilerAndroid";
import { PlatformMapTileLayer } from "../map/PlatformMapTileLayer";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { PropertyRecommendation } from "../../services/aiService";
import { regionForLandmarkDetailMap } from "../../utils/landmarkMapGeometry";
import { AI_CHAT as C } from "./aiChatTheme";

const MAX_MAP_PLOTS = 5;
const PLOT_COLORS = ["#353740", "#6E6E80", "#ACACBE", "#565869", "#8E8EA0"];

type LatLng = { latitude: number; longitude: number };

type PlotShape = {
  id: number;
  ring: LatLng[];
  color: string;
  label: string;
  cadastre: boolean;
};

function ringFromRec(rec: PropertyRecommendation): LatLng[] {
  return (rec.plot_corners ?? [])
    .filter((c) => typeof c.lat === "number" && typeof c.lng === "number")
    .map((c) => ({ latitude: c.lat, longitude: c.lng }));
}

type Props = {
  items: PropertyRecommendation[];
};

export function AILandResultsOverviewMap({ items }: Props) {
  const { t } = useTranslation();

  const shapes = useMemo(() => {
    const out: PlotShape[] = [];
    for (const rec of items) {
      if (out.length >= MAX_MAP_PLOTS) break;
      const ring = ringFromRec(rec);
      if (ring.length < 3) continue;
      const idx = out.length;
      const parts = [
        rec.plot_number ? `#${rec.plot_number}` : null,
        rec.quartier_label,
        rec.location_label || rec.city,
      ].filter(Boolean);
      out.push({
        id: rec.id,
        ring,
        color: PLOT_COLORS[idx % PLOT_COLORS.length],
        label: parts.join(" · ") || rec.title,
        cadastre: Boolean(rec.cadastre_linked),
      });
    }
    return out;
  }, [items]);

  const region = useMemo(() => {
    const flat = shapes.flatMap((s) => s.ring);
    if (!flat.length) return null;
    return regionForLandmarkDetailMap(flat);
  }, [shapes]);

  if (!shapes.length || !region) return null;

  const cadastreCount = shapes.filter((s) => s.cadastre).length;

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <Text style={styles.title}>
        {t("aiChat.landMapTitle", "Land plots in this area")}
      </Text>
      {cadastreCount > 0 ? (
        <Text style={styles.sub}>
          {t("aiChat.cadastreLinkedHint", {
            defaultValue: "{{count}} linked to official cadastre",
            count: cadastreCount,
          })}
        </Text>
      ) : null}
      <View style={styles.mapShell}>
        <MapView
          provider={getMapProvider()}
          mapType={getPlatformMapViewConfig("satellite").mapType}
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
          <PlatformMapTileLayer mapStyle="satellite" />
          {shapes.map((shape) => (
            <Polygon
              key={`plot-${shape.id}`}
              coordinates={shape.ring}
              strokeColor={shape.color}
              strokeWidth={2}
              fillColor={`${shape.color}40`}
            />
          ))}
        </MapView>
      </View>
      <View style={styles.legend}>
        {shapes.map((shape) => (
          <View key={`leg-${shape.id}`} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: shape.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {shape.label}
            </Text>
            {shape.cadastre ? (
              <Text style={styles.cadastreBadge}>
                {t("aiChat.cadastreBadge", "Cadastre")}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 6 },
  title: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSub,
  },
  sub: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
  },
  mapShell: {
    height: 220,
    borderRadius: C.radius.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    backgroundColor: C.bgMuted,
  },
  legend: { gap: 5 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: C.textSub,
    lineHeight: 17,
  },
  cadastreBadge: {
    fontSize: 10,
    fontWeight: "500",
    color: C.textMuted,
  },
});
