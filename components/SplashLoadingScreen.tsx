import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { SPLASH_BACKGROUND_COLOR } from "../constants";

const { width, height } = Dimensions.get("window");

/**
 * JS fallback while bootstrap runs — must visually match native splash (app.json):
 * same backgroundColor and same image + resizeMode as expo.splash.
 */
export const SplashLoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/Splash.png")}
        style={styles.splashImage}
        resizeMode="cover"
        accessibilityLabel="Loading"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  splashImage: {
    width,
    height,
  },
});
