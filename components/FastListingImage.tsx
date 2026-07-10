import React from "react";
import { Image as ExpoImage, type ImageContentFit } from "expo-image";
import { type StyleProp, type ViewStyle } from "react-native";

type Props = {
  uri: string;
  width: number;
  height: number;
  contentFit?: ImageContentFit;
  priority?: "low" | "normal" | "high";
  style?: StyleProp<ViewStyle>;
};

/** Cached listing image — use on detail hero, gallery, and cards. */
export function FastListingImage({
  uri,
  width,
  height,
  contentFit = "cover",
  priority = "normal",
  style,
}: Props) {
  if (!uri?.trim()) return null;
  return (
    <ExpoImage
      source={{ uri: uri.trim() }}
      style={[{ width, height }, style]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      priority={priority}
      transition={priority === "high" ? 100 : 180}
      recyclingKey={uri.split("?")[0]}
    />
  );
}
