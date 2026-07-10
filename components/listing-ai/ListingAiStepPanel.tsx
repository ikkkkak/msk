import React from "react";
import { View, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Plain wrapper — no card chrome */
export function ListingAiStepPanel({ children, style }: Props) {
  return <View style={style}>{children}</View>;
}
