/**
 * Professional Video Tab Badge Component
 * 
 * Displays a prominent, professional badge showing the count of unseen videos
 * Similar to TikTok/Instagram badge styling with clear visibility
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface VideoTabBadgeProps {
  count: number;
}

export const VideoTabBadge: React.FC<VideoTabBadgeProps> = ({ count }) => {
  if (count <= 0) {
    return null;
  }

  // Format count: show "99+" if more than 99
  const displayCount = count > 99 ? '99+' : count.toString();
  const isLargeCount = count > 99;

  return (
    <View style={styles.badgeContainer}>
      <View style={[
        styles.badge,
        isLargeCount && styles.badgeLarge
      ]}>
        <Text style={styles.badgeText}>{displayCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -8,
    zIndex: 1000,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30', // iOS red for maximum visibility - professional bright red
    borderWidth: 2,
    borderColor: '#FFFFFF', // White border for maximum contrast on dark backgrounds
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeLarge: {
    paddingHorizontal: 4,
    minWidth: 22,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.1,
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false, // Android font padding fix
  },
});
