/**
 * Professional Drawing Controls Component
 * Clean, safe, and professional drawing interface for map area selection
 * Features:
 * - Confirmation dialogs for safety
 * - Professional animations
 * - Clear visual feedback
 * - Validation and error handling
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

// ============================================
// TYPES
// ============================================
interface ProfessionalDrawingControlsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onUndoPoint: () => void;
  onClearPolygon: () => void;
  onApplyPolygon: (polygon?: { latitude: number; longitude: number }[]) => void;
  polygonPointsCount: number;
  t: any; // TFunction from react-i18next
}

interface DrawingButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
}

// ============================================
// DRAWING BUTTON COMPONENT
// ============================================
const DrawingButton: React.FC<DrawingButtonProps> = ({
  icon,
  label,
  onPress,
  variant = 'default',
  disabled = false,
  showBadge = false,
  badgeCount = 0,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, onPress]);

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.buttonPrimary;
      case 'danger':
        return styles.buttonDanger;
      default:
        return styles.buttonDefault;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'danger':
        return '#FFFFFF';
      default:
        return '#222222';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'danger':
        return '#FFFFFF';
      default:
        return '#222222';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.button, getButtonStyle(), disabled && styles.buttonDisabled]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          <MaterialIcons name={icon as any} size={20} color={getIconColor()} />
          <Text style={[styles.buttonLabel, { color: getTextColor() }]}>{label}</Text>
          {showBadge && badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const ProfessionalDrawingControls: React.FC<ProfessionalDrawingControlsProps> = ({
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onUndoPoint,
  onClearPolygon,
  onApplyPolygon,
  polygonPointsCount,
  t,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Handle clear with confirmation
  const handleClearWithConfirmation = useCallback(() => {
    if (polygonPointsCount === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('map.confirmClear', 'Clear Drawing?'),
      t('map.confirmClearMessage', 'Are you sure you want to clear your drawing? This action cannot be undone.'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: t('common.clear', 'Clear'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onClearPolygon();
            setShowConfirmClear(false);
          },
        },
      ],
      { cancelable: true }
    );
  }, [polygonPointsCount, onClearPolygon, t]);

  // Handle apply with validation
  const handleApplyWithValidation = useCallback(() => {
    if (polygonPointsCount < 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('map.invalidPolygon', 'Invalid Area'),
        t('map.needMorePoints', 'Please add at least 3 points to create a valid area.'),
        [{ text: t('common.ok', 'OK') }]
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApplyPolygon(); // Pass undefined - parent will use polygonPoints from state
  }, [polygonPointsCount, onApplyPolygon, t]);

  // Handle start drawing
  const handleStartDrawing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartDrawing();
  }, [onStartDrawing]);

  // Handle stop drawing with confirmation if points exist
  const handleStopDrawing = useCallback(() => {
    if (polygonPointsCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        t('map.exitDrawing', 'Exit Drawing Mode?'),
        t('map.exitDrawingMessage', 'You have unsaved points. Are you sure you want to exit?'),
        [
          {
            text: t('common.cancel', 'Cancel'),
            style: 'cancel',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
          {
            text: t('common.exit', 'Exit'),
            style: 'destructive',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onStopDrawing();
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStopDrawing();
    }
  }, [polygonPointsCount, onStopDrawing, t]);

  // Drawing mode - show professional controls
  if (isDrawing) {
    return (
      <View style={styles.drawingContainer}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: theme['color-temporary-primary'] }]} />
            <Text style={styles.statusText}>
              {polygonPointsCount === 0
                ? t('map.drawingMode', 'Drawing Mode')
                : `${polygonPointsCount} ${polygonPointsCount === 1 ? t('map.point', 'point') : t('map.points', 'points')} ${t('map.added', 'added')}`}
            </Text>
          </View>
          {polygonPointsCount >= 3 && (
            <View style={styles.readyBadge}>
              <MaterialIcons name="check-circle" size={16} color="#10B981" />
              <Text style={styles.readyText}>{t('map.readyToApply', 'Ready')}</Text>
            </View>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            {/* Undo */}
            <DrawingButton
              icon="undo"
              label={t('common.undo', 'Undo')}
              onPress={onUndoPoint}
              disabled={polygonPointsCount === 0}
              showBadge={polygonPointsCount > 0}
              badgeCount={polygonPointsCount}
            />

            {/* Clear */}
            <DrawingButton
              icon="delete-outline"
              label={t('common.clear', 'Clear')}
              onPress={handleClearWithConfirmation}
              variant="danger"
              disabled={polygonPointsCount === 0}
            />

            {/* Apply */}
            <DrawingButton
              icon="check"
              label={t('common.apply', 'Apply')}
              onPress={handleApplyWithValidation}
              variant="primary"
              disabled={polygonPointsCount < 3}
            />

            {/* Exit */}
            <DrawingButton
              icon="close"
              label={t('common.exit', 'Exit')}
              onPress={handleStopDrawing}
            />
          </View>
        </View>

        {/* Helpful Hint */}
        <View style={styles.hintContainer}>
          <MaterialIcons name="info-outline" size={16} color="#717171" />
          <Text style={styles.hintText}>
            {polygonPointsCount === 0
              ? t('map.tapMapToDraw', 'Tap on the map to start drawing your area')
              : polygonPointsCount < 3
              ? `${t('map.add', 'Add')} ${3 - polygonPointsCount} ${3 - polygonPointsCount === 1 ? t('map.morePoint', 'more point') : t('map.morePoints', 'more points')} ${t('map.toComplete', 'to complete')}`
              : t('map.tapApplyToFinish', 'Tap Apply to finish and search this area')}
          </Text>
        </View>
      </View>
    );
  }

  // Normal mode - show start button
  return (
    <View style={styles.startButtonContainer}>
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartDrawing}
        activeOpacity={0.9}
      >
        <View style={styles.startButtonContent}>
          <View style={styles.startButtonIcon}>
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.startButtonText}>
            {t('map.drawArea', 'Draw Area')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  // Start Button (when not drawing)
  startButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
  },
  startButton: {
    backgroundColor: theme['color-temporary-primary'],
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: theme['color-temporary-primary'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  startButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Drawing Container
  drawingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 16,
    zIndex: 1000,
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  readyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },

  // Controls Container
  controlsContainer: {
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  // Button Styles
  button: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  buttonDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  buttonPrimary: {
    backgroundColor: theme['color-temporary-primary'],
    ...Platform.select({
      ios: {
        shadowColor: theme['color-temporary-primary'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDanger: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme['color-temporary-primary'],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Hint Container
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme['color-temporary-primary'],
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#717171',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default ProfessionalDrawingControls;

