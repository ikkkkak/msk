import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, { FadeIn } from "react-native-reanimated";
import type { PropertyRecommendation } from "../../services/aiService";

type Props = {
  items: PropertyRecommendation[];
};

export function AIResultsMap({ items }: Props) {
  const coords = useMemo(
    () =>
      items.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number",
      ),
    [items],
  );

  const region = useMemo(() => {
    if (coords.length === 0) {
      return {
        latitude: 18.08,
        longitude: -15.97,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    const lats = coords.map((p) => p.lat!);
    const lngs = coords.map((p) => p.lng!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max((maxLat - minLat) * 1.4, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.4, 0.02);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [coords]);

  if (coords.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.wrap}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {coords.map((p) => (
          <Marker
            key={`m-${p.id}`}
            coordinate={{ latitude: p.lat!, longitude: p.lng! }}
            title={p.title}
            description={p.location_label || p.city}
          />
        ))}
      </MapView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginTop: 4,
  },
  map: { width: "100%", height: 200 },
});
