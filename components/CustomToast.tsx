import React from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Built-in Expo icon (no install needed)

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const Toast = ({ 
  message = 'Success!', 
  duration = 3000, 
  type = 'success', // 'success', 'error', 'info'
  onHide = () => {} 
}) => {
  const translateY = React.useRef(new Animated.Value(100)).current; // Start further off-bottom
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Icon and colors based on type (Airbnb-style: subtle)
  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return { icon: 'check', bgColor: '#FFFFFF', textColor: '#111111', iconColor: '#00C851' };
      case 'error':
        return { icon: 'error', bgColor: '#FFFFFF', textColor: '#111111', iconColor: '#ff4444' };
      default:
        return { icon: 'info', bgColor: '#FFFFFF', textColor: '#111111', iconColor: '#007AFF' };
    }
  };

  const { icon, bgColor, textColor, iconColor } = getIconAndColors();

  React.useEffect(() => {
    // Slide UP from bottom + fade in (Airbnb smooth)
    Animated.parallel([
      Animated.spring(translateY, { // Spring for bouncy feel like Airbnb
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100, // Slide DOWN off bottom
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
            backgroundColor: bgColor,
          },
        ]}
      >
        <MaterialIcons name={icon} size={20} color={iconColor} style={styles.icon} />
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject, // Full screen overlay
    justifyContent: 'flex-end', // Anchor to bottom
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 9999,
  },
  container: {
    width: '90%', // Full-width but padded (Airbnb feel)
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20, // Space from very bottom (safe area friendly)
    borderRadius: 12, // Rounded like Airbnb
    flexDirection: 'row',
    alignItems: 'center',
    // Subtle Airbnb shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500', // Medium weight, clean
    flex: 1,
  },
});

export default Toast;