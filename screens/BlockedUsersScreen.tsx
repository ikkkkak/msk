import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeftIcon, Shield, UserMinus } from 'phosphor-react-native';
import { useGetBlockedUsers, useUnblockUser } from '../hooks/queries/useExperienceInvites';
import { DirectMessageBlockModal } from '../components/DirectMessageBlockModal';

export const BlockedUsersScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data: blockedUsers = [], isLoading } = useGetBlockedUsers();
  const unblockUser = useUnblockUser();
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleUnblock = async (user: any) => {
    try {
      await unblockUser.mutateAsync(user.blocked_id);
      Alert.alert(
        t('messages.unblock.success.title', 'User Unblocked'),
        t('messages.unblock.success.message', 'You have unblocked this user. They can now send you direct messages again.'),
        [{ text: t('common.ok', 'OK') }]
      );
    } catch (error: any) {
      Alert.alert(
        t('messages.unblock.error.title', 'Error'),
        error?.response?.data?.error || t('messages.unblock.error.message', 'Failed to unblock user. Please try again.'),
        [{ text: t('common.ok', 'OK') }]
      );
    }
  };

  const openUnblockModal = (user: any) => {
    setSelectedUser(user);
    setShowUnblockModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon size={24} color="#222222" weight="duotone" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('messages.blockedUsers.title', 'Blocked Users')}</Text>
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.empty}>
          <Shield size={64} color="#DDDDDD" weight="light" />
          <Text style={styles.emptyTitle}>{t('messages.blockedUsers.emptyTitle', 'No blocked users')}</Text>
          <Text style={styles.emptySub}>{t('messages.blockedUsers.emptySubtitle', 'Users you block will appear here.')}</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <BlockedUserRow 
              user={item} 
              onUnblock={() => openUnblockModal(item)}
            />
          )}
        />
      )}

      {/* Unblock Modal */}
      <DirectMessageBlockModal
        visible={showUnblockModal}
        onClose={() => {
          setShowUnblockModal(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.blocked_id || 0}
        userName={selectedUser?.user_name || ''}
        userEmail={selectedUser?.user_email || ''}
        isBlocked={true}
        onSuccess={() => {
          setShowUnblockModal(false);
          setSelectedUser(null);
        }}
      />
    </View>
  );
};

const BlockedUserRow = ({ user, onUnblock }: { user: any; onUnblock: () => void }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.userRow}>
      <Image 
        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name)}&background=random` }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.user_name}</Text>
        <Text style={styles.userEmail}>{user.user_email}</Text>
        {user.reason && (
          <Text style={styles.reason}>Reason: {user.reason}</Text>
        )}
        <Text style={styles.blockedDate}>
          Blocked {new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity style={styles.unblockBtn} onPress={onUnblock}>
        <UserMinus size={20} color="#00A699" weight="bold" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: { 
    paddingTop: '15%', 
    paddingHorizontal: 20, 
    paddingBottom: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: "20%", 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  backBtn: { 
    padding: 4 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#222' 
  },
  sep: { 
    height: 1, 
    backgroundColor: '#F0F0F0' 
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reason: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  blockedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  unblockBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#222',
    marginTop: 16,
  },
  emptySub: { 
    fontSize: 13, 
    color: '#6A6A6A', 
    marginTop: 6, 
    textAlign: 'center' 
  },
});

export default BlockedUsersScreen;
