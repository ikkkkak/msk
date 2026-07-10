import {
  BlurMask,
  Canvas,
  RoundedRect,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { Check, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputSubmitEditingEvent,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const canvasPadding = 50;
const borderRadius = 25;
const glowHeightExpansion = 10;

const glowColors = [
  "rgba(200, 200, 210, 0.35)",
  "rgba(200, 200, 210, 0.35)",
  "rgba(200, 200, 210, 0.2)",
];
const glowGradientColors = [...glowColors];
const positions = [0, 0.5, 1];

const travelingColors = [
  "transparent",
  "#ACACBE",
  "#ACACBE",
  "transparent",
];
const travelingPositions = [0.3, 0.75, 0.4, 1];

export interface InputMessage {
  text?: string;
}

interface GlowyInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (text: string) => void;
  handleSubmitEditing: (e?: TextInputSubmitEditingEvent) => void;
  placeholder?: string;
  deepThinkEnabled?: boolean;
  onToggleDeepThink?: () => void;
  deepThinkLabel?: string;
  autoLabel?: string;
}

function GlowyInput({
  message,
  setMessage,
  handleSubmitEditing,
  handleSendMessage,
  placeholder,
  deepThinkEnabled = false,
  onToggleDeepThink,
  deepThinkLabel = "Deep think",
  autoLabel = "Auto",
}: GlowyInputProps) {
  const hasText = message.trim().length > 0;
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const rotation = useSharedValue(0);
  const rotationSlow = useSharedValue(0);
  const blurIntensity = useSharedValue(20);
  const deepScale = useSharedValue(1);

  useEffect(() => {
    const finalValue = 1e6;
    const durationFast = (finalValue / (Math.PI * 2)) * 4000;
    rotation.value = withTiming(finalValue, {
      duration: durationFast,
      easing: Easing.linear,
    });
    const durationSlow = (finalValue / (Math.PI * 2)) * 75000;
    rotationSlow.value = withTiming(finalValue, {
      duration: durationSlow,
      easing: Easing.linear,
    });
  }, [rotation, rotationSlow]);

  useEffect(() => {
    deepScale.value = withSpring(deepThinkEnabled ? 1.02 : 1, {
      damping: 14,
      stiffness: 220,
    });
  }, [deepThinkEnabled, deepScale]);

  const animatedRotation = useDerivedValue(() => {
    "worklet";
    return [{ rotate: rotation.value % (Math.PI * 2) }];
  });

  const animatedRotationSlow = useDerivedValue(() => {
    "worklet";
    return [{ rotate: rotationSlow.value % (Math.PI * 2) }];
  });

  const deepPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deepScale.value }],
  }));

  const onSend = () => {
    const text = message.trim();
    if (!text) return;
    handleSendMessage(text);
    setMessage("");
  };

  const strokeWidthTraveling = 1.8;
  const strokeWidthGlow = 6;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputWrapper,
          { opacity: dimensions ? 1 : 0 },
        ]}
        onLayout={onLayout}
      >
        {dimensions && (
          <Canvas
            style={{
              position: "absolute",
              top: -canvasPadding,
              left: -canvasPadding,
              width: dimensions.width + canvasPadding * 2,
              height: dimensions.height + canvasPadding * 2,
            }}
          >
            <RoundedRect
              x={canvasPadding}
              y={canvasPadding - glowHeightExpansion / 2}
              width={dimensions.width}
              height={dimensions.height + glowHeightExpansion}
              r={borderRadius}
              opacity={deepThinkEnabled ? 0.85 : 0.7}
              strokeWidth={strokeWidthGlow}
            >
              <SweepGradient
                transform={animatedRotationSlow}
                origin={vec(
                  canvasPadding + dimensions.width / 2,
                  canvasPadding + dimensions.height / 2,
                )}
                c={vec(
                  canvasPadding + dimensions.width / 2,
                  canvasPadding + dimensions.height / 2,
                )}
                colors={
                  deepThinkEnabled
                    ? [
                        "rgba(80, 80, 90, 0.35)",
                        "rgba(160, 160, 175, 0.4)",
                        "rgba(80, 80, 90, 0.3)",
                      ]
                    : glowGradientColors
                }
                positions={positions}
              />
              <BlurMask blur={blurIntensity} />
            </RoundedRect>

            <RoundedRect
              x={canvasPadding}
              y={canvasPadding}
              width={dimensions.width}
              height={dimensions.height}
              r={borderRadius}
              style="stroke"
              opacity={0.7}
              strokeWidth={strokeWidthTraveling}
            >
              <SweepGradient
                transform={animatedRotation}
                origin={vec(
                  canvasPadding + dimensions.width / 2,
                  canvasPadding + dimensions.height / 2,
                )}
                c={vec(
                  canvasPadding + dimensions.width / 2,
                  canvasPadding + dimensions.height / 2,
                )}
                colors={travelingColors}
                positions={travelingPositions}
              />
            </RoundedRect>
          </Canvas>
        )}

        <View
          style={[
            styles.inputContainer,
            deepThinkEnabled && styles.inputContainerDeep,
          ]}
        >
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder || "Ask anything..."}
            placeholderTextColor="#9CA3AF"
            onSubmitEditing={handleSubmitEditing}
            returnKeyType="send"
            multiline
          />

          <View style={styles.footer}>
            <Animated.View style={deepPillStyle}>
              <Pressable
                style={[
                  styles.deepThinkPill,
                  deepThinkEnabled && styles.deepThinkPillActive,
                ]}
                onPress={onToggleDeepThink}
                accessibilityRole="switch"
                accessibilityState={{ checked: deepThinkEnabled }}
                accessibilityLabel={deepThinkLabel}
              >
                <Sparkles
                  size={14}
                  color={deepThinkEnabled ? "#FFFFFF" : "#6B7280"}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.deepThinkText,
                    deepThinkEnabled && styles.deepThinkTextActive,
                  ]}
                >
                  {deepThinkEnabled ? deepThinkLabel : autoLabel}
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable
              disabled={!hasText}
              onPress={onSend}
              style={({ pressed }) => [
                styles.sendButton,
                hasText ? styles.sendButtonEnabled : styles.sendButtonDisabled,
                pressed && hasText && styles.sendButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send"
            >
              <Check
                size={18}
                color={hasText ? "#FFF" : "#9CA3AF"}
                strokeWidth={3}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    minHeight: 108,
    justifyContent: "space-between",
  },
  inputContainerDeep: {
    backgroundColor: "#FDFCFF",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    textAlignVertical: "top",
    paddingTop: 0,
    lineHeight: 22,
    maxHeight: 120,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  deepThinkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deepThinkPillActive: {
    backgroundColor: "#0D0D0D",
    borderColor: "#0D0D0D",
  },
  deepThinkText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "600",
  },
  deepThinkTextActive: {
    color: "#FFFFFF",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  sendButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  sendButtonEnabled: {
    backgroundColor: "#0D0D0D",
    borderColor: "#0D0D0D",
  },
  sendButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
});

GlowyInput.displayName = "GlowyInput";
export default GlowyInput;
