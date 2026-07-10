import { useState, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { getStoredUserData } from '../services/notificationService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const useNotificationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const isGranted = status === 'granted';
      setPermissionGranted(isGranted);
      
      // Store permission status
      await AsyncStorage.setItem('notificationPermission', JSON.stringify({
        granted: isGranted,
        timestamp: new Date().toISOString(),
      }));

      // If permission is granted, register for push notifications
      if (isGranted) {
        await registerForPushNotifications();
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Request permission directly (no pre-alert)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const isGranted = finalStatus === 'granted';
      setPermissionGranted(isGranted);

      // Store permission status
      await AsyncStorage.setItem('notificationPermission', JSON.stringify({
        granted: isGranted,
        timestamp: new Date().toISOString(),
      }));

      if (isGranted) {
        await registerForPushNotifications();
      } else {
        // Only show settings prompt if user explicitly denied
        Alert.alert(
          t('notifications.permission.denied.title', 'Notifications Disabled'),
          t('notifications.permission.denied.message', 'To enable notifications, please go to Settings > Notifications and allow notifications for this app.'),
          [
            { text: t('common.cancel', 'Cancel'), style: 'cancel' },
            { text: t('notifications.permission.openSettings', 'Open Settings'), onPress: () => Linking.openSettings() },
          ]
        );
      }

      setIsLoading(false);
      return isGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setIsLoading(false);
      return false;
    }
  };

  const registerForPushNotifications = async () => {
    try {
      // CRITICAL: Check permission BEFORE attempting to get token
      // getExpoPushTokenAsync() can trigger permission request on iOS if status is undetermined
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('🔕 Permission not granted, skipping push token registration');
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token:', token.data);
      
      // Store token for backend
      await AsyncStorage.setItem('expoPushToken', token.data);
      
      // Register with backend (works for both authenticated and anonymous users)
      const userData = await getStoredUserData();
      if (userData) {
        // This will be handled by the location notifications system
        console.log('User data found, will register with backend when location is available');
      }
      
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  };

  const getStoredPermission = async () => {
    try {
      const stored = await AsyncStorage.getItem('notificationPermission');
      if (stored) {
        const data = JSON.parse(stored);
        return data.granted;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored permission:', error);
      return null;
    }
  };

  const getPushToken = async () => {
    try {
      return await AsyncStorage.getItem('expoPushToken');
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  };

  return {
    permissionGranted,
    isLoading,
    requestPermission,
    checkPermissionStatus,
    getStoredPermission,
    getPushToken,
  };
};
