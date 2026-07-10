/**
 * Map Split Action Button Component
 * 
 * Small button in middle bottom with two independent sides:
 * - Left: Show Map (snaps sheet to show map)
 * - Right: Add Annonce (opens FloatingActionButton menu)
 * - Much smaller button size
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { FABAction } from './FloatingActionButton';
import { MapTrifoldIcon, Plus } from 'phosphor-react-native';

// ============================================================================
// Constants
// ============================================================================

const BUTTON_HEIGHT = 36;
const BUTTON_WIDTH = 180;
const CARD_FINAL_HEIGHT = 302;
const CARD_FINAL_WIDTH = 320;
const CARD_BORDER_RADIUS = 24;
const BUTTON_BOTTOM = 24;
const MENU_ITEM_HEIGHT = 64;
const STAGGER_DELAY_MS = 80;
const CARD_VERTICAL_POSITION_PERCENT = 0.62; // 62% down the screen

// Animation timing
const CARD_EXPANSION_DURATION = 450;
const OVERLAY_FADE_DURATION = 300;
const MENU_ITEM_FADE_DURATION = 250;

// Easing functions
const CARD_EXPANSION_EASING = Easing.out(Easing.cubic);
const OVERLAY_EASING = Easing.out(Easing.ease);
const MENU_ITEM_EASING = Easing.out(Easing.ease);

// ============================================================================
// Types
// ============================================================================

export interface MapFloatingActionButtonProps {
  actions: FABAction[];
  onMapPress?: () => void;
  sheetAnimatedIndex?: SharedValue<number>; // Real-time sheet position (0 = collapsed, 1 = mid, 2 = full)
  /** When provided, replaces sheet-based visibility: left button always visible, toggles between list/map */
  listViewMode?: boolean;
  onToggleView?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Map Split Action Button Component
 * 
 * Two independent buttons:
 * - Left: Shows map (snaps sheet)
 * - Right: Opens FloatingActionButton menu card
 */
