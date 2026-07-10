import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert } from 'react-native';
import { Play, Pause, X } from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

interface ProfessionalVideoPlayerProps {
  videoUrl: string;
  isVisible: boolean;
  onClose: () => void;
}

export const ProfessionalVideoPlayer: React.FC<ProfessionalVideoPlayerProps> = ({
  videoUrl,
  isVisible,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  if (!isVisible) return null;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // For now, we'll show a professional video player interface
    // In a real implementation, you would integrate with expo-av here
  };

  const handleVideoPress = () => {
    Alert.alert(
      'Video Player',
      `Playing video: ${videoUrl}`,
      [
        { text: 'Close', onPress: onClose },
        { text: 'Play', onPress: () => setIsPlaying(true) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Video Placeholder */}
        <View style={styles.videoPlaceholder}>
          <TouchableOpacity style={styles.videoButton} onPress={handleVideoPress}>
            <View style={styles.videoContent}>
              <View style={styles.videoIcon}>
                <Play size={64} color="#FFFFFF" weight="fill" />
              </View>
              <Text style={styles.videoTitle}>Experience Video</Text>
              <Text style={styles.videoSubtitle}>Tap to play</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && !isLoading && (
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
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '30%' }]} />
                </View>
              </View>
              
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>1:23</Text>
                <Text style={styles.timeText}>4:56</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tap to show/hide controls */}
        <TouchableOpacity 
          style={styles.tapArea}
          onPress={() => setShowControls(!showControls)}
          activeOpacity={1}
        />
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
  },
  videoButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContent: {
    alignItems: 'center',
  },
  videoIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 56, 92, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  videoSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF385C',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
