import React from "react";
import { View } from "react-native";

type Props = {
  stepKey: string | number;
  children: React.ReactNode;
};

export function ListingAiComposeStepShell({ children }: Props) {
  return <View>{children}</View>;
}
