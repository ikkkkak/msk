import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Heart } from "phosphor-react-native";

type Props = {
  visible: boolean;
  onFinished: () => void;
};

/** TikTok-style center heart burst on double-tap like. */
export function DoubleTapHeartBurst({ visible, onFinished }: Props) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.35);
    opacity.setValue(0);

    const anim = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.12,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.delay(520),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    ]);

    anim.start(({ finished }) => {
      if (finished) onFinished();
    });

    return () => anim.stop();
  }, [visible, onFinished, opacity, scale]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Heart size={108} weight="fill" color="#FF385C" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
