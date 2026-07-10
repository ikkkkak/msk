import React, { useCallback, useMemo } from 'react';
import { TouchableWithoutFeedback, View, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withSpring, withTiming, useAnimatedStyle, Easing, runOnJS } from 'react-native-reanimated';
import { Canvas, Path, Skia, Group, vec, useValue, runTiming, DiscretePathEffect, PaintStyle, Paint, Circle } from '@shopify/react-native-skia';

interface HeartLikeButtonProps {
  liked: boolean;
  onToggle: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// Heart SVG path (material like)
const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 5 4 3 6.5 3c1.74 0 3.41 0.81 4.5 2.09C12.09 3.81 13.76 3 15.5 3 18 3 20 5 20 7.5c0 3.78-3.4 6.86-8.55 12.54L12 21.35z';

export const HeartLikeButton: React.FC<HeartLikeButtonProps> = ({ liked, onToggle, size = 28, style }) => {
  // Scale bounce on tap
  const scale = useSharedValue(1);

  // Skia animation progress for burst [0..1]
  const burst = useValue(0);

  const onPress = useCallback(() => {
    // bounce
    scale.value = 0.85;
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });

    // run burst each tap
    burst.current = 0;
    runTiming(burst, 1, { duration: 550, easing: Easing.out(Easing.cubic) }, () => {
      burst.current = 0;
    });

    // toggle state in JS after starting animation
    runOnJS(onToggle)();
  }, [burst, onToggle, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartPath = useMemo(() => {
    const p = Skia.Path.MakeFromSVGString(HEART_PATH);
    if (!p) return Skia.Path.Make();
    // Normalize to 24x24 and scale to requested size
    const scaleFactor = size / 24;
    const m = Skia.Matrix();
    m.scale(scaleFactor, scaleFactor);
    p.transform(m);
    return p;
  }, [size]);

  const outlinePaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setStyle(PaintStyle.Stroke);
    paint.setColor(Skia.Color('#FFFFFF'));
    paint.setStrokeWidth(size * 0.08);
    paint.setAntiAlias(true);
    paint.setPathEffect(DiscretePathEffect.Make(1, 0.5) || null);
    return paint;
  }, [size]);

  const fillColor = liked ? '#FF385C' : 'rgba(255,255,255,0.0)';
  const borderColor = liked ? '#FF385C' : '#FFFFFF';

  const burstParticles = 8;
  const center = useMemo(() => vec(size / 2, size / 2), [size]);
  const maxR = useMemo(() => size * 0.9, [size]);

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle, style] as any}>
        <Canvas style={{ flex: 1 }}>
          {/* Burst circles */}
          <Group>
            {new Array(burstParticles).fill(0).map((_, i) => {
              const angle = (i / burstParticles) * Math.PI * 2;
              // radius increases with progress, alpha decreases
              const r = burst.current * maxR;
              const x = center.x + Math.cos(angle) * r * 0.6;
              const y = center.y + Math.sin(angle) * r * 0.6;
              const alpha = Math.max(0, 1 - burst.current);
              const color = Skia.Color(`rgba(255,56,92,${alpha})`);
              return <Circle key={i} cx={x} cy={y} r={Math.max(0.5, (1 - burst.current) * (size * 0.12))} color={color} />;
            })}
          </Group>

          {/* Heart fill */}
          <Path path={heartPath} color={fillColor} style="fill" />

          {/* Heart stroke */}
          <Path path={heartPath} color={borderColor} style="stroke" strokeWidth={size * 0.08} />
        </Canvas>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default HeartLikeButton;
