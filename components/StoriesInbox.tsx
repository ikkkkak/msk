import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ViewToken,
} from 'react-native';
import { User, Play } from 'phosphor-react-native';
import useStoriesPreload, { StoryPreviewTarget } from '../hooks/useStoriesPreload';
import StoriesSkeleton from './StoriesSkeleton';

export interface StoryInboxItem {
  userId: number;
  username: string;
  avatarURL: string;
  hasUnseen: boolean;
  firstThumb?: string;
  isVideo?: boolean;
}

interface StoriesInboxProps {
  data: StoryInboxItem[];
  onOpenUserStories: (userId: number, origin?: { x: number; y: number; size: number }) => void;
  loading?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 48;
const RING_SIZE = AVATAR_SIZE + 4;
const ITEM_WIDTH = 58;

const StoryItem: React.FC<{
  item: StoryInboxItem;
  onOpenUserStories: (userId: number, origin?: { x: number; y: number; size: number }) => void;
}> = React.memo(({ item, onOpenUserStories }) => {
  const itemRef = useRef<View>(null);
  const latestOrigin = useRef<{ x: number; y: number; size: number } | null>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const thumbnailUri = useMemo(() => {
    const thumb = item.firstThumb?.trim();
    const avatar = item.avatarURL?.trim();
    return thumb || avatar || '';
  }, [item.firstThumb, item.avatarURL]);

  const measureOrigin = useCallback(
    (callback?: (origin: { x: number; y: number; size: number }) => void) => {
      requestAnimationFrame(() => {
        itemRef.current?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
          const size = Math.max(width, height, AVATAR_SIZE);
          const origin = { x: x + width / 2, y: y + height / 2, size };
          latestOrigin.current = origin;
          callback?.(origin);
        });
      });
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => measureOrigin(), 100);
    return () => clearTimeout(timer);
  }, [measureOrigin]);

  const handlePress = useCallback(() => {
    const existingOrigin = latestOrigin.current;
    if (existingOrigin) {
      onOpenUserStories(item.userId, existingOrigin);
      return;
    }
    measureOrigin((origin) => onOpenUserStories(item.userId, origin));
    setTimeout(() => {
      if (!latestOrigin.current) {
        onOpenUserStories(item.userId, {
          x: SCREEN_WIDTH / 2,
          y: Dimensions.get('window').height / 2,
          size: AVATAR_SIZE,
        });
      }
    }, 60);
  }, [item.userId, onOpenUserStories, measureOrigin]);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={handlePress} style={styles.item}>
      <View
        ref={itemRef as any}
        style={[
          styles.avatarContainer,
          item.hasUnseen ? styles.ringUnseen : styles.ringSeen,
        ]}
        collapsable={false}
        onLayout={() => measureOrigin()}
      >
        <View style={styles.avatarWrapper}>
          {thumbnailUri && !thumbnailError ? (
            <>
              <Image
                source={{ uri: thumbnailUri }}
                style={[styles.avatar, !thumbnailLoaded && styles.avatarLoading]}
                onLoad={() => setThumbnailLoaded(true)}
                onError={() => setThumbnailError(true)}
              />
              {item.isVideo && thumbnailLoaded && (
                <View style={styles.playOverlay}>
                  <Play size={10} color="#FFF" weight="fill" />
                </View>
              )}
            </>
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={18} color="#FFFFFF" weight="fill" />
            </View>
          )}
        </View>
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );
});

export const StoriesInbox: React.FC<StoriesInboxProps> = ({
  data,
  onOpenUserStories,
  loading = false,
}) => {
  const listData = useMemo(() => {
    const items = data || [];
    return [...items].sort((a, b) => {
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return 0;
    });
  }, [data]);

  const preloadTargets = useMemo<StoryPreviewTarget[]>(() => {
    return listData.map((item) => {
      const thumbUrl = (item.firstThumb || item.avatarURL)?.trim();
      return {
        userId: item.userId,
        thumbURL: thumbUrl || undefined,
        type: item.isVideo ? 'video' : 'image',
      };
    });
  }, [listData]);

  useStoriesPreload(preloadTargets, 8, {
    preloadMetadata: true,
    preloadVideos: true,
  });

  const renderItem = useCallback(
    ({ item }: { item: StoryInboxItem }) => (
      <StoryItem item={item} onOpenUserStories={onOpenUserStories} />
    ),
    [onOpenUserStories],
  );

  const keyExtractor = useCallback((item: StoryInboxItem) => String(item.userId), []);

  if (loading && listData.length === 0) {
    return <StoriesSkeleton />;
  }

  if (listData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={6}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index + 10,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginRight: 2,
  },
  avatarContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringUnseen: {
    borderWidth: 1.5,
    borderColor: '#111111',
  },
  ringSeen: {
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#EEEEEE',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarLoading: {
    opacity: 0,
  },
  avatarPlaceholder: {
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 10,
    fontWeight: '400',
    color: '#444444',
    marginTop: 4,
    maxWidth: ITEM_WIDTH - 4,
    textAlign: 'center',
  },
});

export default StoriesInbox;
