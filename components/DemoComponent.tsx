import React, { useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to get element position on screen
export const measureElement = (ref: any, callback: (x: number, y: number, width: number, height: number) => void) => {
  if (ref && ref.current) {
    ref.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      callback(pageX, pageY, width, height);
    });
  }
};

// Helper function to create demo step from element ref
export const createDemoStepFromRef = async (
  ref: any,
  title: string,
  description: string
): Promise<any> => {
  return new Promise((resolve) => {
    if (ref && ref.current) {
      ref.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        resolve({
          title,
          description,
          position: { x: pageX, y: pageY, width, height },
        });
      });
    } else {
      resolve({
        title,
        description,
        position: { x: 0, y: 0, width: 100, height: 100 },
      });
    }
  });
};

interface DemoStep {
  title: string;
  description: string;
  icon?: string; // Phosphor icon name
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DemoComponentProps {
  visible: boolean;
  onClose: () => void;
  steps: DemoStep[];
  screenName?: string;
}

export const DemoComponent: React.FC<DemoComponentProps> = ({
  visible,
  onClose,
  steps,
  screenName = 'Screen'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [spotlightOpacity] = useState(new Animated.Value(0));
  // Transition driver 0 -> 1 between steps
  const transition = useRef(new Animated.Value(1)).current;
  const prevIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);


  // Animate when visible changes
  React.useEffect(() => {
    if (visible && steps.length > 0) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(spotlightOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, steps.length]);

  const handleNext = () => {
    if (isAnimatingRef.current) return;
    if (currentStep < steps.length - 1) {
      prevIndexRef.current = currentStep;
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const currentStepData = steps[currentStep] || steps[0] || {
    title: 'Demo',
    description: 'No steps available',
    position: { x: 0, y: 0, width: 100, height: 100 }
  };

  const prevStepData = steps[prevIndexRef.current] || currentStepData;

  // Interpolated spotlight rectangle (animates move and resize between steps)
  const ix = transition.interpolate({ inputRange: [0, 1], outputRange: [prevStepData.position.x, currentStepData.position.x] });
  const iy = transition.interpolate({ inputRange: [0, 1], outputRange: [prevStepData.position.y, currentStepData.position.y] });
  const iw = transition.interpolate({ inputRange: [0, 1], outputRange: [prevStepData.position.width, currentStepData.position.width] });
  const ih = transition.interpolate({ inputRange: [0, 1], outputRange: [prevStepData.position.height, currentStepData.position.height] });

  // Drive transition when step changes
  React.useEffect(() => {
    if (!visible) return;
    // Prevent spamming next
    isAnimatingRef.current = true;
    transition.stopAnimation();
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      isAnimatingRef.current = false;
    });
  }, [currentStep, visible]);


  // Create the spotlight effect using SVG or a simple View
  const createSpotlightPath = () => {
    const position = currentStepData.position || { x: 0, y: 0, width: 100, height: 100 };
    const { x, y, width, height } = position;
    const margin = 20; // Extra spacing around the highlighted area
    
    // SVG path for the mask
    const path = `
      M 0 0
      L ${SCREEN_WIDTH} 0
      L ${SCREEN_WIDTH} ${SCREEN_HEIGHT}
      L 0 ${SCREEN_HEIGHT}
      Z
      M ${x - margin} ${y - margin}
      L ${x + width + margin} ${y - margin}
      L ${x + width + margin} ${y + height + margin}
      L ${x - margin} ${y + height + margin}
      Z
    `;
    return path;
  };

  // Derived animated styles for overlays and spotlight
  const overlayTopStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: Animated.subtract(Animated.add(iy, new Animated.Value(0)), new Animated.Value(10)),
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  };
  const overlayBottomStyle = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: Animated.subtract(new Animated.Value(SCREEN_HEIGHT), Animated.add(Animated.add(iy, ih), new Animated.Value(10))),
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  };
  const overlayLeftStyle = {
    position: 'absolute' as const,
    top: Animated.subtract(iy, new Animated.Value(10)),
    left: 0,
    width: Animated.subtract(ix, new Animated.Value(10)),
    height: Animated.add(ih, new Animated.Value(20)),
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  };
  const overlayRightStyle = {
    position: 'absolute' as const,
    top: Animated.subtract(iy, new Animated.Value(10)),
    left: Animated.add(ix, iw),
    width: Animated.subtract(new Animated.Value(SCREEN_WIDTH), Animated.add(ix, iw)),
    height: Animated.add(ih, new Animated.Value(20)),
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  };
  const spotlightOuterStyle = {
    position: 'absolute' as const,
    left: Animated.subtract(ix, new Animated.Value(8)),
    top: Animated.subtract(iy, new Animated.Value(8)),
    width: Animated.add(iw, new Animated.Value(16)),
    height: Animated.add(ih, new Animated.Value(16)),
    backgroundColor: 'transparent',
    borderRadius: 16,
    zIndex: 100,
    transform: [{ scale: transition.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }]
  };

