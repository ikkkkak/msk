import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Text, Animated } from "react-native";
import { House, Compass } from "phosphor-react-native";
import LottieView from "lottie-react-native";
import { useTranslation } from "react-i18next";

interface ModeTransitionScreenProps {
  isHostMode: boolean;
  onComplete: () => void;
}

export const ModeTransitionScreen = ({ isHostMode, onComplete }: ModeTransitionScreenProps) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animation sequence
    const animationSequence = Animated.sequence([
      // Fade in and scale up the container
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Scale up the icon
      Animated.timing(iconScaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1000),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      onComplete();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScaleAnim }],
            },
          ]}
        >
          {isHostMode ? (
            <House size={48} color="#FFFFFF" />
          ) : (
            <Compass size={48} color="#FFFFFF" />
          )}
        </Animated.View>
        
        <Text style={styles.title}>
          {isHostMode ? t('account.modeTransition.titleHost', 'Mode Hôte') : t('account.modeTransition.titleGuest', 'Mode Voyageur')}
        </Text>
        <Text style={styles.subtitle}>
          {isHostMode 
            ? t('account.modeTransition.subtitleHost', 'Chargement de votre espace hôte...') 
            : t('account.modeTransition.subtitleGuest', 'Chargement de votre espace voyageur...')
          }
        </Text>
        
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
          <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 9999,
    elevation: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#222222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#717171",
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#222222",
    marginHorizontal: 4,
  },
  loadingDotDelay1: {
    // animationDelay: "0.2s", // Not supported in React Native
  },
  loadingDotDelay2: {
    // animationDelay: "0.4s", // Not supported in React Native
  },
});
