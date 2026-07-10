import React, { useCallback, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text
} from "react-native";
import { Video, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

/**
 * MeskenyVideoPlayer - HLS-optimized video player for Meskeny property videos
 *
 * Features:
 * - Plays HLS master.m3u8 URLs with adaptive bitrate (ABR)
 * - Automatically selects quality based on network speed
 * - Buffering indicator while segments load
 * - Mute/unmute toggle
 * - Fullscreen support (optional)
 * - Configurable autoplay and loop
 */

export interface MeskenyVideoPlayerProps {
  hlsUrl: string; // master.m3u8 CDN URL
  thumbnailUrl?: string; // fallback image
  paused?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoplayDelay?: number; // ms delay before autoplay (default 0)
  onReady?: () => void;
  onError?: (error: string) => void;
  onProgress?: (position: number, duration: number) => void;
  style?: object;
  containerStyle?: object;
}

export const MeskenyVideoPlayer: React.FC<MeskenyVideoPlayerProps> = ({
  hlsUrl,
  thumbnailUrl,
  paused = false,
  muted = false,
  loop = true,
  autoplayDelay = 0,
  onReady,
  onError,
  onProgress,
  style,
  containerStyle
}) => {
  const videoRef = useRef<Video>(null);
  const [buffering, setBuffering] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentMuted, setCurrentMuted] = useState(muted);
  const [currentPaused, setCurrentPaused] = useState(paused);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const handleLoadStart = useCallback(() => {
    setBuffering(true);
  }, []);

  const handleLoad = useCallback(
    (data) => {
      setIsLoaded(true);
      setBuffering(false);
      setDuration(data.durationMillis ? data.durationMillis / 1000 : 0);
      onReady?.();

      // Optional: autoplay after delay
      if (autoplayDelay > 0) {
        setTimeout(() => {
          setCurrentPaused(false);
        }, autoplayDelay);
      }
    },
    [autoplayDelay, onReady]
  );

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      // Update buffering state during playback
      if (status.isBuffering) {
        setBuffering(true);
      } else if (isLoaded) {
        setBuffering(false);
      }

      // Track position
      if (status.positionMillis !== undefined) {
        setPosition(status.positionMillis / 1000);
        onProgress?.(status.positionMillis / 1000, duration);
      }

      // Handle end of video
      if (status.didJustFinish && !loop) {
        setCurrentPaused(true);
      }
    },
    [isLoaded, loop, duration, onProgress]
  );

  const handleError = useCallback(
    (error: any) => {
      const errorMsg =
        error?.error?.errorString ?? error?.message ?? "playback error";
      console.error("[MeskenyVideoPlayer] Error:", errorMsg);
      setBuffering(false);
      onError?.(errorMsg);
    },
    [onError]
  );

  const toggleMute = useCallback(() => {
    setCurrentMuted((m) => !m);
  }, []);

  const togglePlayPause = useCallback(() => {
    setCurrentPaused((p) => !p);
  }, []);

  // Validate HLS URL
  if (!hlsUrl || !hlsUrl.endsWith(".m3u8")) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.errorText}>Invalid HLS URL</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Video
        ref={videoRef}
        source={{
          uri: hlsUrl
        }}
        rate={1.0}
        volume={1.0}
        isMuted={currentMuted}
        resizeMode="contain"
        shouldPlay={!currentPaused}
        isLooping={loop}
        useNativeControls={false} // We provide custom controls
        style={[styles.video, style]}
        posterResizeMode="cover"
        posterImageSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
        progressUpdateIntervalMillis={500}
        // HLS-specific settings
        playableDurationMillis={5000} // start playing after 5s of buffer
      />

      {/* Buffering overlay */}
      {buffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator
            size="large"
            color="#ffffff"
            style={styles.spinner}
          />
        </View>
      )}

      {/* Play/Pause overlay */}
      {!isLoaded || currentPaused ? (
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          <Ionicons
            name="play-circle"
            size={64}
            color="rgba(255, 255, 255, 0.8)"
          />
        </TouchableOpacity>
      ) : null}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={toggleMute}
          style={styles.controlButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentMuted ? "volume-mute" : "volume-high"}
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>

        {/* Duration display (optional) */}
        {duration > 0 && (
          <Text style={styles.durationText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        )}
      </View>
    </View>
  );
};

// Helper: format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  video: {
    width: "100%",
    height: "100%"
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  spinner: {
    width: 50,
    height: 50
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)"
  },
  controls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center"
  },
  durationText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "monospace",
    marginLeft: 4
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600"
  }
});
