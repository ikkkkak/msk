import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useNotificationContext } from '../contexts/NotificationContext';
import { X, Bell, MapPin, Globe } from 'phosphor-react-native';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

export const NotificationPermissionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { requestPermission, markPermissionPromptShown } = useNotificationContext();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        navigation.goBack();
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

  const handleNotNow = async () => {
    // Mark prompt as shown even if user dismisses without granting
    await markPermissionPromptShown();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* Phone Mockup with Notification */}
        <View style={styles.phoneContainer}>
              {/* Phone Status Bar */}

              {/* Phone Content Area */}
                {/* Notification Preview */}
                <View style={styles.notificationPreview}>
                  <Image
                    source={require('../assets/noti.jpg')}
                    style={styles.notificationImage}
                    resizeMode="contain"
                  />
                </View>
        </View>

            {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Bell size={56} color={theme['color-temporary-primary']} weight="fill" />
          </View>

          <Text style={styles.title}>{t('notifications.permission.title')}</Text>
          <Text style={styles.subtitle}>{t('notifications.permission.subtitle')}</Text>

        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isRequesting && styles.buttonDisabled]}
            onPress={handleEnableNotifications}
            disabled={isRequesting}
          >
            <Text style={styles.primaryButtonText}>
              {isRequesting ? t('notifications.permission.enabling') : t('notifications.permission.enable')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button]}
            onPress={handleNotNow}
            disabled={isRequesting}
          >
            <Text style={styles.secondaryButtonText}>
              {t('notifications.permission.notNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    marginBottom: 20,
},
  scrollContent: {
    marginBottom: 100,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  phoneContainer: {
    alignItems: 'center',
    marginVertical: 24,
    marginTop: "30%",
    paddingHorizontal: 20,
  },
  phoneFrame: {
    width: width * 0.7,
    maxWidth: 280,
    aspectRatio: 0.5,
    backgroundColor: '#1C1C1E',
    borderRadius: 32,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#F8F8F8',
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalBars: {
    width: 18,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  battery: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 2,
    backgroundColor: '#34C759',
  },
  phoneContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationPreview: {
    width: 250,
    height: 250,
    overflow: 'hidden',
  },
  notificationImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  benefitsContainer: {
    marginBottom: 32,
    gap: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitText: {
    fontSize: 17,
    color: '#333',
    flex: 1,
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 12,
    paddingTop: 8,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: theme['color-temporary-primary'],
    shadowColor: theme['color-temporary-primary'],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5E5E7',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
});

