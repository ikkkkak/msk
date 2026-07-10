import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const ShimmerWaveText = ({ 
  text = "Hello World!", 
  fontSize = 48, 
  baseColor = "#ffffff",
  shimmerColor = "#60a5fa"
}) => {
  const characters = text.split('');
  const animatedValues = useRef(
    characters.map(() => ({
      dance: new Animated.Value(0),
      shimmerOpacity: new Animated.Value(0),
      shimmerProgress: new Animated.Value(0)
    }))
  ).current;

  useEffect(() => {
    // Quick single dance animation from left to right
    const danceAnimations = characters.map((_, index) => {
      return Animated.sequence([
        Animated.timing(animatedValues[index].dance, {
          toValue: 1,
          duration: 150,
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues[index].dance, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]);
    });

    // Fast shimmer wave - using opacity for native driver
    const shimmerAnimations = characters.map((_, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValues[index].shimmerOpacity, {
            toValue: 1,
            duration: 200,
            delay: index * 80,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValues[index].shimmerOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay((characters.length - index) * 80 + 1000),
        ])
      );
    });

    // Progress for color change (non-native)
    const progressAnimations = characters.map((_, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValues[index].shimmerProgress, {
            toValue: 1,
            duration: 200,
            delay: index * 80,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValues[index].shimmerProgress, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.delay((characters.length - index) * 80 + 1000),
        ])
      );
    });

    // Start dance once
    Animated.stagger(30, danceAnimations).start();

    // Start continuous shimmer wave
    shimmerAnimations.forEach(anim => anim.start());
    progressAnimations.forEach(anim => anim.start());

    return () => {
      animatedValues.forEach(val => {
        val.dance.stopAnimation();
        val.shimmerOpacity.stopAnimation();
        val.shimmerProgress.stopAnimation();
      });
    };
  }, [text]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {characters.map((char, index) => {
          const danceTranslate = animatedValues[index].dance.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -8],
          });

          const textColor = animatedValues[index].shimmerProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [baseColor, shimmerColor, baseColor],
          });

          return (
            <View key={index} style={styles.characterWrapper}>
              <Animated.Text
                style={[
                  styles.character,
                  {
                    fontSize: fontSize,
                    color: textColor,
                    transform: [{ translateY: danceTranslate }],
                  },
                ]}
              >
                {char === ' ' ? '\u00A0' : char}
              </Animated.Text>
              <Animated.View
                style={[
                  styles.glow,
                  {
                    opacity: animatedValues[index].shimmerOpacity,
                    backgroundColor: shimmerColor,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterWrapper: {
    position: 'relative',
    marginHorizontal: 1,
  },
  character: {
    fontWeight: '700',
    zIndex: 1,
  },
  glow: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: '40%',
    borderRadius: 10,
    zIndex: 0,
  },
});

export default ShimmerWaveText;