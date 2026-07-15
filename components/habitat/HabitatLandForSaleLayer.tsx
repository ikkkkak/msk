import React, { memo, useMemo } from "react";
import { Polygon } from "react-native-maps";
import type { Region } from "react-native-maps";
import { LandMapMarker } from "./LandMapMarker";
import { LandMapClusterMarker } from "./LandMapClusterMarker";
import {
  landmarkPlotRing,
  shouldShowLandPlotDetail,
  shouldShowLandPlotOutline,
  LAND_MAP_MAX_VISIBLE,
  type MapLandmarkRecord,
} from "../../utils/landmarkMapMarkers";
import {
  clusterLandmarksForMap,
  type LandMapCluster,
} from "../../utils/landmarkMapClustering";
import { LAND_MAP_CLUSTER_THEME as T } from "../../utils/landMapClusterTheme";

type Props = {
  landmarks: MapLandmarkRecord[];
  mapRegion: Region;
  mapZoom?: number;
  selectedLandId?: number | null;
  showLandPanel?: boolean;
  pinRestoreGeneration?: number;
  onLandPress: (landmark: MapLandmarkRecord) => void;
  onClusterPress?: (cluster: LandMapCluster) => void;
};

export const HabitatLandForSaleLayer = memo(function HabitatLandForSaleLayer({
  landmarks,
  mapRegion,
  mapZoom = 10,
  selectedLandId,
  showLandPanel = false,
  pinRestoreGeneration = 0,
  onLandPress,
  onClusterPress,
}: Props) {
  const stablePinCatalog = landmarks.length <= LAND_MAP_MAX_VISIBLE;

  const displayItems = useMemo(
    () =>
      clusterLandmarksForMap(landmarks, mapRegion, mapZoom, selectedLandId),
    stablePinCatalog
      ? [landmarks, selectedLandId]
      : [
          landmarks,
          mapRegion.latitude,
          mapRegion.longitude,
          mapRegion.latitudeDelta,
          mapRegion.longitudeDelta,
          mapZoom,
          selectedLandId,
        ],
  );

  const landItems = useMemo(
    () => displayItems.filter((item) => item.type === "land"),
    [displayItems],
  );

  return (
    <>
      {landItems.map((item) => {
        if (item.type !== "land") return null;
        const lm = item.landmark;
        const selected = selectedLandId === lm.id;
        const ring = landmarkPlotRing(lm);
        const showOutline =
          ring && ring.length >= 3 && shouldShowLandPlotOutline(mapZoom, selected);
        const showDetail = shouldShowLandPlotDetail(mapZoom, selected);
        const hidePin = selected && showLandPanel;

        return (
          <React.Fragment key={`land-${lm.id}`}>
            {showOutline ? (
              <Polygon
                coordinates={ring}
                strokeColor={selected ? T.pin : T.plotStroke}
                fillColor={
                  selected
                    ? "rgba(209, 96, 36, 0.24)"
                    : showDetail
                      ? T.plotFill
                      : "rgba(209, 96, 36, 0.06)"
                }
                strokeWidth={showDetail ? (selected ? 2.5 : 1.6) : 1}
                tappable={false}
                zIndex={selected ? 380 : 300}
              />
            ) : null}
            <LandMapMarker
              key={`land-pin-${lm.id}-${pinRestoreGeneration}`}
              landId={lm.id}
              coordinate={item.coordinate}
              hidden={hidePin}
              restoreGeneration={pinRestoreGeneration}
              onPress={() => onLandPress(lm)}
            />
          </React.Fragment>
        );
      })}

      {displayItems.map((item) => {
        if (item.type !== "cluster") return null;
        return (
          <LandMapClusterMarker
            key={`land-cluster-${item.clusterId}`}
            clusterId={item.clusterId}
            count={item.count}
            coordinate={item.coordinate}
            onPress={() => onClusterPress?.(item)}
          />
        );
      })}
    </>
  );
});
