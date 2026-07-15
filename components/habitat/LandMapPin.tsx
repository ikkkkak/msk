import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { LAND_MAP_CLUSTER_THEME as T } from "../../utils/landMapClusterTheme";

/** Lightweight map pin — brand colors, stable during zoom. */
export const LandMapPin = memo(function LandMapPin({
  selected = false,
}: {
  selected?: boolean;
}) {
  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.dot, selected && styles.dotSelected]} />
      <View style={[styles.stem, selected && styles.stemSelected]} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: 22,
    height: 28,
  },
  wrapSelected: {
    transform: [{ scale: 1.12 }],
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.pin,
    borderWidth: 2,
    borderColor: T.pinBorder,
  },
  dotSelected: {
    backgroundColor: T.pinSelected,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stem: {
    width: 2,
    height: 8,
    backgroundColor: T.pinStem,
    marginTop: -1,
  },
  stemSelected: {
    backgroundColor: T.pinSelected,
    height: 10,
  },
});
