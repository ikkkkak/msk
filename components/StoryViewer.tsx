import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  cancelAnimation,
  withDelay,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { endpoints } from '../constants';
import { useUser } from '../hooks/useUser';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type StoryClip = {
  id: string | number;
  type: 'image' | 'video';
  mediaURL: string;
  thumbURL?: string;
  durationSeconds?: number;
  caption?: string;
};

interface StoryViewerProps {
  username: string;
  avatarURL: string;
  clips: StoryClip[];
  onClose: () => void;
  onLikeToggle?: (clipId: string | number) => void;
  onViewProgress?: (clipId: string | number, seconds: number) => void;
  origin: { x: number; y: number; size: number };
  onStoryViewed?: () => void;
}

const IMAGE_DURATION_MS = 5000;
const CLOSE_THRESHOLD = 120;
const MAX_DRAG = SCREEN_HEIGHT * 0.5;
const LONG_PRESS_DELAY = 150;

// Professional easing curves
const OPEN_EASING = Easing.bezier(0.32, 0.72, 0, 1); // iOS spring-like
const CLOSE_EASING = Easing.bezier(0.32, 0, 0.67, 0);
const PROGRESS_EASING = Easing.linear;

export const StoryViewer: React.FC<StoryViewerProps> = ({
  username,
  avatarURL,
  clips,
  onClose,
  onLikeToggle,
  onViewProgress,
  origin,
  onStoryViewed,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const progress = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const currentIndexShared = useSharedValue(0);
  const dragY = useSharedValue(0);
  const contentScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  const videoRef = useRef<Video>(null);
  const closingRef = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const progressStartTime = useRef<number>(0);
  const pausedProgress = useRef<number>(0);
  const viewedClipsRef = useRef<Set<string | number>>(new Set());
  const hasCalledOnViewed = useRef(false);

  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useUser();

  const clip = clips[currentIndex];
  const isVideo = clip?.type === 'video';
  const clipDuration = isVideo ? (clip.durationSeconds || 15) * 1000 : IMAGE_DURATION_MS;

  // Initial transform values
  const initScale = useMemo(() => origin.size / SCREEN_WIDTH, [origin.size]);
  const initTranslateX = useMemo(() => origin.x - SCREEN_WIDTH / 2, [origin.x]);
  const initTranslateY = useMemo(() => origin.y - SCREEN_HEIGHT / 2, [origin.y]);

  // ============ Opening Animation ============
  useEffect(() => {
    // Animate open
    openProgress.value = withTiming(1, {
      duration: 400,
      easing: OPEN_EASING,
    });

    // Fade in content slightly delayed
    contentOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) })
    );

    // Trigger onStoryViewed
    if (!hasCalledOnViewed.current) {
      hasCalledOnViewed.current = true;
      onStoryViewed?.();
    }

    return () => {
      cancelAnimation(openProgress);
      cancelAnimation(contentOpacity);
    };
  }, []);

  // ============ Track views ============
  const trackView = useCallback(
    async (clipId: string | number) => {
      if (!user?.accessToken || viewedClipsRef.current.has(clipId)) return;
      viewedClipsRef.current.add(clipId);

      try {
        await axios.post(
          `${endpoints.baseURL}/stories/${clipId}/view`,
          { viewed_seconds: 0 },
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        );
      } catch (err) {
        // Ignore
      }
    },
    [user?.accessToken]
  );

  // Track current clip
  useEffect(() => {
    if (clip) {
      trackView(clip.id);
    }
  }, [clip?.id, trackView]);

  // Sync shared index
  useEffect(() => {
    currentIndexShared.value = currentIndex;
  }, [currentIndex]);

  // ============ Close Handler ============
  const triggerClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    // Stop video
    videoRef.current?.stopAsync().catch(() => {});
    setIsPlaying(false);
    cancelAnimation(progress);

    // Fade out content first
    contentOpacity.value = withTiming(0, { duration: 100 });

    // Animate close
    openProgress.value = withTiming(
      0,
      { duration: 350, easing: CLOSE_EASING },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
  }, [openProgress, contentOpacity, progress, onClose]);

  // ============ Navigation ============
  const goNext = useCallback(() => {
    if (currentIndex < clips.length - 1) {
      videoRef.current?.stopAsync().catch(() => {});
      cancelAnimation(progress);
      progress.value = 0;
      pausedProgress.current = 0;
      setVideoReady(false);
      setImageReady(false);
      setCurrentIndex((prev) => prev + 1);
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      triggerClose();
    }
  }, [currentIndex, clips.length, progress, triggerClose]);

  const goPrev = useCallback(() => {
    videoRef.current?.stopAsync().catch(() => {});
    cancelAnimation(progress);
    progress.value = 0;
    pausedProgress.current = 0;

    if (currentIndex > 0) {
      setVideoReady(false);
      setImageReady(false);
      setCurrentIndex((prev) => prev - 1);
    } else {
      // Restart current clip
      videoRef.current?.setPositionAsync(0).catch(() => {});
    }
    setIsPaused(false);
    setIsPlaying(true);
  }, [currentIndex, progress]);

  // ============ Image Progress Timer ============
  useEffect(() => {
    if (!clip || isVideo || isPaused || !isPlaying || !imageReady) {
      return;
    }

    const remainingDuration = clipDuration * (1 - pausedProgress.current);
    progressStartTime.current = Date.now();

    progress.value = pausedProgress.current;
    progress.value = withTiming(1, {
      duration: remainingDuration,
      easing: PROGRESS_EASING,
    }, (finished) => {
      if (finished) {
        runOnJS(goNext)();
      }
    });

    return () => {
      cancelAnimation(progress);
    };
  }, [currentIndex, clip, isVideo, isPaused, isPlaying, imageReady, clipDuration, goNext]);

  // ============ Video Status Handler ============
  const handleVideoStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        setIsBuffering(true);
        return;
      }

      const s = status as AVPlaybackStatusSuccess;
      setIsBuffering(s.isBuffering);

      if (!videoReady && s.isPlaying) {
        setVideoReady(true);
      }

      if (s.didJustFinish) {
        goNext();
        return;
      }

      // Update progress bar
      if (s.durationMillis && s.durationMillis > 0) {
        const prog = s.positionMillis / s.durationMillis;
        progress.value = Math.min(prog, 1);
        onViewProgress?.(clip?.id || 0, s.positionMillis / 1000);
      }
    },
    [videoReady, goNext, progress, clip, onViewProgress]
  );

  // ============ Long Press (Pause) ============
  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      if (isVideo) {
        videoRef.current?.pauseAsync().catch(() => {});
      } else {
        // Save progress for images
        pausedProgress.current = progress.value;
        cancelAnimation(progress);
      }
      setIsPaused(true);
      contentScale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    }, LONG_PRESS_DELAY);
  }, [isVideo, progress, contentScale]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isPaused) {
      if (isVideo) {
        videoRef.current?.playAsync().catch(() => {});
      }
      setIsPaused(false);
      contentScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  }, [isPaused, isVideo, contentScale]);

  // ============ Gesture: Vertical Swipe to Close ============
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([20, 500])
        .failOffsetX([-30, 30])
        .onUpdate((e) => {
          if (e.translationY > 10 && Math.abs(e.translationY) > Math.abs(e.translationX) * 1.5) {
            const resist = 1 - Math.min(e.translationY / MAX_DRAG, 0.5);
            dragY.value = Math.max(0, Math.min(e.translationY * resist, MAX_DRAG));

            if (dragY.value > 30) {
              runOnJS(setIsPlaying)(false);
              if (isVideo) {
                runOnJS(setIsPaused)(true);
              }
            }
          }
        })
        .onEnd((e) => {
          const projected = e.translationY + e.velocityY * 0.15;
          if (projected > CLOSE_THRESHOLD || (e.velocityY > 600 && e.translationY > 40)) {
            runOnJS(triggerClose)();
          } else {
            dragY.value = withSpring(0, { damping: 18, stiffness: 280 });
            runOnJS(setIsPlaying)(true);
            runOnJS(setIsPaused)(false);
          }
        }),
    [dragY, triggerClose, isVideo]
  );

  // ============ Animated Styles ============
  const containerStyle = useAnimatedStyle(() => {
    const prog = openProgress.value;

    // Scale from circle to fullscreen
    const scl = interpolate(prog, [0, 1], [initScale, 1], Extrapolate.CLAMP);
    const tx = interpolate(prog, [0, 1], [initTranslateX, 0], Extrapolate.CLAMP);
    const ty = interpolate(prog, [0, 1], [initTranslateY, 0], Extrapolate.CLAMP);
    const br = interpolate(prog, [0, 1], [origin.size / 2, 16], Extrapolate.CLAMP);

    // Drag modifiers
    const dragProg = Math.min(Math.max(0, dragY.value) / MAX_DRAG, 1);
    const dragScale = 1 - dragProg * 0.2;
    const dragTy = dragY.value * 0.7;

    return {
      transform: [
        { scale: scl * dragScale * contentScale.value },
        { translateX: tx },
        { translateY: ty + dragTy },
      ],
      borderRadius: br + dragProg * 24,
      opacity: interpolate(prog, [0, 0.3, 1], [0.5, 1, 1], Extrapolate.CLAMP),
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const prog = openProgress.value;
    const dragProg = Math.min(Math.max(0, dragY.value) / MAX_DRAG, 1);
    const alpha = interpolate(prog, [0, 1], [0, 1], Extrapolate.CLAMP) * (1 - dragProg);
    return { backgroundColor: `rgba(0,0,0,${alpha})` };
  });

  const uiStyle = useAnimatedStyle(() => {
    const dragProg = Math.min(Math.max(0, dragY.value) / MAX_DRAG, 1);
    return { opacity: contentOpacity.value * (1 - dragProg * 1.5) };
  });

  const mediaStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!clip) return null;

  const showLoader = isVideo ? (!videoReady || isBuffering) : !imageReady;

  return (
    <Animated.View style={[styles.root, backdropStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View style={[styles.container, containerStyle]}>
        {/* Progress bars */}
        <Animated.View style={[styles.progressRow, uiStyle, { top: insets.top + 12 }]}>
          {clips.map((c, i) => (
            <ProgressBar
              key={String(c.id)}
              index={i}
              progress={progress}
              currentIndex={currentIndexShared}
              total={clips.length}
            />
          ))}
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, uiStyle, { top: insets.top + 26 }]}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: avatarURL }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.timeAgo}>now</Text>
            </View>
          </View>
          <TouchableOpacity onPress={triggerClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#FFF" weight="bold" />
          </TouchableOpacity>
        </Animated.View>

        {/* Media Area */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.mediaContainer, mediaStyle]}>
            {/* Thumbnail placeholder while loading */}
            {clip.thumbURL && showLoader && (
              <Image
                source={{ uri: clip.thumbURL }}
                style={styles.thumbnailPlaceholder}
                blurRadius={Platform.OS === 'ios' ? 15 : 8}
              />
            )}

            {isVideo ? (
              <Video
                key={`video-${clip.id}-${currentIndex}`}
                ref={videoRef}
                source={{ uri: clip.mediaURL }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isPlaying && !isPaused}
                isLooping={false}
                isMuted={false}
                volume={1.0}
                progressUpdateIntervalMillis={100}
                onPlaybackStatusUpdate={handleVideoStatus}
                onError={(err) => {
                  console.warn('[StoryViewer] Video error:', err);
                  goNext();
                }}
              />
            ) : (
              <Image
                key={`image-${clip.id}-${currentIndex}`}
                source={{ uri: clip.mediaURL }}
                style={styles.media}
                resizeMode="cover"
                onLoad={() => setImageReady(true)}
                onError={() => {
                  setImageReady(true);
                  goNext();
                }}
              />
            )}

            {/* Loading spinner */}
            {showLoader && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}

            {/* Touch zones for navigation */}
            <View style={styles.touchZones}>
              <TouchableOpacity
                style={styles.leftZone}
                onPress={goPrev}
                onPressIn={handleLongPressStart}
                onPressOut={handleLongPressEnd}
                activeOpacity={1}
              />
              <TouchableOpacity
                style={styles.rightZone}
                onPress={goNext}
                onPressIn={handleLongPressStart}
                onPressOut={handleLongPressEnd}
                activeOpacity={1}
              />
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      </Animated.View>
    </Animated.View>
  );
};

