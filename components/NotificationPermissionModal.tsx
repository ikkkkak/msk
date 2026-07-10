import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNotificationContext } from '../contexts/NotificationContext';
import { X, Bell, MapPin, Globe } from 'phosphor-react-native';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { requestPermission } = useNotificationContext();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        onClose();
        // Show success message
        Alert.alert(
          t('notifications.permission.success.title'),
          t('notifications.permission.success.message'),
          [{ text: t('common.ok') }]
        );
      } else {
        // Show settings prompt
        Alert.alert(
          t('notifications.permission.denied.title'),
          t('notifications.permission.denied.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('notifications.permission.denied.openSettings'), 
              onPress: () => Linking.openSettings() 
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert(
        t('notifications.permission.error.title'),
        t('notifications.permission.error.message'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNotNow = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Bell size={48} color="#007AFF" weight="fill" />
          </View>

          <Text style={styles.title}>{t('notifications.permission.title')}</Text>
          <Text style={styles.subtitle}>{t('notifications.permission.subtitle')}</Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <MapPin size={20} color="#007AFF" weight="fill" />
              <Text style={styles.benefitText}>
                {t('notifications.permission.benefits.location')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Globe size={20} color="#007AFF" weight="fill" />
              <Text style={styles.benefitText}>
                {t('notifications.permission.benefits.discovery')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Bell size={20} color="#007AFF" weight="fill" />
              <Text style={styles.benefitText}>
                {t('notifications.permission.benefits.updates')}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleEnableNotifications}
              disabled={isRequesting}
            >
              <Text style={styles.primaryButtonText}>
                {isRequesting ? t('notifications.permission.enabling') : t('notifications.permission.enable')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleNotNow}
              disabled={isRequesting}
            >
              <Text style={styles.secondaryButtonText}>
                {t('notifications.permission.notNow')}
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
