import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Trash, Play, Image as ImageIcon, Warning, Plus } from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { endpoints } from '../constants';
import { useUser } from '../hooks/useUser';
import { AddStoryModal } from '../components/AddStoryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Story {
  id: number;
  type: 'image' | 'video';
  media_url: string;
  thumb_url: string;
  caption: string;
  duration_seconds: number;
  created_at: string;
  expires_at: string;
}

export const MyStoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [deleteMultipleModalVisible, setDeleteMultipleModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addStoryVisible, setAddStoryVisible] = useState(false);
  const modalScale = React.useRef(new Animated.Value(0)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;

  const fetchStories = useCallback(async () => {
    if (!user?.ID) return;
    
    try {
      const res = await axios.get(`${endpoints.baseURL}/stories/${user.ID}`);
      const rawStories = res.data?.stories || [];
      // Transform and filter stories to ensure valid data
      const storiesList = rawStories
        .map((s: any, index: number) => ({
          id: s.id || s.ID || index, // Fallback to index if no ID
          type: s.type || 'image',
          media_url: s.media_url || s.mediaURL || '',
          thumb_url: s.thumb_url || s.thumbURL || s.media_url || s.mediaURL || '',
          caption: s.caption || '',
          duration_seconds: s.duration_seconds || s.durationSeconds || 5,
          created_at: s.created_at || s.createdAt || new Date().toISOString(),
          expires_at: s.expires_at || s.expiresAt || new Date().toISOString(),
        }))
        .filter((s: Story) => s.id != null && s.media_url) as Story[];
      setStories(storiesList);
    } catch (error) {
      console.error('[MyStories] Fetch error:', error);
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.ID]);

  useFocusEffect(
    useCallback(() => {
      fetchStories();
    }, [fetchStories])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStories();
  }, [fetchStories]);

  const showDeleteModal = useCallback((story: Story) => {
    setStoryToDelete(story);
    setDeleteModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalScale, modalOpacity]);

  const hideDeleteModal = useCallback(() => {
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDeleteModalVisible(false);
      setStoryToDelete(null);
    });
  }, [modalScale, modalOpacity]);

  const handleDelete = useCallback(async () => {
    if (!storyToDelete) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`${endpoints.baseURL}/stories/${storyToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
      // Remove from local state
      setStories(prev => prev.filter(s => s.id !== storyToDelete.id));
      hideDeleteModal();
    } catch (error: any) {
      console.error('[MyStories] Delete error:', error);
      // If 404, story was already deleted (maybe expired or deleted elsewhere)
      // Just remove it from local state and close modal
      if (error.response?.status === 404) {
        setStories(prev => prev.filter(s => s.id !== storyToDelete.id));
        hideDeleteModal();
        return;
      }
      const errorMessage = error.response?.status === 403
        ? 'You can only delete your own stories'
        : 'Failed to delete story. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [storyToDelete, user?.accessToken, hideDeleteModal]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const showDeleteMultipleModal = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteMultipleModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedIds.size, modalScale, modalOpacity]);

  const hideDeleteMultipleModal = useCallback(() => {
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDeleteMultipleModalVisible(false);
    });
  }, [modalScale, modalOpacity]);

  const handleDeleteMultiple = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    try {
      setIsDeleting(true);
      const idsToDelete = new Set(selectedIds);
      setDeletingIds(idsToDelete);
      
      // Delete stories and collect results
      const deleteResults = await Promise.allSettled(
        Array.from(idsToDelete).map(id =>
          axios.delete(`${endpoints.baseURL}/stories/${id}`, {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
            },
          })
        )
      );
      
      // Check for errors (excluding 404s which are acceptable)
      const errors = deleteResults.filter(
        (result) => result.status === 'rejected' && 
        result.reason?.response?.status !== 404
      );
      
      // Remove deleted stories from local state (including 404s - they're already gone)
      setStories(prev => prev.filter(s => !idsToDelete.has(s.id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
      hideDeleteMultipleModal();
      
      // Only show error if there were non-404 errors
      if (errors.length > 0) {
        const errorMessage = errors.some((e: any) => e.reason?.response?.status === 403)
          ? 'You can only delete your own stories'
          : 'Some stories could not be deleted. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('[MyStories] Delete multiple error:', error);
      // Even on error, remove from local state if it was a 404
      if (error.response?.status === 404) {
        setStories(prev => prev.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
        setSelectionMode(false);
        hideDeleteMultipleModal();
        return;
      }
      const errorMessage = error.response?.status === 403
        ? 'You can only delete your own stories'
        : 'Failed to delete some stories. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeletingIds(new Set());
      setIsDeleting(false);
    }
  }, [user?.accessToken, selectedIds, hideDeleteMultipleModal]);

  const toggleSelection = useCallback((storyId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderStoryItem = ({ item }: { item: Story }) => {
    const isSelected = selectedIds.has(item.id);
    const isDeleting = deletingIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.storyItem,
          isSelected && styles.storyItemSelected,
          isDeleting && styles.storyItemDeleting,
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
        disabled={isDeleting}
      >
        <View style={styles.storyThumbnail}>
          <Image
            source={{ uri: item.thumb_url || item.media_url }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          <View style={styles.mediaTypeBadge}>
            {item.type === 'video' ? (
              <Play size={14} color="#FFFFFF" weight="fill" />
            ) : (
              <ImageIcon size={14} color="#FFFFFF" weight="fill" />
            )}
          </View>
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <View style={styles.selectedCheckmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            </View>
          )}
          {isDeleting && (
            <View style={styles.deletingOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.storyInfo}>
          <Text style={styles.storyTime}>{formatTime(item.created_at)}</Text>
          {item.caption && (
            <Text style={styles.storyCaption} numberOfLines={2}>
              {item.caption}
            </Text>
          )}
        </View>
        {!selectionMode && !isDeleting && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => showDeleteModal(item)}
          >
            <Trash size={16} color="#666666" weight="regular" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="small" color="#111111" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color="#000000" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stories</Text>
        {selectionMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            {selectedIds.size > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteActionButton, { marginLeft: 12 }]}
                onPress={showDeleteMultipleModal}
              >
                <Text style={styles.deleteActionButtonText}>
                  Delete ({selectedIds.size})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addStoryButton}
              onPress={() => setAddStoryVisible(true)}
              accessibilityLabel="Add story"
            >
              <Plus size={16} color="#111111" weight="bold" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { marginLeft: 8 }]}
              onPress={() => setSelectionMode(true)}
            >
              <Text style={styles.actionButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stories List */}
      {stories.length === 0 ? (
        <View style={styles.centerContent}>
          <ImageIcon size={28} color="#999999" weight="regular" />
          <Text style={styles.emptyText}>No stories</Text>
          <Text style={styles.emptySubtext}>Photos and videos expire after 24h</Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => setAddStoryVisible(true)}
          >
            <Plus size={14} color="#111111" weight="bold" />
            <Text style={styles.emptyAddButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item, index) => {
            // Ensure unique keys - use ID if available, otherwise use index
            const key = item.id != null ? String(item.id) : `story-${index}`;
            return key;
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Single Delete Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideDeleteModal}
      >
        <Animated.View 
          style={[
            styles.modalBackdrop,
            { opacity: modalOpacity }
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            {storyToDelete && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <Warning size={24} color="#666666" weight="regular" />
                  </View>
                  <Text style={styles.modalTitle}>Delete Story?</Text>
                  <Text style={styles.modalMessage}>
                    This story will be permanently deleted. This action cannot be undone.
                  </Text>
                </View>

                <View style={styles.modalPreview}>
                  <Image
                    source={{ uri: storyToDelete.thumb_url || storyToDelete.media_url }}
                    style={styles.modalPreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.modalPreviewOverlay}>
                    {storyToDelete.type === 'video' ? (
                      <Play size={24} color="#FFFFFF" weight="fill" />
                    ) : (
                      <ImageIcon size={24} color="#FFFFFF" weight="fill" />
                    )}
                  </View>
                  {storyToDelete.caption && (
                    <View style={styles.modalPreviewCaption}>
                      <Text style={styles.modalPreviewCaptionText} numberOfLines={2}>
                        {storyToDelete.caption}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={hideDeleteModal}
                    disabled={isDeleting}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonDelete, { marginLeft: 12 }]}
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Trash size={18} color="#FFFFFF" weight="fill" style={{ marginRight: 8 }} />
                        <Text style={styles.modalButtonDeleteText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Multiple Delete Modal */}
      <Modal
        visible={deleteMultipleModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideDeleteMultipleModal}
      >
        <Animated.View 
          style={[
            styles.modalBackdrop,
            { opacity: modalOpacity }
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Warning size={24} color="#666666" weight="regular" />
              </View>
              <Text style={styles.modalTitle}>Delete {selectedIds.size} Stories?</Text>
              <Text style={styles.modalMessage}>
                {selectedIds.size === 1 
                  ? 'This story will be permanently deleted. This action cannot be undone.'
                  : `These ${selectedIds.size} stories will be permanently deleted. This action cannot be undone.`}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={hideDeleteMultipleModal}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete, { marginLeft: 12 }]}
                onPress={handleDeleteMultiple}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash size={18} color="#FFFFFF" weight="fill" style={{ marginRight: 8 }} />
                    <Text style={styles.modalButtonDeleteText}>
                      Delete {selectedIds.size}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <AddStoryModal
        visible={addStoryVisible}
        onClose={() => setAddStoryVisible(false)}
        onUploaded={() => {
          setAddStoryVisible(false);
          fetchStories();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444444',
  },
  deleteActionButton: {
    backgroundColor: '#111111',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addStoryButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCCCCC',
  },
  emptyAddButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: '#CCCCCC',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 64,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginBottom: 24,
    position: 'relative',
  },
  modalPreviewImage: {
    width: '100%',
    height: '100%',
  },
  modalPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPreviewCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  modalPreviewCaptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalButtonDelete: {
    backgroundColor: '#111111',
  },
  modalButtonDeleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  storyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
  },
  storyItemSelected: {
    borderColor: '#111111',
    backgroundColor: '#FAFAFA',
  },
  storyItemDeleting: {
    opacity: 0.5,
  },
  storyThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  storyTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 2,
  },
  storyCaption: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 15,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444444',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#888888',
  },
});

