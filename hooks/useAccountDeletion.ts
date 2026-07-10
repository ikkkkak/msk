import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useUser } from './useUser';
import { endpoints } from '../constants';

export const useAccountDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();
  const { user, logout } = useUser();

  const deleteAccount = async (): Promise<boolean> => {
    if (!user?.accessToken) {
      Alert.alert(
        t('settings.deleteAccountModal.title'),
        t('settings.deleteAccountModal.error'),
        [{ text: 'OK' }]
      );
      return false;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(endpoints.deleteAccount, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      if (data.success) {
        // Clear all local storage
        await AsyncStorage.multiRemove([
          'userData',
          'accessToken',
          'refreshToken',
          'expoPushToken',
          'notificationPermission',
          'locationCriteria',
          'lastNotificationSent',
        ]);

        // Logout user
        await logout();

        Alert.alert(
          t('settings.deleteAccountModal.title'),
          t('settings.deleteAccountModal.success'),
          [
            {
              text: 'OK',
              onPress: () => {
                // The app will automatically redirect to login screen
                // due to the logout action
              },
            },
          ]
        );

        return true;
      } else {
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      
      Alert.alert(
        t('settings.deleteAccountModal.title'),
        t('settings.deleteAccountModal.error'),
        [{ text: 'OK' }]
      );
      
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount,
    isDeleting,
  };
};
