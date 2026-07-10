import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert, Linking } from 'react-native';
import { Play, Pause, X, ArrowSquareOut } from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

interface SimpleVideoPlayerProps {
  videoUrl: string;
  isVisible: boolean;
  onClose: () => void;
}

export const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  videoUrl,
  isVisible,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isVisible) return null;

  const handlePlayVideo = async () => {
    try {
      // Try to open the video URL in the device's default video player
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert('Error', 'Cannot open video URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open video');
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      handlePlayVideo();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Video Placeholder */}
        <View style={styles.videoPlaceholder}>
          <View style={styles.videoContent}>
            <View style={styles.videoIcon}>
              <Play size={64} color="#FFFFFF" weight="fill" />
            </View>
            <Text style={styles.videoTitle}>Experience Video</Text>
            <Text style={styles.videoSubtitle}>Tap to play in external player</Text>
            
            <TouchableOpacity style={styles.playButton} onPress={handlePlayVideo}>
              <Play size={20} color="#FFFFFF" weight="fill" />
              <Text style={styles.playButtonText}>Play Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Controls Overlay */}
        <View style={styles.controlsOverlay}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>

          {/* Center Play/Pause Button */}
          <TouchableOpacity style={styles.centerPlayButton} onPress={handlePlayPause}>
            {isPlaying ? (
              <Pause size={48} color="#FFFFFF" weight="fill" />
            ) : (
              <Play size={48} color="#FFFFFF" weight="fill" />
            )}
          </TouchableOpacity>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.externalButton} onPress={handlePlayVideo}>
              <ArrowSquareOut size={20} color="#FFFFFF" weight="bold" />
              <Text style={styles.externalButtonText}>Open in Player</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  videoContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  videoIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 56, 92, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  videoSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF385C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    alignItems: 'center',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  externalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
