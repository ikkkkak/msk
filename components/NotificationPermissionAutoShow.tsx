import React, { useEffect, useRef } from 'react';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useNotificationContext } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global flag to ensure we only check once per app session
let hasCheckedThisSession = false;

// Reset function for testing (can be called from dev tools)
if (__DEV__) {
  (global as any).resetNotificationPermissionCheck = async () => {
    hasCheckedThisSession = false;
    await AsyncStorage.removeItem('hasShownNotificationPrompt');
    console.log('✅ Notification permission check reset - will show on next mount');
  };
  
  // Force show function for testing
  (global as any).forceShowNotificationPermission = (nav: any) => {
    if (nav && typeof nav.navigate === 'function') {
      nav.navigate('NotificationPermission');
      console.log('✅ Force navigated to NotificationPermission screen');
    }
  };
}

/**
 * Component that automatically shows NotificationPermissionScreen
 * when app mounts and conditions are met.
 * Controlled by app entry point to enable notification mechanism.
 * Shows in SearchScreen when app first mounts.
 */
export const NotificationPermissionAutoShow: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const hasNavigatedRef = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedRef = useRef(false);
  const mountedRef = useRef(true);
  
  const {
    isInitialized,
  } = useNotificationContext();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Use useFocusEffect to ensure it runs when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 NotificationPermissionAutoShow: Focus effect triggered', {
        isInitialized,
        hasChecked: hasCheckedRef.current,
        hasCheckedSession: hasCheckedThisSession,
        hasNavigated: hasNavigatedRef.current,
      });

      // Only check once per app session when SearchScreen is first focused
      if (hasCheckedRef.current || hasCheckedThisSession) {
        console.log('⏭️ NotificationPermissionAutoShow: Already checked, skipping');
        return;
      }

      // Wait for notification system to initialize
      if (!isInitialized) {
        console.log('⏳ NotificationPermissionAutoShow: Waiting for initialization...');
        // Set up a retry mechanism
        const retryTimer = setTimeout(() => {
          if (isInitialized && !hasCheckedRef.current && !hasCheckedThisSession) {
            // Reset flags to allow check
            hasCheckedRef.current = false;
            hasCheckedThisSession = false;
          }
        }, 2000);
        return () => clearTimeout(retryTimer);
      }

      // Mark as checked to prevent multiple checks
      hasCheckedRef.current = true;
      hasCheckedThisSession = true;

      console.log('✅ NotificationPermissionAutoShow: Starting check process...');

      // Delay to ensure app is fully mounted and search screen is visible
      checkTimeoutRef.current = setTimeout(async () => {
        if (!mountedRef.current) {
          console.log('⏭️ NotificationPermissionAutoShow: Component unmounted, skipping');
          return;
        }

        try {
          // Check permission status directly
          const { status } = await Notifications.getPermissionsAsync();
          const isGranted = status === 'granted';
          
          console.log('🔍 NotificationPermissionAutoShow: Checking conditions on app mount:', {
            status,
            isGranted,
            hasNavigated: hasNavigatedRef.current,
          });

          // Show NotificationPermissionScreen if:
          // 1. Permission is NOT granted
          // 2. We haven't navigated yet
          // Ask again every app session until notifications are enabled.
          const shouldShow = !isGranted && !hasNavigatedRef.current;
          
          // In development mode, be more aggressive - show if permission is not granted
          // (this allows testing even if the flag was set before)
          const shouldShowForTesting = __DEV__ && !isGranted && !hasNavigatedRef.current;
          
          // Force show in dev mode for first-time testing (comment out in production)
          const forceShowInDev = __DEV__ && false; // Set to true to force show for testing
          
          if (shouldShow || shouldShowForTesting || forceShowInDev) {
            console.log('✅ NotificationPermissionAutoShow: Conditions met, showing screen on app mount...', {
              shouldShow,
              shouldShowForTesting,
              isGranted,
            });
            hasNavigatedRef.current = true;
            
            // Small delay to ensure smooth transition
            setTimeout(() => {
              if (!mountedRef.current) {
                console.log('⏭️ NotificationPermissionAutoShow: Component unmounted before navigation');
                return;
              }
              try {
                console.log('🚀 NotificationPermissionAutoShow: Attempting navigation to NotificationPermission...');
                const nav = navigation as any;
                if (nav && typeof nav.navigate === 'function') {
                  nav.navigate('NotificationPermission');
                  console.log('✅ NotificationPermissionAutoShow: Successfully navigated to NotificationPermission screen');
                } else {
                  console.error('❌ NotificationPermissionAutoShow: Navigation object invalid:', {
                    hasNav: !!nav,
                    hasNavigate: !!(nav && typeof nav.navigate === 'function'),
                  });
                  hasNavigatedRef.current = false; // Allow retry
                }
              } catch (error) {
                console.error('❌ NotificationPermissionAutoShow: Navigation failed:', error);
                hasNavigatedRef.current = false; // Allow retry
              }
            }, 800); // Slightly longer delay for better UX
          } else {
            console.log('⏭️ NotificationPermissionAutoShow: Conditions not met, skipping:', {
              isGranted,
              hasNavigated: hasNavigatedRef.current,
              reason: isGranted ? 'Permission already granted' : hasNavigatedRef.current ? 'Already navigated' : 'Unknown'
            });
          }
        } catch (error) {
          console.error('❌ NotificationPermissionAutoShow: Error checking conditions:', error);
        }
      }, 2500); // 2.5 second delay after screen is focused to ensure smooth UX

      return () => {
        if (checkTimeoutRef.current) {
          clearTimeout(checkTimeoutRef.current);
        }
      };
    }, [isInitialized, navigation])
  );

  // This component doesn't render anything - it just handles navigation logic
  return null;
};

