import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PublishJob } from "../../services/publishQueue";
import { PropertySalePublishBanner } from "./PropertySalePublishBanner";

type Props = {
  jobs: PublishJob[];
  onRetry?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
};

/** Fixed overlay visible on every screen while a listing is publishing. */
export function PropertySalePublishGlobalBanner({
  jobs,
  onRetry,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  if (!jobs.length) return null;

  return (
    <View
      style={[styles.host, { paddingTop: Math.max(insets.top, 8) }]}
      pointerEvents="box-none"
    >
      <PropertySalePublishBanner
        jobs={jobs}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: Platform.OS === "android" ? 9999 : undefined,
  },
});
