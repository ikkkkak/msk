import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import axios from 'axios';
import { endpoints, videoEndpoints } from '../constants';
import { useUser } from '../hooks/useUser';
import { useNavigation } from '@react-navigation/native';

interface FloatingVideoWindowProps {
  sheetIndex: number; // 0, 1, or 2 - controls animation
}

export const FloatingVideoWindow: React.FC<FloatingVideoWindowProps> = ({
  sheetIndex,
}) => {
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const [video, setVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);
  const videoRef = useRef<Video>(null);
  const { user } = useUser();
  const navigation = useNavigation();
  
  // Animation for sliding based on sheet position
  const translateX = useSharedValue(0);
  
  // Fetch random video on mount - ensure different video each time
  useEffect(() => {
    if (!showVideo) return;
    
    const fetchRandomVideo = async () => {
      setIsLoading(true);
      setVideoError(false);
      try {
        const apiClient = user?.accessToken 
          ? axios.create({
              baseURL: endpoints.baseURL,
              headers: { Authorization: `Bearer ${user.accessToken}` },
            })
          : axios.create({ baseURL: endpoints.baseURL });
        
        // Fetch multiple videos (limit=10) to ensure variety, then pick one randomly
        // Add timestamp to query to bypass cache and get fresh results each time
        const timestamp = Date.now();
        const feedUrl = videoEndpoints.feed(1, 10);
        const separator = feedUrl.includes('?') ? '&' : '?';
        const response = await apiClient.get(`${feedUrl}${separator}_t=${timestamp}`);
        const videos = response.data?.videos || [];
        console.log('🎬 FloatingVideoWindow: Fetched videos:', videos.length);
        
        if (videos.length > 0) {
          // Pick a random video from the fetched videos to ensure variety
          const randomIndex = Math.floor(Math.random() * videos.length);
          const selectedVideo = videos[randomIndex];
          
          // Validate video URL before setting
          if (selectedVideo.videoURL && typeof selectedVideo.videoURL === 'string' && selectedVideo.videoURL.trim().length > 0) {
            setVideo(selectedVideo);
            setVideoError(false);
            console.log('✅ FloatingVideoWindow: Video set:', selectedVideo.videoURL);
            console.log('📋 FloatingVideoWindow: Property ID:', selectedVideo.property_id || selectedVideo.PropertyID || selectedVideo.propertyID || selectedVideo.Property?.ID);
          } else {
            console.warn('⚠️ FloatingVideoWindow: Invalid video URL, trying next video');
            // Try next video if available
            if (videos.length > 1) {
              const nextIndex = (randomIndex + 1) % videos.length;
              const nextVideo = videos[nextIndex];
              if (nextVideo.videoURL && typeof nextVideo.videoURL === 'string' && nextVideo.videoURL.trim().length > 0) {
                setVideo(nextVideo);
                setVideoError(false);
                console.log('✅ FloatingVideoWindow: Using fallback video:', nextVideo.videoURL);
              } else {
                console.error('❌ FloatingVideoWindow: No valid videos found');
                setVideoError(true);
              }
            } else {
              setVideoError(true);
            }
          }
        } else {
          console.warn('⚠️ FloatingVideoWindow: No videos found');
          setVideoError(true);
        }
      } catch (error) {
        console.error('❌ FloatingVideoWindow: Error fetching random video:', error);
        setVideoError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRandomVideo();
  }, [showVideo, user?.accessToken]);
  
  // Animate based on sheet position
  useEffect(() => {
    const windowWidth = 80; // Updated width of the floating video window (user changed it)
    
    if (sheetIndex === 2) {
      // Sheet is up - slide back in (fully visible) - smooth, no bounce
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Sheet is down (index 0 or 1) - slide right showing only 10% visible
      // Calculate: move right by 90% of window width (so 10% remains visible)
      const hiddenAmount = windowWidth * 0.9;
      translateX.value = withTiming(hiddenAmount, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [sheetIndex]);
  
  // Initialize position on mount based on initial sheet index
  useEffect(() => {
    const windowWidth = 80; // Updated width of the floating video window (user changed it)
    
    // Start at correct position based on initial sheet index
    if (sheetIndex === 2) {
      translateX.value = 0; // Fully visible
    } else {
      // Show only 10% (hide 90%)
      const hiddenAmount = windowWidth * 0.9;
      translateX.value = hiddenAmount;
    }
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  if (!showVideo) {
    return null;
  }
  
  const handlePress = () => {
    if (!video) return;
    
    // Try all possible property ID field names
    const propertyId = 
      video.property_id || 
      video.PropertyID || 
      video.propertyID || 
      video.Property?.ID || 
      video.property?.ID ||
      video.Property?.property_id ||
      video.Property?.PropertyID;
    
    console.log('🔍 FloatingVideoWindow: Navigating to property:', propertyId);
    console.log('📋 FloatingVideoWindow: Video object:', JSON.stringify(video, null, 2));
    
    if (propertyId) {
      (navigation as any).navigate('PropertyDetails', { propertyID: propertyId });
    } else {
      console.warn('⚠️ FloatingVideoWindow: No property ID found in video:', video);
    }
  };
  
  const handleClose = () => {
    setShowVideo(false);
    videoRef.current?.pauseAsync();
  };
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.wrapper}
        activeOpacity={0.9}
        onPress={handlePress}
        disabled={!video}
      >
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
        
        {/* Video Player */}
        {video && video.videoURL && !videoError ? (
          <Video
            ref={videoRef}
            source={{ uri: video.videoURL }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            useNativeControls={false}
            posterSource={video.thumbURL || video.thumbnail || video.videoThumbnail ? { uri: video.thumbURL || video.thumbnail || video.videoThumbnail } : undefined}
            usePoster={!!(video.thumbURL || video.thumbnail || video.videoThumbnail)}
            onLoad={() => {
              console.log('✅ FloatingVideoWindow: Video loaded, playing...');
              setVideoError(false);
              videoRef.current?.playAsync().catch((err) => {
                console.error('❌ FloatingVideoWindow: Play error:', err);
                setVideoError(true);
              });
            }}
            onError={(error) => {
              console.error('❌ FloatingVideoWindow: Video error:', error);
              console.error('❌ FloatingVideoWindow: Video URL:', video.videoURL);
              setVideoError(true);
              // Try to fetch a new video if current one fails
              setTimeout(() => {
                if (showVideo && videoError) {
                  console.log('🔄 FloatingVideoWindow: Attempting to fetch new video after error...');
                  setVideo(null);
                  setVideoError(false);
                }
              }, 2000);
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            {videoError ? (
              <>
                <MaterialIcons name="error-outline" size={20} color="#FFFFFF" />
                <MaterialIcons name="refresh" size={16} color="#FFFFFF" style={{ marginTop: 4 }} />
              </>
            ) : (
              <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above FAB button (FAB is typically at bottom: 20-30)
    right: 5,
    width: 80,
    height: 120,
    zIndex: 1000,
    overflow: 'hidden',
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});
