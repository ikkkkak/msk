import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableWithoutFeedback, View, PanResponder, Dimensions, Modal } from 'react-native';

interface DraggableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Array of percentages (0-1) or heights in pixels
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const DraggableBottomSheet: React.FC<DraggableBottomSheetProps> = ({ 
  visible, 
  onClose, 
  children,
  snapPoints = [0.85] // Default to 85% of screen height
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [mounted, setMounted] = useState(false);
  const panY = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  // Convert snap points to absolute values
  const absoluteSnapPoints = snapPoints.map(point => {
    if (point <= 1) {
      return SCREEN_HEIGHT * (1 - point); // Convert percentage to offset from bottom
    }
    return SCREEN_HEIGHT - point; // Already in pixels
  }).sort((a, b) => a - b); // Sort ascending (lowest offset first)

  const defaultSnapPoint = absoluteSnapPoints[0]; // Use the highest snap point

  useEffect(() => {
    if (visible) {
      setMounted(true);
      currentOffset.current = 0;
      panY.setValue(0);
      translateY.setValue(SCREEN_HEIGHT); // Start from off-screen
      // Slide in immediately with spring animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else if (mounted) {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        currentOffset.current = 0;
        panY.setValue(0);
      });
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        panY.setOffset(currentOffset.current);
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow dragging down
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        panY.flattenOffset();
        const dragDistance = gestureState.dy;
        const velocity = gestureState.vy;

        // Determine if we should close or snap back
        const shouldClose = dragDistance > SCREEN_HEIGHT * 0.3 || velocity > 1.5;

        if (shouldClose) {
          currentOffset.current = SCREEN_HEIGHT;
          translateY.setValue(dragDistance);
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          // Snap back to default position
          currentOffset.current = 0;
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
          panY.setValue(0);
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.wrapper} pointerEvents="box-none">
        {/* Backdrop - Instant, no fade */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        {/* Sheet */}
        <Animated.View 
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 10000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    width: '100%',
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  content: {
    width: '100%',
  },
});

