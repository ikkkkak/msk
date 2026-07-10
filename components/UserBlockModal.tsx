import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { X, UserMinus, Shield } from 'phosphor-react-native';
import { useBlockUserInGroup, useUnblockUserInGroup } from '../hooks/queries/useExperienceInvites';

interface UserBlockModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  userId: number;
  userName: string;
  isBlocked?: boolean;
  onSuccess?: () => void;
}

export const UserBlockModal: React.FC<UserBlockModalProps> = ({
  visible,
  onClose,
  groupId,
  userId,
  userName,
  isBlocked = false,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const blockUser = useBlockUserInGroup();
  const unblockUser = useUnblockUserInGroup();

  const handleBlock = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await blockUser.mutateAsync({
        groupId,
        userId,
        reason: reason.trim() || undefined,
      });
      
      Alert.alert(
        t('groups.block.success.title', 'User Blocked'),
        t('groups.block.success.message', 'You have blocked this user. They will not be able to see your messages in this group.'),
        [
          {
            text: t('common.ok', 'OK'),
            onPress: () => {
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        t('groups.block.error.title', 'Error'),
        error?.response?.data?.error || t('groups.block.error.message', 'Failed to block user. Please try again.'),
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnblock = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await unblockUser.mutateAsync({
        groupId,
        userId,
      });
      
      Alert.alert(
        t('groups.unblock.success.title', 'User Unblocked'),
        t('groups.unblock.success.message', 'You have unblocked this user. They can now see your messages in this group.'),
        [
          {
            text: t('common.ok', 'OK'),
            onPress: () => {
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        t('groups.unblock.error.title', 'Error'),
        error?.response?.data?.error || t('groups.unblock.error.message', 'Failed to unblock user. Please try again.'),
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isBlocked ? (
              <Shield size={24} color="#00A699" weight="fill" />
            ) : (
              <UserMinus size={24} color="#FF5A5F" weight="fill" />
            )}
            <Text style={styles.title}>
              {isBlocked 
                ? t('groups.unblock.title', 'Unblock User')
                : t('groups.block.title', 'Block User')
              }
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" weight="bold" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.description}>
            {isBlocked 
              ? t('groups.unblock.description', 'Are you sure you want to unblock this user? They will be able to see your messages in this group again.')
              : t('groups.block.description', 'Are you sure you want to block this user? They will not be able to see your messages in this group.')
            }
          </Text>

          {!isBlocked && (
            <>
              <Text style={styles.reasonLabel}>
                {t('groups.block.reasonLabel', 'Reason (optional)')}
              </Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder={t('groups.block.reasonPlaceholder', 'Why are you blocking this user?')}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                isBlocked ? styles.unblockButton : styles.blockButton,
                isProcessing && styles.disabledButton
              ]}
              onPress={isBlocked ? handleUnblock : handleBlock}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>
                {isProcessing 
                  ? (isBlocked 
                      ? t('groups.unblock.unblocking', 'Unblocking...') 
                      : t('groups.block.blocking', 'Blocking...')
                    )
                  : (isBlocked 
                      ? t('groups.unblock.confirm', 'Unblock User')
                      : t('groups.block.confirm', 'Block User')
                    )
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
    minHeight: 80,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  blockButton: {
    backgroundColor: '#FF5A5F',
  },
  unblockButton: {
    backgroundColor: '#00A699',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
