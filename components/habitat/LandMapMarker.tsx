import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import type { LatLng } from "../../types/habitat";
import { LandMapPin } from "./LandMapPin";

const TRACKS_MS = 480;

/**
 * Stable land pin marker — never unmounts while the layer is active.
 * react-native-maps drops custom markers after hide/show unless tracksViewChanges
 * is toggled on restore (known MKMapView / GMS snapshot bug).
 */
export const LandMapMarker = memo(function LandMapMarker({
  landId,
  coordinate,
  hidden,
  restoreGeneration,
  onPress,
}: {
  landId: number;
  coordinate: LatLng;
  hidden?: boolean;
  restoreGeneration?: number;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const prevHiddenRef = useRef(hidden);
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpTracks = () => {
    if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
    setTracksViewChanges(true);
    trackTimerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
      trackTimerRef.current = null;
    }, TRACKS_MS);
  };

  useEffect(() => {
    bumpTracks();
    return () => {
      if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
    };
  }, [restoreGeneration]);

  useEffect(() => {
    if (prevHiddenRef.current && !hidden) {
      bumpTracks();
    }
    prevHiddenRef.current = hidden;
  }, [hidden]);

  useEffect(
    () => () => {
      if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
    },
    [],
  );

  return (
    <Marker
      identifier={`land-pin-${landId}`}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      tappable={!hidden}
      onPress={(e) => {
        if (hidden) return;
        e.stopPropagation?.();
        onPress();
      }}
      zIndex={hidden ? 1 : 400}
    >
      <View
        style={{ opacity: hidden ? 0 : 1, width: 22, height: 28 }}
        pointerEvents={hidden ? "none" : "auto"}
        collapsable={false}
      >
        <LandMapPin selected={false} />
      </View>
    </Marker>
  );
});
