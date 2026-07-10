import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from "react-native";
import {
  createAnimatedComponent,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";

export const SPRING_CONFIG = {
  damping: 50,
  stiffness: 400,
  mass: 1,
  overshootClamping: true,
  restDisplacementThreshold: 0.0001,
  restSpeedThreshold: 0.0001,
};

const applySpring = (value: number) => {
  "worklet";
  return withSpring(value, SPRING_CONFIG);
};

interface FancyTextProps {
  words: string[];
  currentIndex: SharedValue<number>;
  bounce?: boolean;
  style?: StyleProp<ViewStyle>;
  textProps?: TextProps;
}

const AnimatedText = createAnimatedComponent(Text);

export default function FancyText({
  words,
  currentIndex,
  bounce = true,
  style,
  textProps,
}: FancyTextProps) {
  return (
    <View style={[styles.container, style]}>
      {words.map((word, wordIndex) => (
        <View key={`word-${wordIndex}`} style={styles.word}>
          {word.split("").map((char, charIndex) => (
            <Character
              key={`char-${charIndex}`}
              char={char}
              currentIndex={currentIndex}
              textProps={textProps}
              charIndex={charIndex}
              wordIndex={wordIndex}
              words={words}
              bounce={bounce}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const Character = ({
  char,
  currentIndex,
  wordIndex,
  charIndex,
  words,
  bounce = true,
  textProps,
}: {
  char: string;
  currentIndex: SharedValue<number>;
  wordIndex: number;
  charIndex: number;
  words: string[];
  bounce?: boolean;
  textProps?: TextProps;
}) => {
  const prevIndex = useSharedValue(0);
  const mounted = useSharedValue(false);
  useDerivedValue(() => {
    mounted.value = true;
  });

  useAnimatedReaction(
    () => currentIndex.value,
    (value, prev) => {
      if (prev != null) {
        prevIndex.value = prev;
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = currentIndex.value === wordIndex && mounted.value;
    const totalDelay = (words[prevIndex.value]?.length ?? 0) * 15;
    const delay = (isActive ? totalDelay : 0) + 20 * charIndex;
    return {
      opacity: withDelay(
        delay - 20,
        applySpring(isActive ? ((textProps?.style as { opacity?: number })?.opacity ?? 1) : 0)
      ),
      transform: bounce
        ? [
            {
              translateY: withDelay(delay, applySpring(isActive ? 0 : 10)),
            },
            {
              scale: withDelay(
                delay,
                applySpring(currentIndex.value === wordIndex ? 1 : 0.7)
              ),
            },
          ]
        : [],
    };
  });

  return (
    <AnimatedText
      key={`${char}-${wordIndex}-${charIndex}`}
      {...textProps}
      style={[styles.text, textProps?.style, animatedStyle]}
    >
      {char}
    </AnimatedText>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 40,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  word: {
    flexDirection: "row",
    position: "absolute",
  },
  text: {
    fontSize: 28,
    transformOrigin: "bottom",
  },
});
