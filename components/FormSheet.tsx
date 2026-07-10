// ==========================================
// FILE: components/BottomSheetForm.js
// Pure reusable component with Reanimated
// ==========================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  Keyboard,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useAnimatedKeyboard } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetFormProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
  backgroundColor?: string;
  showX?: boolean; // added for the "X" button
}

const BottomSheetForm: React.FC<BottomSheetFormProps> = ({
  visible,
  onClose,
  title,
  children,
  height,
  backgroundColor,
  showX = false,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const keyboard = useAnimatedKeyboard();

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 350,
      });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  console.log('📦 BottomSheetForm render:', { visible, backgroundColor, height });

  // Safety: Auto-close if visible for too long (prevents stuck modals)
  useEffect(() => {
    if (visible) {
      const autoCloseTimer = setTimeout(() => {
        console.log('⚠️ Auto-closing modal after 30 seconds (safety mechanism)');
        handleClose();
      }, 30000); // 30 seconds max
      return () => clearTimeout(autoCloseTimer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[styles.overlay, animatedOverlayStyle]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={handleClose}
            accessible={true}
            accessibilityLabel="Close modal"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            animatedSheetStyle,
            height ? { maxHeight: height, height: height } : {},
            backgroundColor ? { backgroundColor } : {},
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.handleContainer} pointerEvents="none">
            <View
              style={[
                styles.handle,
                backgroundColor
                  ? { backgroundColor: 'rgba(255, 255, 255, 0.5)' }
                  : {},
              ]}
            />
          </View>

          {(title || showX) && (
            <View
              style={[
                styles.header,
                backgroundColor ? { backgroundColor } : {},
                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
              ]}
            >
              {title ? (
                <Text
                  style={[
                    styles.title,
                    backgroundColor ? { color: '#FFFFFF' } : {},
                    // prevent "jump" if X is present
                    { flex: 1 },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {showX && (
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close"
                  hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: 'bold',
                      color: '#888',
                      textAlign: 'center',
                      width: 34,
                      height: 34,
                      lineHeight: 34,
                      borderRadius: 17,
                      overflow: 'hidden',
                      backgroundColor: '#f6f6f6',
                      marginRight: 0,
                      marginTop: 0,
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={[styles.content, backgroundColor ? { backgroundColor } : {}]}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 7,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    // flexDirection, alignItems, justifyContent set inline for X
  },
  closeButton: {
    marginLeft: 12,
    // Position and touch area are mainly handled by hitSlop and parent flex
    // Add any additional styling you want here
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    // paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flex: 1,
  },
});

export default BottomSheetForm;