// ============ Progress Bar Component ============
const ProgressBar: React.FC<{
  index: number;
  progress: SharedValue<number>;
  currentIndex: SharedValue<number>;
  total: number;
}> = React.memo(({ index, progress, currentIndex, total }) => {
  const GAP = 3;
  const barWidth = useMemo(() => {
    const gaps = (total - 1) * GAP;
    return (SCREEN_WIDTH - 32 - gaps) / total;
  }, [total]);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: index < currentIndex.value ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
  }));

  const fillStyle = useAnimatedStyle(() => {
    let w = 0;
    if (index < currentIndex.value) {
      w = barWidth;
    } else if (index === currentIndex.value) {
      w = barWidth * Math.max(0, Math.min(1, progress.value));
    }
    return { width: w };
  });

  return (
    <Animated.View style={[styles.bar, bgStyle, { width: barWidth, marginRight: index < total - 1 ? GAP : 0 }]}>
      <Animated.View style={[styles.barFill, fillStyle]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  container: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  progressRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    zIndex: 100,
  },
  bar: {
    height: 2.5,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 1.5,
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#333',
  },
  headerInfo: {
    marginLeft: 10,
  },
  username: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    flex: 1,
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  thumbnailPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  touchZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  leftZone: {
    flex: 1,
  },
  rightZone: {
    flex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});

export default StoryViewer;
