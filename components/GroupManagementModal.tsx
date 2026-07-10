import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, UserMinus, Shield } from 'phosphor-react-native';

interface GroupManagementModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  onQuitGroup: (reason?: string) => void;
  onBlockUser: (userId: number, reason?: string) => void;
  onUnblockUser: (userId: number) => void;
  blockedUsers: any[];
  isLoading?: boolean;
}

export default function GroupManagementModal({
  visible,
  onClose,
  groupId,
  onQuitGroup,
  onBlockUser,
  onUnblockUser,
  blockedUsers,
  isLoading = false,
}: GroupManagementModalProps) {
  const { t } = useTranslation();
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const handleQuitGroup = () => {
    onQuitGroup(reason);
    setReason('');
    setShowQuitModal(false);
  };

  const handleBlockUser = (userId: number) => {
    setSelectedUserId(userId);
    setShowBlockModal(true);
  };

  const handleUnblockUser = (userId: number) => {
    Alert.alert(
      t('groups.unblock.title'),
      t('groups.unblock.description'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('groups.unblock.confirm'),
          onPress: () => {
            onUnblockUser(userId);
            setShowBlockModal(false);
          },
        },
      ]
    );
  };

  const confirmBlockUser = () => {
    if (selectedUserId) {
      onBlockUser(selectedUserId, reason);
      setReason('');
      setShowBlockModal(false);
      setSelectedUserId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('groups.management.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Quit Group Section */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowQuitModal(true)}
          >
            <UserMinus size={24} color="#FF4444" />
            <Text style={[styles.actionText, { color: '#FF4444' }]}>
              {t('groups.quit.title')}
            </Text>
          </TouchableOpacity>

          {/* Blocked Users Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('groups.blockedUsers.title')}
            </Text>
            {blockedUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {t('groups.blockedUsers.emptyTitle')}
              </Text>
            ) : (
              blockedUsers.map((user) => (
                <View key={user.id} style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.user_name}</Text>
                    {user.reason && (
                      <Text style={styles.reason}>{user.reason}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={() => handleUnblockUser(user.blocked_id)}
                  >
                    <Text style={styles.unblockText}>
                      {t('groups.unblock.title')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quit Group Modal */}
        <Modal visible={showQuitModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('groups.quit.title')}</Text>
              <Text style={styles.modalDescription}>
                {t('groups.quit.description')}
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder={t('groups.quit.reasonPlaceholder')}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowQuitModal(false)}
                >
                  <Text style={styles.cancelButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleQuitGroup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {t('groups.quit.confirm')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Block User Modal */}
        <Modal visible={showBlockModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('groups.block.title')}</Text>
              <Text style={styles.modalDescription}>
                {t('groups.block.description')}
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder={t('groups.block.reasonPlaceholder')}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowBlockModal(false)}
                >
                  <Text style={styles.cancelButtonText}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmBlockUser}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {t('groups.block.confirm')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reason: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  unblockButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  unblockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#FF4444',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
