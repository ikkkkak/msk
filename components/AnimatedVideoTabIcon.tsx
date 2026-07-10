/**
 * Animated Video Tab Icon Component - Professional Implementation
 * 
 * Replaces static video icon with a circular auto-playing video preview
 * when there are new unseen videos. Provides TikTok/Instagram-like
 * professional experience.
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Play } from 'phosphor-react-native';

interface AnimatedVideoTabIconProps {
  color: string;
  hasUnseenVideos: boolean;
  previewVideoUrl?: string;
  previewThumbnailUrl?: string;
}

export const AnimatedVideoTabIcon: React.FC<AnimatedVideoTabIconProps> = ({
  color,
  hasUnseenVideos,
  previewVideoUrl,
  previewThumbnailUrl,
}) => {
  const videoRef = useRef<Video>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the video preview circle
  useEffect(() => {
    if (hasUnseenVideos && previewVideoUrl) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [hasUnseenVideos, previewVideoUrl, scaleAnim]);

  // Auto-play video when component mounts with preview
  useEffect(() => {
    if (hasUnseenVideos && previewVideoUrl && videoRef.current) {
      videoRef.current.playAsync().catch(() => {
        // Silently handle play errors
      });
    }
  }, [hasUnseenVideos, previewVideoUrl]);

  // Show animated video preview if there are unseen videos and preview URL exists
  if (hasUnseenVideos && previewVideoUrl) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.videoCircle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Video
            ref={videoRef}
            source={{ uri: previewVideoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            useNativeControls={false}
            posterSource={previewThumbnailUrl ? { uri: previewThumbnailUrl } : undefined}
            usePoster={!!previewThumbnailUrl}
          />
          {/* Subtle border for definition */}
          <View style={styles.border} />
        </Animated.View>
      </View>
    );
  }

  // Default static icon
  return (
    <View style={styles.container}>
      <Play size={28} color={color} weight="duotone" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  border: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none',
  },
});
