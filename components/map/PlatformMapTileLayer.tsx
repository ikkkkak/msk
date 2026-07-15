import React from "react";
import { UrlTile } from "react-native-maps";
import {
  getPlatformMapViewConfig,
  type PlatformMapStyle,
} from "../../utils/mapTilerAndroid";

type Props = {
  mapStyle?: PlatformMapStyle;
};

/** Renders MapTiler UrlTile on Android only; iOS uses native Apple Maps. */
export function PlatformMapTileLayer({ mapStyle = "standard" }: Props) {
  const { showMapTilerTiles, mapTilerTileUrl } =
    getPlatformMapViewConfig(mapStyle);

  if (!showMapTilerTiles || !mapTilerTileUrl) {
    return null;
  }

  return (
    <UrlTile
      urlTemplate={mapTilerTileUrl}
      maximumZ={19}
      flipY={false}
      zIndex={-1}
    />
  );
}