const MapFloatingActionButton: React.FC<MapFloatingActionButtonProps> = ({
  actions,
  onMapPress,
  sheetAnimatedIndex,
  listViewMode,
  onToggleView,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isMenuExpanded, setIsMenuExpanded] = React.useState(false);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const bottomInset = Math.max(insets.bottom, 8);
  const fabBottom = BUTTON_BOTTOM + bottomInset;
  
  // Button visibility based on sheet position
  const buttonOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const buttonTranslateY = useSharedValue(0);

  // ========================================================================
  // Shared Values - Animation State
  // ========================================================================
  
  // Main animation progress (0 = closed, 1 = expanded)
  const animationProgress = useSharedValue(0);
  
  // Overlay opacity
  const overlayOpacity = useSharedValue(0);
  
  // Menu item animations (staggered)
  const menuItemOpacities = actions.map(() => useSharedValue(0));
  const menuItemTranslates = actions.map(() => useSharedValue(20));

  // ========================================================================
  // Position Calculations
  // ========================================================================
  
  // Button initial position (middle bottom)
  const buttonInitialX = SCREEN_WIDTH / 2 - BUTTON_WIDTH / 2;
  const buttonInitialY = SCREEN_HEIGHT - fabBottom - BUTTON_HEIGHT;
  
  // Card final position (lower section: 62% down, centered horizontally)
  const cardFinalX = SCREEN_WIDTH / 2 - CARD_FINAL_WIDTH / 2;
  const cardFinalY = SCREEN_HEIGHT * CARD_VERTICAL_POSITION_PERCENT - CARD_FINAL_HEIGHT / 2;
  
  // Close button position (inside card header, top-right)
  const headerPadding = 20;
  const closeButtonSize = 40;
  const closeButtonX = cardFinalX + CARD_FINAL_WIDTH - headerPadding - closeButtonSize / 2;
  const closeButtonY = cardFinalY + headerPadding + closeButtonSize / 2;

  // ========================================================================
  // Animation Functions
  // ========================================================================

  /**
   * Toggle menu state and trigger animations
   */
  const toggleMenu = () => {
    const newState = !isMenuExpanded;
    setIsMenuExpanded(newState);

    // Main card expansion animation
    animationProgress.value = withTiming(
      newState ? 1 : 0,
      {
        duration: CARD_EXPANSION_DURATION,
        easing: CARD_EXPANSION_EASING,
      }
    );

    // Overlay fade animation
    overlayOpacity.value = withTiming(
      newState ? 1 : 0,
      {
        duration: OVERLAY_FADE_DURATION,
        easing: OVERLAY_EASING,
      }
    );

    // Menu items stagger animation
    const menuItemStartDelay = newState ? 100 : 0;
    actions.forEach((_, index) => {
      const delay = newState 
        ? menuItemStartDelay + (index * STAGGER_DELAY_MS)
        : 0;
      
      setTimeout(() => {
        menuItemOpacities[index].value = withTiming(
          newState ? 1 : 0,
          {
            duration: MENU_ITEM_FADE_DURATION,
            easing: MENU_ITEM_EASING,
          }
        );
        menuItemTranslates[index].value = withTiming(
          newState ? 0 : 20,
          {
            duration: MENU_ITEM_FADE_DURATION,
            easing: MENU_ITEM_EASING,
          }
        );
      }, delay);
    });
  };

  /**
   * Handle menu item press
   */
  const handleActionPress = (action: FABAction) => {
    toggleMenu();
    setTimeout(() => {
      action.onPress();
    }, CARD_EXPANSION_DURATION / 2);
  };

  /**
   * Handle backdrop press to close menu
   */
  const handleBackdropPress = () => {
    if (isMenuExpanded) {
      toggleMenu();
    }
  };

  /**
   * Handle map/list toggle button press
   */
  const handleMapPress = () => {
    if (listViewMode !== undefined && onToggleView) {
      onToggleView();
    } else if (onMapPress) {
      onMapPress();
    }
  };

  const leftButtonLabel = listViewMode !== undefined
    ? (listViewMode
        ? t('search.showMap', 'Show map')
        : t('search.showList', 'Show list'))
    : t('map.button', 'Map');

  // Tap gesture for backdrop
  const backdropTap = Gesture.Tap().onEnd(() => {
    runOnJS(handleBackdropPress)();
  });

  // ========================================================================
  // Animated Styles
  // ========================================================================

  /**
   * Card animated style
   * Expands from button position to lower section
   */
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Scale: from tiny (0.1) to full size (1.0)
    const cardScale = interpolate(
      animationProgress.value,
      [0, 1],
      [0.1, 1.0],
      Extrapolate.CLAMP
    );

    // Width: from button width to final card width
    const cardWidth = interpolate(
      animationProgress.value,
      [0, 1],
      [BUTTON_WIDTH, CARD_FINAL_WIDTH],
      Extrapolate.CLAMP
    );

    // Height: from button height to final card height
    const cardHeight = interpolate(
      animationProgress.value,
      [0, 1],
      [BUTTON_HEIGHT, CARD_FINAL_HEIGHT],
      Extrapolate.CLAMP
    );

    // Position X: from button X to centered
    const cardX = interpolate(
      animationProgress.value,
      [0, 1],
      [buttonInitialX, cardFinalX],
      Extrapolate.CLAMP
    );

    // Position Y: from button Y to card final Y (62% down)
    const cardY = interpolate(
      animationProgress.value,
      [0, 1],
      [buttonInitialY, cardFinalY],
      Extrapolate.CLAMP
    );

    // Border radius: from button radius to card radius
    const borderRadius = interpolate(
      animationProgress.value,
      [0, 1],
      [BUTTON_HEIGHT / 2, CARD_BORDER_RADIUS],
      Extrapolate.CLAMP
    );

    // Opacity: fade in as it expands
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.2, 1],
      [0, 0.95, 1],
      Extrapolate.CLAMP
    );

    return {
      position: 'absolute',
      left: cardX,
      top: cardY,
      width: cardWidth,
      height: cardHeight,
      opacity,
      borderRadius,
      transform: [{ scale: cardScale }],
    };
  });

  /**
   * Close button animated style
   * Transforms from button to card header
   */
  const closeButtonAnimatedStyle = useAnimatedStyle(() => {
    const finalBottom = SCREEN_HEIGHT - closeButtonY - closeButtonSize / 2;
    const finalRight = SCREEN_WIDTH - closeButtonX - closeButtonSize / 2;

    const buttonBottom = interpolate(
      animationProgress.value,
      [0, 1],
      [BUTTON_BOTTOM, finalBottom],
      Extrapolate.CLAMP
    );

    const buttonRight = interpolate(
      animationProgress.value,
      [0, 1],
      [SCREEN_WIDTH / 2 + BUTTON_WIDTH / 2 - closeButtonSize / 2, finalRight],
      Extrapolate.CLAMP
    );

    const buttonSize = interpolate(
      animationProgress.value,
      [0, 1],
      [BUTTON_HEIGHT, closeButtonSize],
      Extrapolate.CLAMP
    );

    const iconRotation = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 45],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      animationProgress.value,
      [0, 0.3, 1],
      [0, 0, 1],
      Extrapolate.CLAMP
    );

    return {
      position: 'absolute',
      bottom: buttonBottom,
      right: buttonRight,
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      transform: [{ rotate: `${iconRotation}deg` }],
      opacity,
    };
  });

  /**
   * Icon scale animated style
   */
  const iconScaleAnimatedStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(
      animationProgress.value,
      [0, 1],
      [1, 0.85],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale: iconScale }],
    };
  });

  /**
   * Overlay animated style
   */
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
      pointerEvents: isMenuExpanded ? 'auto' : 'none',
    };
  });

  /**
   * Menu item animated style
   */
  const getMenuItemAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      return {
        opacity: menuItemOpacities[index].value,
        transform: [
          {
            translateY: menuItemTranslates[index].value,
          },
        ],
      };
    });
  };

  /**
   * Button visibility animated style - reacts to sheet position in real-time
   * HIDES when sheet is DOWN (lower positions), SHOWS when sheet is UP (higher positions)
   * When listViewMode/onToggleView are provided, left button is always visible (no sheet dependency)
   */
  const buttonVisibilityStyle = useAnimatedStyle(() => {
    if (listViewMode !== undefined && onToggleView) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { translateY: 0 }],
      };
    }
    if (!sheetAnimatedIndex) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { translateY: 0 }],
      };
    }

    // Sheet position: 0 = collapsed (12%), 1 = mid (40%), 2 = full
    // HIDE button when sheet is at lower positions (index < 0.8)
    // SHOW button when sheet is pulled up (index >= 0.8)
    const sheetPos = sheetAnimatedIndex.value;
    
    const opacity = interpolate(
      sheetPos,
      [0, 0.5, 0.8, 2],
      [0, 0, 1, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      sheetPos,
      [0, 0.5, 0.8, 2],
      [0.85, 0.85, 1, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      sheetPos,
      [0, 0.5, 0.8, 2],
      [20, 10, 0, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }, { translateY }],
      pointerEvents: opacity > 0.1 ? 'auto' : 'none',
    };
  });

  // ========================================================================
  // Cleanup
  // ========================================================================

  useEffect(() => {
    return () => {
      animationProgress.value = 0;
      overlayOpacity.value = 0;
      menuItemOpacities.forEach(item => {
        item.value = 0;
      });
      menuItemTranslates.forEach(item => {
        item.value = 20;
      });
    };
  }, []);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      {/* Backdrop Overlay */}
      <Animated.View
        style={[
          styles.backdrop,
          overlayAnimatedStyle,
        ]}
        pointerEvents={isMenuExpanded ? 'auto' : 'none'}
      >
        <GestureDetector gesture={backdropTap}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        </GestureDetector>
      </Animated.View>

      {/* Expanded Card - Grows from button to lower section */}
      <Animated.View
        style={[
          styles.cardContainer,
          cardAnimatedStyle,
        ]}
        pointerEvents={isMenuExpanded ? 'auto' : 'none'}
      >
        <View style={styles.card}>
          {/* Card Header with Close Button Space */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Add Listing</Text>
            {/* Close button space - will animate here */}
            <View style={styles.closeButtonPlaceholder} />
          </View>

          {/* Menu Items - Stacked Vertically */}
          <View style={styles.menuItemsContainer}>
            {actions.map((action, index) => {
              const itemStyle = getMenuItemAnimatedStyle(index);
              return (
                <Animated.View
                  key={`fab-action-${index}`}
                  style={itemStyle}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleActionPress(action)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuItemIconContainer,
                        action.color && { backgroundColor: action.color },
                      ]}
                    >
                      {action.icon}
                    </View>
                    <Text style={styles.menuItemText}>{action.title}</Text>
                    <View style={styles.menuItemArrow}>
                      <Text style={styles.menuItemArrowText}>›</Text>
                    </View>
                  </TouchableOpacity>
                  {index < actions.length - 1 && (
                    <View style={styles.menuItemDivider} />
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Main Split Button - Middle Bottom - Visibility reacts to sheet position in real-time */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            position: 'absolute',
            bottom: fabBottom,
            left: buttonInitialX,
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
            zIndex: 10000,
          },
          buttonVisibilityStyle,
        ]}
      >
        <View style={styles.splitButton}>
          {/* Left Side: Map - Independent */}
          <TouchableOpacity
            style={[styles.buttonSide, styles.buttonLeft]}
            onPress={handleMapPress}
            activeOpacity={0.8}
          >
            <MapTrifoldIcon size={14} color="#111827" weight="bold" />
            <Text style={styles.buttonText}>{leftButtonLabel}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.buttonDivider} />

          {/* Right Side: Add - Independent */}
          <TouchableOpacity
            style={[styles.buttonSide, styles.buttonRight]}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#111827" weight="bold" />
            <Text style={styles.buttonText}>{t('common.add', 'Add')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Close Button - Transforms from button to card header */}
      <Animated.View
        style={[
          styles.closeButtonContainer,
          closeButtonAnimatedStyle,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.closeButton,
            {
              backgroundColor: '#FFFFFF',
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <Animated.View 
            style={[
              styles.closeButtonIconContainer,
              iconScaleAnimatedStyle,
            ]}
          >
            <View style={[styles.closeButtonIconLine, { transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.closeButtonIconLine, { transform: [{ rotate: '90deg' }] }]} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: theme['color-temporary-primary'],
    borderWidth: 1.5,
    borderRadius: BUTTON_HEIGHT / 2,
  },
  splitButton: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BUTTON_HEIGHT / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  buttonLeft: {
    
    borderTopLeftRadius: BUTTON_HEIGHT / 2,
    borderBottomLeftRadius: BUTTON_HEIGHT / 2,
  },
  buttonRight: {
    borderTopRightRadius: BUTTON_HEIGHT / 2,
    borderBottomRightRadius: BUTTON_HEIGHT / 2,
  },
  buttonDivider: {
    width: 1.5,
    height: '100%',
    backgroundColor: theme['color-temporary-primary'],
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.2,
  },
  closeButtonContainer: {
    position: 'absolute',
    zIndex: 10001,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonIconLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: '#111827',
    borderRadius: 1,
  },
  cardContainer: {
    position: 'absolute',
    zIndex: 10001,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 0,
    borderBottomColor: '#FFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    flex: 1,
  },
  closeButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  menuItemsContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: MENU_ITEM_HEIGHT,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuItemArrow: {
    marginLeft: 8,
  },
  menuItemArrowText: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: '#FFF',
    marginLeft: 72,
  },
});

export default MapFloatingActionButton;
