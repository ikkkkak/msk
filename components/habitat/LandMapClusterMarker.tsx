import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import type { LatLng } from "../../types/habitat";
import { LandMapClusterPin } from "./LandMapClusterPin";

const TRACKS_MS = 480;

export const LandMapClusterMarker = memo(function LandMapClusterMarker({
  clusterId,
  count,
  coordinate,
  onPress,
}: {
  clusterId: number;
  count: number;
  coordinate: LatLng;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), TRACKS_MS);
    return () => clearTimeout(t);
  }, [clusterId, count]);

  return (
    <Marker
      key={`land-cluster-${clusterId}`}
      identifier={`land-cluster-${clusterId}`}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={(e) => {
        e.stopPropagation?.();
        onPress();
      }}
      zIndex={450}
    >
      <View collapsable={false}>
        <LandMapClusterPin count={count} />
      </View>
    </Marker>
  );
});
