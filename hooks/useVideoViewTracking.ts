/**
 * Video View Tracking Hook - Professional Server Integration
 * 
 * Tracks which videos a user has viewed (logged in or anonymous)
 * Syncs with backend server for cross-device tracking
 * Shows badge on video tab for unseen videos
 * 
 * For new users who never viewed videos, always shows badge to encourage engagement
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useUser } from './useUser';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { videoEndpoints, endpoints } from '../constants';

const STORAGE_KEY_PREFIX = '@video_views_';
const LAST_VIDEO_COUNT_KEY = '@last_video_count';
const FIRST_VISIT_KEY = '@video_tab_first_visit';

interface VideoView {
  videoId: number;
  viewedAt: string;
  userId?: number;
  deviceId?: string;
}

interface UnseenResponse {
  success: boolean;
  has_unseen: boolean;
  unseen_count: number;
  is_new_user?: boolean;
  unseen_video_ids?: number[];
  newest_video_preview?: {
    video_url: string;
    thumbnail_url?: string;
    video_id: number | string;
  };
}

export const useVideoViewTracking = () => {
  const { user } = useUser();
  const [viewedVideoIds, setViewedVideoIds] = useState<Set<number>>(new Set());
  const [lastKnownVideoCount, setLastKnownVideoCount] = useState<number>(0);
  const [hasUnseenVideos, setHasUnseenVideos] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [newestVideoPreview, setNewestVideoPreview] = useState<{
    video_url: string;
    thumbnail_url?: string;
    video_id: number | string;
  } | null>(null);
  const initRef = useRef(false);
  const [deferUnseenFetch, setDeferUnseenFetch] = useState(true);

  // Defer unseen polling so it does not compete with the sale video feed on tab open.
  useEffect(() => {
    const t = setTimeout(() => setDeferUnseenFetch(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Get storage key based on user ID or device ID
  const getStorageKey = useCallback(async () => {
    if (user?.ID) {
      return `${STORAGE_KEY_PREFIX}user_${user.ID}`;
    } else {
      const deviceId = await getOrCreateDeviceId();
      return `${STORAGE_KEY_PREFIX}device_${deviceId}`;
    }
  }, [user?.ID]);

  // Load viewed videos from storage
  const loadViewedVideos = useCallback(async () => {
    try {
      const key = await getStorageKey();
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const views: VideoView[] = JSON.parse(stored);
        const ids = new Set(views.map(v => v.videoId));
        setViewedVideoIds(ids);
      }
    } catch (error) {
      console.error('[VideoViewTracking] Error loading viewed videos:', error);
    }
  }, [getStorageKey]);

  // Load last known video count
  const loadLastVideoCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(LAST_VIDEO_COUNT_KEY);
      if (stored) {
        setLastKnownVideoCount(parseInt(stored));
      }
    } catch (error) {
      console.error('[VideoViewTracking] Error loading video count:', error);
    }
  }, []);

  // Mark video as viewed - Professional Server Integration
  const markVideoAsViewed = useCallback(async (videoId: number, videoType: 'rent' | 'sale' = 'rent') => {
    try {
      const key = await getStorageKey();
      const stored = await AsyncStorage.getItem(key);
      const views: VideoView[] = stored ? JSON.parse(stored) : [];
      
      // Check if already viewed locally
      if (views.some(v => v.videoId === videoId)) {
        return; // Already marked locally
      }

      // Add to local storage immediately (optimistic update)
      const deviceId = await getOrCreateDeviceId();
      const newView: VideoView = {
        videoId,
        viewedAt: new Date().toISOString(),
        userId: user?.ID,
        deviceId
      };
      views.push(newView);

      // Keep only last 1000 views to prevent storage bloat
      const recentViews = views.slice(-1000);
      await AsyncStorage.setItem(key, JSON.stringify(recentViews));
      
      // Update state immediately
      setViewedVideoIds(prev => new Set([...prev, videoId]));

      // Sync with server in background (fire-and-forget)
      try {
        const baseURL = endpoints.baseURL || '';
        const endpoint = videoType === 'sale' 
          ? `${baseURL}/property-sale-videos/${videoId}/view`
          : `${baseURL}${videoEndpoints.recordView(videoId)}`;

        const payload: any = {
          video_id: videoId,
          video_type: videoType,
          viewed_at: newView.viewedAt,
          deviceID: deviceId
        };

        const headers: any = {};
        if (user?.accessToken) {
          headers.Authorization = `Bearer ${user.accessToken}`;
        }

        // Background sync - don't block UI
        axios.post(endpoint, payload, { 
          headers,
          timeout: 5000
        }).catch(err => {
          console.log('[VideoViewTracking] Background sync failed:', err.message);
        });
      } catch (serverError) {
        console.log('[VideoViewTracking] Server sync error:', serverError);
      }
    } catch (error) {
      console.error('[VideoViewTracking] Error marking video as viewed:', error);
    }
  }, [getStorageKey, user?.ID, user?.accessToken]);

  // Fetch unseen videos from server - Professional implementation
  const { data: unseenVideosData, refetch: refetchUnseenVideos, isLoading: isLoadingUnseen } = useQuery<UnseenResponse>({
    queryKey: ['unseen-videos', user?.ID],
    queryFn: async (): Promise<UnseenResponse> => {
      try {
        const deviceId = await getOrCreateDeviceId();
        const headers: any = {};
        
        if (user?.accessToken) {
          headers.Authorization = `Bearer ${user.accessToken}`;
        }

        // Use the correct server endpoint
        const baseURL = endpoints.baseURL || '';
        const params = new URLSearchParams();
        if (user?.ID) {
          params.append('user_id', user.ID.toString());
        }
        params.append('device_id', deviceId);

        const endpoint = `${baseURL}${videoEndpoints.getUnseenVideos}?${params.toString()}`;

        const response = await axios.get(endpoint, { 
          headers,
          timeout: 8000
        });

        return response.data as UnseenResponse;
      } catch (error: any) {
        console.log('[VideoViewTracking] Could not fetch unseen videos:', error?.message);
        // Return default state indicating potential unseen videos for new users
        return {
          success: false,
          has_unseen: true, // Default to true to show badge on error
          unseen_count: 0,
          is_new_user: true
        };
      }
    },
    enabled: !deferUnseenFetch,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Update hasUnseenVideos based on server data
  useEffect(() => {
    if (!unseenVideosData) return;

    // Server explicitly tells us if there are unseen videos
    if (unseenVideosData.has_unseen !== undefined) {
      setHasUnseenVideos(unseenVideosData.has_unseen);
      setUnseenCount(unseenVideosData.unseen_count || 0);
      console.log('[VideoViewTracking] Server says has_unseen:', unseenVideosData.has_unseen, 
        'is_new_user:', unseenVideosData.is_new_user,
        'unseen_count:', unseenVideosData.unseen_count);
    }

    // Update newest video preview for animated icon
    if (unseenVideosData.newest_video_preview) {
      setNewestVideoPreview(unseenVideosData.newest_video_preview);
    } else {
      setNewestVideoPreview(null);
    }

    setIsInitialized(true);
  }, [unseenVideosData]);

  // Check for first-time users - show badge by default
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        const firstVisit = await AsyncStorage.getItem(FIRST_VISIT_KEY);
        
        // If user has never visited video tab, show badge
        if (!firstVisit) {
          console.log('[VideoViewTracking] First time user detected - showing badge');
          setHasUnseenVideos(true);
        }
      } catch (error) {
        console.log('[VideoViewTracking] Error checking first visit:', error);
        // Default to showing badge on error
        setHasUnseenVideos(true);
      }
    };

    checkFirstTimeUser();
  }, []);

  // Update video count and check for unseen videos (fallback method)
  const updateVideoCount = useCallback(async (currentVideoCount: number) => {
    try {
      await AsyncStorage.setItem(LAST_VIDEO_COUNT_KEY, currentVideoCount.toString());
      
      // If count increased, there are potentially unseen videos
      if (currentVideoCount > lastKnownVideoCount && lastKnownVideoCount > 0) {
        setHasUnseenVideos(true);
      }
      
      setLastKnownVideoCount(currentVideoCount);
    } catch (error) {
      console.error('[VideoViewTracking] Error updating video count:', error);
    }
  }, [lastKnownVideoCount]);

  // Check if specific video is viewed
  const isVideoViewed = useCallback((videoId: number) => {
    return viewedVideoIds.has(videoId);
  }, [viewedVideoIds]);

  // Clear unseen badge (when user enters video tab) - Sync with server
  const clearUnseenBadge = useCallback(async () => {
    // Immediately clear the badge
    setHasUnseenVideos(false);
    
    // Mark first visit
    await AsyncStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString());
    
    // Notify server that user has viewed the video tab
    try {
      const deviceId = await getOrCreateDeviceId();
      const headers: any = {};
      
      if (user?.accessToken) {
        headers.Authorization = `Bearer ${user.accessToken}`;
      }

      const payload: any = {
        viewed_at: new Date().toISOString(),
        device_id: deviceId
      };

      if (user?.ID) {
        payload.user_id = user.ID;
      }

      // Background sync
      const baseURL = endpoints.baseURL || '';
      axios.post(
        `${baseURL}${videoEndpoints.markAllViewed}`,
        payload,
        { headers, timeout: 5000 }
      ).catch(() => {});

      // Do not refetch unseen immediately — that blocks perceived feed load.
    } catch (error) {
      console.log('[VideoViewTracking] Error clearing badge:', error);
    }
  }, [user?.ID, user?.accessToken]);

  // Load initial data
  useEffect(() => {
    loadViewedVideos();
    loadLastVideoCount();
  }, [loadViewedVideos, loadLastVideoCount]);

  return {
    markVideoAsViewed,
    isVideoViewed,
    hasUnseenVideos,
    unseenCount,
    newestVideoPreview,
    clearUnseenBadge,
    updateVideoCount,
    viewedVideoCount: viewedVideoIds.size,
    isLoadingUnseen,
    isInitialized,
    refetchUnseenVideos
  };
};
