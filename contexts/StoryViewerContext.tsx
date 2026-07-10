import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { Image, InteractionManager } from 'react-native';
import { StoryClip } from '../components/StoryViewer';

interface StoryViewerData {
  username: string;
  avatarURL: string;
  clips: StoryClip[];
  origin: { x: number; y: number; size: number };
  onViewed?: () => void;
}

interface StoryViewerContextType {
  viewerOpen: boolean;
  viewerData: StoryViewerData | null;
  openViewer: (data: StoryViewerData) => void;
  closeViewer: () => void;
  isTransitioning: boolean;
}

const StoryViewerContext = createContext<StoryViewerContextType | undefined>(undefined);

// Prefetch media for faster display
const prefetchMedia = async (clips: StoryClip[]) => {
  if (!clips || clips.length === 0) return;
  
  const prefetchPromises: Promise<boolean>[] = [];
  
  // Prefetch first 3 clips' thumbnails and images
  const firstClips = clips.slice(0, 3);
  
  for (const clip of firstClips) {
    // Prefetch thumbnail
    if (clip.thumbURL) {
      prefetchPromises.push(
        Image.prefetch(clip.thumbURL).catch(() => false)
      );
    }
    
    // Prefetch images directly
    if (clip.type === 'image' && clip.mediaURL) {
      prefetchPromises.push(
        Image.prefetch(clip.mediaURL).catch(() => false)
      );
    }
  }
  
  // Execute all prefetches in parallel (non-blocking)
  await Promise.all(prefetchPromises).catch(() => {});
};

export const StoryViewerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<StoryViewerData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const openViewer = useCallback((data: StoryViewerData) => {
    // Clear any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // Start prefetching immediately
    prefetchMedia(data.clips);

    // Set data first, then open after interaction completes for smoother animation
    setViewerData(data);
    setIsTransitioning(true);

    // Use InteractionManager to ensure smooth opening
    InteractionManager.runAfterInteractions(() => {
      setViewerOpen(true);
      // Small delay to let the animation start
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    });
  }, []);

  const closeViewer = useCallback(() => {
    setIsTransitioning(true);
    setViewerOpen(false);
    
    // Delay clearing data to allow close animation to complete
    closeTimeoutRef.current = setTimeout(() => {
      setViewerData(null);
      setIsTransitioning(false);
    }, 400);
  }, []);

  return (
    <StoryViewerContext.Provider
      value={{
        viewerOpen,
        viewerData,
        openViewer,
        closeViewer,
        isTransitioning,
      }}
    >
      {children}
    </StoryViewerContext.Provider>
  );
};

export const useStoryViewer = () => {
  const context = useContext(StoryViewerContext);
  if (!context) {
    throw new Error('useStoryViewer must be used within StoryViewerProvider');
  }
  return context;
};
