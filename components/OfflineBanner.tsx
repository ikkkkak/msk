import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useConnectivityContext } from "../contexts/ConnectivityContext";
import { AuthContext } from "../context";

/**
 * Thin banner when the device is offline but the user remains authenticated.
 */
export function OfflineBanner() {
  const { connectionQuality } = useConnectivityContext();
  const { user } = React.useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (connectionQuality !== "offline" || !user) {
    return null;
  }

  return (
    <View
      style={[styles.wrap, { paddingTop: Math.max(insets.top, 6) }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>
        {t(
          "connectivity.offlineBanner",
          "You're offline — showing saved listings where available.",
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "rgba(30, 30, 30, 0.92)",
    paddingBottom: 8,
    paddingHorizontal: 14,
  },
  text: {
    color: "#F5F5F5",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
});
