import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "../hooks/queries/useNotifications";
import { api } from "../services/api";
import { endpoints } from "../constants";
import { useGroupJoinRequests, useRespondToJoinRequest } from "../hooks/queries/useGroupDiscovery";
import {
  resolveNotificationMessage,
  resolveNotificationTitle,
} from "../utils/notificationDisplay";

const { height: screenHeight } = Dimensions.get('window');

export const NotificationsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { data: notifications = [], refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Get join requests for the selected group
  const { data: joinRequests = [] } = useGroupJoinRequests(selectedGroupId || 0);
  const respondToJoinRequest = useRespondToJoinRequest();

  // Handle modal animations
  useEffect(() => {
    if (showJoinRequestModal) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showJoinRequestModal]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        Alert.alert('Success', 'All notifications marked as read');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to mark notifications as read');
      },
    });
  };

  const handleJoinRequest = (action: 'accept' | 'decline', requestId: number) => {
    respondToJoinRequest.mutate(
      { requestId, action },
      {
        onSuccess: () => {
          Alert.alert(
            'Success',
            `Join request ${action === 'accept' ? 'accepted' : 'declined'} successfully`
          );
          // Refresh notifications to update the list
          refetch();
        },
        onError: () => {
          Alert.alert('Error', `Failed to ${action} join request`);
        },
      }
    );
  };

  const handleNotificationPress = (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead.mutate(notification.id || notification.ID);
    }

    // Handle based on notification type
    if (notification.type === 'group_join_request' && notification.refType === 'group') {
      // Show join request modal directly in notifications screen
      setSelectedGroupId(notification.refID);
      setShowJoinRequestModal(true);
    } else if (notification.type === 'group_join_accepted' || notification.type === 'group_join_declined') {
      (navigation as any).navigate('Messages');
    } else if (notification.type === 'meskeny_guide') {
      const commentId = notification.refID || notification.refId;
      if (commentId) {
        api
          .get(endpoints.guideComment(Number(commentId)))
          .then((res) => {
            const c = res.data?.comment;
            const lid = c?.propertySaleId ?? c?.property_sale_id;
            if (lid) {
              (navigation as any).navigate('ListingGuide', {
                propertySaleId: Number(lid),
                commentId: Number(commentId),
              });
            } else {
              (navigation as any).navigate('MyGuideFeed');
            }
          })
          .catch(() => {
            (navigation as any).navigate('MyGuideFeed');
          });
      } else {
        (navigation as any).navigate('MyGuideFeed');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <MaterialIcons name="event" size={24} color="#00A699" />;
      case "message":
        return <MaterialIcons name="message" size={24} color="#FF5A5F" />;
      case "review":
        return <MaterialIcons name="star" size={24} color="#FFB400" />;
      case "reminder":
        return <MaterialIcons name="schedule" size={24} color="#767676" />;
      case "group_join_request":
        return <MaterialIcons name="group-add" size={24} color="#00A699" />;
      case "group_join_accepted":
        return <MaterialIcons name="check-circle" size={24} color="#00A699" />;
      case "group_join_declined":
        return <MaterialIcons name="cancel" size={24} color="#FF5A5F" />;
      case "meskeny_guide":
        return <MaterialIcons name="auto-awesome" size={24} color="#008489" />;
      default:
        return <MaterialIcons name="notifications" size={24} color="#767676" />;
    }
  };

  const formatTime = (createdAt: string) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderNotification = (notification: any) => (
    <TouchableOpacity
      key={notification.id || notification.ID}
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(notification.type)}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>
            {resolveNotificationTitle(notification)}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.createdAt || notification.CreatedAt)}
          </Text>
        </View>
        <Text style={styles.notificationMessage}>
          {resolveNotificationMessage(notification)}
        </Text>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some((n: any) => !n.isRead) && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={markAllAsRead.isLoading}
          >
            <Text style={styles.markAllText}>
              {markAllAsRead.isLoading ? 'Marking...' : 'Mark all as read'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
<Image
          source={require('../assets/Envelope.jpg')}
          style={{
            width: 50,
            height: 50
          }}
          />
            <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
            <Text style={styles.emptyMessage}>
              {t('notifications.emptySubtitle')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Join Request Modal */}
      <Modal
        visible={showJoinRequestModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowJoinRequestModal(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => setShowJoinRequestModal(false)}
          />
          <Animated.View 
            style={[
              styles.modalContainer, 
              { 
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>{t('notifications.joinRequests')}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowJoinRequestModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sheetSubtitle}>
              {t('notifications.pendingRequests', { count: joinRequests.length })}
            </Text>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {joinRequests.map((request: any) => (
                <View key={request.id || request.ID} style={styles.joinRequestItem}>
                  <Image 
                    source={{ uri: request.requester?.avatarURL || 'https://i.pravatar.cc/100' }} 
                    style={styles.joinRequestAvatar} 
                  />
                  <View style={styles.joinRequestContent}>
                    <Text style={styles.joinRequestName}>
                      {request.requester?.firstName || ''} {request.requester?.lastName || ''}
                    </Text>
                    {request.requester?.bio && (
                      <Text style={styles.joinRequestBio} numberOfLines={2}>
                        {request.requester.bio}
                      </Text>
                    )}
                    <Text style={styles.joinRequestMessage}>
                      {request.message || t('notifications.wantsToJoin')}
                    </Text>
                    <Text style={styles.joinRequestTime}>
                      {new Date(request.createdAt || request.CreatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.joinRequestActions}>
                    <TouchableOpacity 
                      style={[styles.joinRequestBtn, styles.acceptBtn]}
                      onPress={() => handleJoinRequest('accept', request.id || request.ID)}
                      disabled={respondToJoinRequest.isLoading}
                    >
                      <Text style={styles.acceptBtnText}>{t('notifications.accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.joinRequestBtn, styles.declineBtn]}
                      onPress={() => handleJoinRequest('decline', request.id || request.ID)}
                      disabled={respondToJoinRequest.isLoading}
                    >
                      <Text style={styles.declineBtnText}>{t('notifications.decline')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    color: "#00A699",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  unreadNotification: {
    backgroundColor: "#F8F9FA",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: "#767676",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#767676",
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5A5F",
    marginTop: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#767676",
    textAlign: "center",
    lineHeight: 24,
  },
  // Join Request Modal Styles
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  joinRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  joinRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  joinRequestContent: {
    flex: 1,
  },
  joinRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  joinRequestBio: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  joinRequestMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  joinRequestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  joinRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinRequestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptBtn: {
    backgroundColor: '#00A699',
  },
  declineBtn: {
    backgroundColor: '#FF5A5F',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  declineBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetCancel: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
