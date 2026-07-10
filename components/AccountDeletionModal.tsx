import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface AccountDeletionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  const { t } = useTranslation();
  const [confirmationText, setConfirmationText] = useState('');
  
  const requiredText = t('settings.deleteAccountModal.placeholder');
  const isConfirmationValid = confirmationText === requiredText;

  const dataListItems = useMemo(() => {
    const raw = t('settings.deleteAccountModal.dataList', {
      returnObjects: true,
      defaultValue: [
        'Your profile and personal information',
        'All your listings and properties',
        'Messages and conversations',
        'Saved items and favorites',
      ],
    });
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [t]);

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      Alert.alert(
        t('settings.deleteAccountModal.title'),
        t('settings.deleteAccountModal.error'),
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await onConfirm();
    } catch (error) {
      console.error('Account deletion error:', error);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="warning" size={32} color="#DC2626" />
              </View>
              <Text style={styles.title}>{t('settings.deleteAccountModal.title')}</Text>
              <Text style={styles.subtitle}>{t('settings.deleteAccountModal.subtitle')}</Text>
            </View>

            {/* Warning Section */}
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>{t('settings.deleteAccountModal.warning')}</Text>
              <View style={styles.dataList}>
                {dataListItems.map((item, index) => (
                  <View key={index} style={styles.dataItem}>
                    <MaterialIcons name="remove" size={16} color="#DC2626" />
                    <Text style={styles.dataItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Confirmation Input */}
            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>
                {t('settings.deleteAccountModal.confirmationText')}
              </Text>
              <TextInput
                style={[
                  styles.confirmationInput,
                  confirmationText && !isConfirmationValid && styles.confirmationInputError,
                  confirmationText && isConfirmationValid && styles.confirmationInputValid,
                ]}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder={requiredText}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeleting}
              />
              {confirmationText && !isConfirmationValid && (
                <Text style={styles.errorText}>
                  {t('settings.deleteAccountModal.error')}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>
                  {t('settings.deleteAccountModal.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.deleteButton,
                  (!isConfirmationValid || isDeleting) && styles.deleteButtonDisabled,
                ]}
                onPress={handleDelete}
                disabled={!isConfirmationValid || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.deleteButtonText}>
                  {isDeleting 
                    ? t('settings.deleteAccountModal.deleting')
                    : t('settings.deleteAccountModal.delete')
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContainer: {
    maxHeight: '100%',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  warningSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  dataList: {
    gap: 8,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  confirmationSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  confirmationInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  confirmationInputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  deleteButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