  // Don't render if no steps
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Dark overlay TOP - above the spotlight */}
        <Animated.View 
          style={[
            overlayTopStyle as any,
            { opacity: overlayOpacity }
          ]}
        />
        
        {/* Dark overlay BOTTOM - below the spotlight */}
        <Animated.View 
          style={[
            overlayBottomStyle as any,
            { opacity: overlayOpacity }
          ]}
        />
        
        {/* Dark overlay LEFT - left side of the spotlight */}
        <Animated.View 
          style={[
            overlayLeftStyle as any,
            { opacity: overlayOpacity }
          ]}
        />
        
        {/* Dark overlay RIGHT - right side of the spotlight */}
        <Animated.View 
          style={[
            overlayRightStyle as any,
            { opacity: overlayOpacity }
          ]}
        />
        
        {/* Spotlight - TRANSPARENT area with red border only */}
        <Animated.View 
          style={[
            spotlightOuterStyle as any,
            { opacity: spotlightOpacity }
          ]}
        >
          {/* Inner shadow effect for better visibility */}
          <View style={{
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            borderRadius: 12,
          }} />
        </Animated.View>

        {/* Card at bottom with info */}
        <Animated.View 
          style={[
            styles.infoCard,
            { opacity: spotlightOpacity, transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }
          ]}
        >
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleSkip}
          >
            <Text style={styles.closeButtonText}>Skip</Text>
          </TouchableOpacity>

          {/* Icon */}
          {currentStepData.icon && (
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>✨</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{currentStepData.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Progress indicators */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted
                ]}
              />
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleSkip}
            >
              <Text style={styles.buttonTextSecondary}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleNext}
            >
              <Text style={styles.buttonTextPrimary}>
                {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  cutoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    // This will create a cutout effect
  },
  spotlightContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#717171',
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDDDDD',
  },
  progressDotActive: {
    backgroundColor: '#222222',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#222222',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#F7F7F7',
  },
  buttonPrimary: {
    backgroundColor: '#222222',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// How to control demo positioning:
// Edit position values in handleStartDemo to move the spotlight
// Use createDemoStepFromRef() to automatically measure elements with refs
//     top: 16,
//     right: 16,
//     padding: 8,
//   },
//   closeButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#717171',
//   },
//   iconContainer: {
//     alignSelf: 'center',
//     marginBottom: 16,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#FFE8ED',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconEmoji: {
//     fontSize: 32,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#222222',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   description: {
//     fontSize: 16,
//     color: '#717171',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   progressContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//     gap: 8,
//   },
//   progressDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#DDDDDD',
//   },
//   progressDotActive: {
//     backgroundColor: '#222222',
//     width: 24,
//   },
//   progressDotCompleted: {
//     backgroundColor: '#222222',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   buttonSecondary: {
//     backgroundColor: '#F7F7F7',
//   },
//   buttonPrimary: {
//     backgroundColor: '#222222',
//   },
//   buttonTextSecondary: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#222222',
//   },
//   buttonTextPrimary: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
// });


// position: { 
//     x: 20,      // 20px from the LEFT edge of the screen
//     y: 140,     // 140px from the TOP edge of the screen  
//     width: 300, // 300px wide
//     height: 50  // 50px tall
//   }