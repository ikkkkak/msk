/**
 * Property Creation Progress Modal
 * 
 * Professional multi-step progress UI for property creation
 * Shows clear steps to user without technical details (translation, upload, etc.)
 * 
 * User-friendly steps:
 * 1. Creating your property
 * 2. Uploading content
 * 3. Finalizing details
 */

import React, { useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Text } from '@ui-kitten/components';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { CheckCircle } from 'phosphor-react-native';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CreationStep = 'info' | 'uploading' | 'complete';

interface PropertyCreationProgressModalProps {
  visible: boolean;
  currentStep: CreationStep;
  progress?: number; // 0-1 for uploading step
  onComplete?: () => void;
}

export const PropertyCreationProgressModal: React.FC<PropertyCreationProgressModalProps> = ({
  visible,
  currentStep,
  progress = 0,
  onComplete
}) => {
  const step1Scale = useSharedValue(0);
  const step1Opacity = useSharedValue(0);
  const step2Scale = useSharedValue(0);
  const step2Opacity = useSharedValue(0);
  const step3Scale = useSharedValue(0);
  const step3Opacity = useSharedValue(0);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      // Reset
      step1Scale.value = 0;
      step1Opacity.value = 0;
      step2Scale.value = 0;
      step2Opacity.value = 0;
      step3Scale.value = 0;
      step3Opacity.value = 0;
      progressWidth.value = 0;
      return;
    }

    // Animate based on current step
    if (currentStep === 'info') {
      // Step 1 in progress
      step1Scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
      step1Opacity.value = withTiming(1, { duration: 300 });
      progressWidth.value = withTiming(33, {
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      });
    } else if (currentStep === 'uploading') {
      // Step 1 complete, Step 2 in progress
      step1Scale.value = withTiming(1, { duration: 300 });
      step1Opacity.value = withTiming(0.6, { duration: 300 });
      step2Scale.value = withDelay(
        200,
        withTiming(1, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        })
      );
      step2Opacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      progressWidth.value = withTiming(33 + progress * 33, {
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      });
    } else if (currentStep === 'complete') {
      // All steps complete
      step1Scale.value = withTiming(1, { duration: 300 });
      step1Opacity.value = withTiming(0.6, { duration: 300 });
      step2Scale.value = withTiming(1, { duration: 300 });
      step2Opacity.value = withTiming(0.6, { duration: 300 });
      step3Scale.value = withDelay(
        200,
        withTiming(1, {
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        })
      );
      step3Opacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      progressWidth.value = withTiming(100, {
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      });

      // Auto-dismiss after completion animation
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }
  }, [visible, currentStep, progress]);

  const step1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: step1Scale.value }],
    opacity: step1Opacity.value
  }));

  const step2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: step2Scale.value }],
    opacity: step2Opacity.value
  }));

  const step3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: step3Scale.value }],
    opacity: step3Opacity.value
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  const getStepStatus = (step: number) => {
    if (currentStep === 'info') {
      return step === 1 ? 'active' : 'pending';
    } else if (currentStep === 'uploading') {
      return step === 1 ? 'complete' : step === 2 ? 'active' : 'pending';
    } else if (currentStep === 'complete') {
      return 'complete';
    }
    return 'pending';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[styles.progressBarFill, progressBarStyle]}
              />
            </View>
          </View>

          {/* Step 1: Creating Property */}
          <Animated.View style={[styles.step, step1AnimatedStyle]}>
            {getStepStatus(1) === 'complete' ? (
              <CheckCircle size={24} color={theme['color-temporary-primary']} weight="fill" />
            ) : (
              <ActivityIndicator size="small" color={theme['color-temporary-primary']} />
            )}
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Creating your property</Text>
              <Text style={styles.stepSubtitle}>Setting up your listing</Text>
            </View>
          </Animated.View>

          {/* Step 2: Uploading Content */}
          <Animated.View style={[styles.step, step2AnimatedStyle]}>
            {getStepStatus(2) === 'complete' ? (
              <CheckCircle size={24} color={theme['color-temporary-primary']} weight="fill" />
            ) : getStepStatus(2) === 'active' ? (
              <ActivityIndicator size="small" color={theme['color-temporary-primary']} />
            ) : (
              <View style={styles.stepPending} />
            )}
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, getStepStatus(2) === 'pending' && styles.stepTextPending]}>
                Uploading content
              </Text>
              <Text style={[styles.stepSubtitle, getStepStatus(2) === 'pending' && styles.stepTextPending]}>
                {currentStep === 'uploading' && progress > 0 
                  ? `${Math.round(progress * 100)}% complete`
                  : 'Photos, videos, and documents'}
              </Text>
            </View>
          </Animated.View>

          {/* Step 3: Finalizing */}
          <Animated.View style={[styles.step, step3AnimatedStyle]}>
            {getStepStatus(3) === 'complete' ? (
              <CheckCircle size={24} color={theme['color-temporary-primary']} weight="fill" />
            ) : getStepStatus(3) === 'active' ? (
              <ActivityIndicator size="small" color={theme['color-temporary-primary']} />
            ) : (
              <View style={styles.stepPending} />
            )}
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, getStepStatus(3) === 'pending' && styles.stepTextPending]}>
                Finalizing details
              </Text>
              <Text style={[styles.stepSubtitle, getStepStatus(3) === 'pending' && styles.stepTextPending]}>
                Your property is almost ready
              </Text>
            </View>
          </Animated.View>

          {currentStep === 'complete' && (
            <Text style={styles.completeText}>
              Property created successfully!
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: Math.min(SCREEN_WIDTH - 40, 400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10
  },
  progressBarContainer: {
    marginBottom: 24
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme['color-temporary-primary'],
    borderRadius: 2
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20
  },
  stepPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB'
  },
  stepTextContainer: {
    flex: 1
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 2
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#717171',
    fontWeight: '400'
  },
  stepTextPending: {
    opacity: 0.4
  },
  completeText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme['color-temporary-primary'],
    textAlign: 'center',
    marginTop: 8
  }
});
