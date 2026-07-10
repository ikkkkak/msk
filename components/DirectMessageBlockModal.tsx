import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { X, UserMinus, Shield } from 'phosphor-react-native';
import { useBlockUser, useUnblockUser } from '../hooks/queries/useExperienceInvites';

interface DirectMessageBlockModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userEmail?: string;
  isBlocked?: boolean;
  onSuccess?: () => void;
}

export const DirectMessageBlockModal: React.FC<DirectMessageBlockModalProps> = ({
  visible,
  onClose,
  userId,
  userName,
  userEmail,
  isBlocked = false,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const handleBlock = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await blockUser.mutateAsync({
        userId,
        reason: reason.trim() || undefined,
      });
      
      Alert.alert(
        t('messages.block.success.title', 'User Blocked'),
        t('messages.block.success.message', 'You have blocked this user. They will not be able to send you direct messages.'),
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
        t('messages.block.error.title', 'Error'),
        error?.response?.data?.error || t('messages.block.error.message', 'Failed to block user. Please try again.'),
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
      await unblockUser.mutateAsync(userId);
      
      Alert.alert(
        t('messages.unblock.success.title', 'User Unblocked'),
        t('messages.unblock.success.message', 'You have unblocked this user. They can now send you direct messages again.'),
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
        t('messages.unblock.error.title', 'Error'),
        error?.response?.data?.error || t('messages.unblock.error.message', 'Failed to unblock user. Please try again.'),
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
                ? t('messages.unblock.title', 'Unblock User')
                : t('messages.block.title', 'Block User')
              }
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" weight="bold" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.userName}>{userName}</Text>
          {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
          <Text style={styles.description}>
            {isBlocked 
              ? t('messages.unblock.description', 'Are you sure you want to unblock this user? They will be able to send you direct messages again.')
              : t('messages.block.description', 'Are you sure you want to block this user? They will not be able to send you direct messages.')
            }
          </Text>

          {!isBlocked && (
            <>
              <Text style={styles.reasonLabel}>
                {t('messages.block.reasonLabel', 'Reason (optional)')}
              </Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder={t('messages.block.reasonPlaceholder', 'Why are you blocking this user?')}
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
                      ? t('messages.unblock.unblocking', 'Unblocking...') 
                      : t('messages.block.blocking', 'Blocking...')
                    )
                  : (isBlocked 
                      ? t('messages.unblock.confirm', 'Unblock User')
                      : t('messages.block.confirm', 'Block User')
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
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
