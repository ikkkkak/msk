import React, { memo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { CS } from "./commentSheetTheme";
import { getCommentUserInitial } from "../../utils/commentUserDisplay";

type Props = {
  uri?: string | null;
  name: string;
  size?: number;
  style?: ViewStyle;
};

/** Stable circular avatar for comment rows — cached image, no flash on remount. */
export const CommentUserAvatar = memo(function CommentUserAvatar({
  uri,
  name,
  size = 36,
  style,
}: Props) {
  const radius = size / 2;
  const initial = getCommentUserInitial(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        recyclingKey={uri}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  image: {
    backgroundColor: CS.chipBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CS.border,
  },
  placeholder: {
    backgroundColor: "#E8E4DC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CS.border,
  },
  initial: {
    fontWeight: "700",
    color: "#444444",
  },
});
