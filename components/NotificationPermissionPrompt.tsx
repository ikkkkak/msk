import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNotificationContext } from '../contexts/NotificationContext';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

interface NotificationPermissionPromptProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { requestPermission, isPermissionLoading } = useNotificationContext();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      onClose();
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
        <View style={styles.container}>
          {/* Header with icon */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons 
                name="notifications-active" 
                size={48} 
                color={theme['color-temporary-primary']} 
              />
            </View>
            <Text style={styles.title}>
              {t('notifications.permission.title', 'Stay Updated!')}
            </Text>
            <Text style={styles.subtitle}>
              {t('notifications.permission.subtitle', 'Get notified about new properties in your area')}
            </Text>
          </View>

          {/* Benefits list */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <MaterialIcons name="location-on" size={20} color={theme['color-temporary-primary']} />
              <Text style={styles.benefitText}>
                {t('notifications.benefits.location', 'Discover properties near you')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="trending-up" size={20} color={theme['color-temporary-primary']} />
              <Text style={styles.benefitText}>
                {t('notifications.benefits.updates', 'Get instant updates on new listings')}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="schedule" size={20} color={theme['color-temporary-primary']} />
              <Text style={styles.benefitText}>
                {t('notifications.benefits.timing', 'Never miss a great opportunity')}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.enableButton]}
              onPress={handleEnableNotifications}
              disabled={isPermissionLoading}
            >
              <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
              <Text style={styles.enableButtonText}>
                {isPermissionLoading 
                  ? t('notifications.permission.enabling', 'Enabling...')
                  : t('notifications.permission.enable', 'Enable Notifications')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.notNowButton]}
              onPress={handleNotNow}
              disabled={isPermissionLoading}
            >
              <Text style={styles.notNowButtonText}>
                {t('notifications.permission.notNow', 'Not Now')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy note */}
          <Text style={styles.privacyNote}>
            {t('notifications.privacy.note', 'We respect your privacy. You can change this setting anytime in your device settings.')}
          </Text>
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
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
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
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  enableButton: {
    backgroundColor: theme['color-temporary-primary'],
    shadowColor: theme['color-temporary-primary'],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notNowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notNowButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  privacyNote: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
