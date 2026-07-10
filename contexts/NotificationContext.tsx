import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';

import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { useLocationNotifications } from '../hooks/useLocationNotifications';
import { obtainPushToken } from '../utils/pushToken';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { registerMarketingDevice } from '../services/marketingNotifications';

interface NotificationContextType {
  // Permission state
  permissionGranted: boolean | null;
  isPermissionLoading: boolean;
  requestPermission: () => Promise<boolean>;
  
  // Location notifications
  locationCriteria: any;
  isLocationEnabled: boolean;
  enableLocationNotifications: () => Promise<boolean>;
  disableLocationNotifications: () => Promise<void>;
  updateLocationCriteria: (criteria: any) => Promise<void>;
  
  // App state
  isInitialized: boolean;
  hasShownPermissionPrompt: boolean;
  markPermissionPromptShown: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasShownPermissionPrompt, setHasShownPermissionPrompt] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const {
    permissionGranted,
    isLoading: isPermissionLoading,
    requestPermission,
    checkPermissionStatus,
  } = useNotificationPermission();
  
  const {
    locationCriteria,
    isLocationEnabled,
    enableLocationNotifications,
    disableLocationNotifications,
    updateLocationCriteria,
    getStoredLocationCriteria,
  } = useLocationNotifications();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeNotificationSystem();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  const registerMarketingDeviceIfPossible = async () => {
    try {
      const result = await obtainPushToken();
      if (!result?.token) {
        console.log('⚠️ No push token available for marketing registration');
        return;
      }

      const deviceId = await getOrCreateDeviceId();
      const locale = Localization.getLocales?.()[0]?.languageTag ?? Localization.locale;
      const timezone = Localization.getCalendars?.()[0]?.timeZone ?? Localization.timezone;
      const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'unknown';
      const sdkVersion = Constants.expoConfig?.sdkVersion ?? Constants.nativeBuildVersion ?? undefined;

      await registerMarketingDevice(result.token, {
        deviceId,
        locale,
        timezone,
        platform: Platform.OS,
        appVersion,
        sdkVersion,
        marketingOptIn: true,
      });

      console.log('✅ Marketing device registration successful');
    } catch (error) {
      console.warn('⚠️ Failed to register marketing device token', error);
    }
  };

  const initializeNotificationSystem = async () => {
    // Prevent multiple initializations
    if (isInitializing || isInitialized) {
      console.log('⚠️ Notification system already initializing or initialized');
      return;
    }
    
    setIsInitializing(true);
    try {
      console.log('🚀 Initializing notification system...');

      // Check if we've shown the permission prompt before
      const hasShown = await AsyncStorage.getItem('hasShownNotificationPrompt');
      setHasShownPermissionPrompt(hasShown === 'true');

      // Silently check permission status (don't request automatically)
      await Promise.race([
        checkPermissionStatus(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Permission check timeout')), 5000))
      ]).catch(error => {
        console.warn('Permission check failed or timed out:', error);
      });
      
      // If permission is already granted, register for marketing notifications
      if (permissionGranted) {
        await registerMarketingDeviceIfPossible();
      }

      setIsInitialized(true);
      console.log('✅ Notification system initialized');
    } catch (error) {
      console.error('❌ Error initializing notification system:', error);
      // Always set initialized to true to prevent blocking
      setIsInitialized(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const markPermissionPromptShown = async () => {
    try {
      await AsyncStorage.setItem('hasShownNotificationPrompt', 'true');
      setHasShownPermissionPrompt(true);
    } catch (error) {
      console.error('Error marking permission prompt as shown:', error);
    }
  };

  const handleRequestPermission = async (): Promise<boolean> => {
    const granted = await requestPermission();
    
    if (granted) {
      await registerMarketingDeviceIfPossible();
      await markPermissionPromptShown();
    }
    
    return granted;
  };

  const value: NotificationContextType = {
    // Permission state
    permissionGranted,
    isPermissionLoading,
    requestPermission: handleRequestPermission,
    
    // Location notifications
    locationCriteria,
    isLocationEnabled,
    enableLocationNotifications,
    disableLocationNotifications,
    updateLocationCriteria,
    
    // App state
    isInitialized,
    hasShownPermissionPrompt,
    markPermissionPromptShown,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
