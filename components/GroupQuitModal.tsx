import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { X, WarningCircle } from 'phosphor-react-native';
import { useQuitGroup } from '../hooks/queries/useExperienceInvites';

interface GroupQuitModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  onSuccess?: () => void;
}

export const GroupQuitModal: React.FC<GroupQuitModalProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isQuitting, setIsQuitting] = useState(false);
  const quitGroup = useQuitGroup();

  const handleQuit = async () => {
    if (isQuitting) return;
    
    setIsQuitting(true);
    try {
      await quitGroup.mutateAsync({
        groupId,
        reason: reason.trim() || undefined,
      });
      
      Alert.alert(
        t('groups.quit.success.title', 'Group Left'),
        t('groups.quit.success.message', 'You have successfully left the group.'),
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
      console.error(
        t('groups.quit.error.title', 'Error'),
        error?.response?.data?.error || t('groups.quit.error.message', 'Failed to leave the group. Please try again.'),
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setIsQuitting(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <WarningCircle size={24} color="#FF5A5F" weight="fill" />
            <Text style={styles.title}>{t('groups.quit.title', 'Leave Group')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" weight="bold" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.description}>
            {t('groups.quit.description', 'Are you sure you want to leave this group? You will no longer receive messages or updates from this group.')}
          </Text>

          <Text style={styles.reasonLabel}>
            {t('groups.quit.reasonLabel', 'Reason (optional)')}
          </Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder={t('groups.quit.reasonPlaceholder', 'Why are you leaving?')}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isQuitting}
            >
              <Text style={styles.cancelButtonText}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.quitButton, isQuitting && styles.disabledButton]}
              onPress={handleQuit}
              disabled={isQuitting}
            >
              <Text style={styles.quitButtonText}>
                {isQuitting 
                  ? t('groups.quit.quitting', 'Leaving...') 
                  : t('groups.quit.confirm', 'Leave Group')
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
  groupName: {
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
  quitButton: {
    backgroundColor: '#FF5A5F',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  quitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
