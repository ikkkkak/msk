import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { 
  registerNotificationPreferences, 
  sendLocationNotification, 
  getStoredUserData,
  storeNotificationPreferences,
  getNotificationPreferences
} from '../services/notificationService';

interface LocationCriteria {
  city?: string;
  district?: string;
  region?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const useLocationNotifications = () => {
  const [locationCriteria, setLocationCriteria] = useState<LocationCriteria | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const appState = useRef(AppState.currentState);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStartTime = useRef<number>(Date.now()); // Track when app started
  const { t, i18n } = useTranslation();

  useEffect(() => {
    initializeLocationNotifications();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const initializeLocationNotifications = async () => {
    try {
      // Check if notifications are enabled
      const notificationPermission = await AsyncStorage.getItem('notificationPermission');
      if (!notificationPermission) return;

      const { granted } = JSON.parse(notificationPermission);
      if (!granted) return;

      // Get user's current location
      const location = await getCurrentLocation();
      if (!location) return;

      // Store location criteria
      const criteria: LocationCriteria = {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        city: location.city || 'Unknown',
        district: location.district,
        region: location.region,
      };

      setLocationCriteria(criteria);
      await storeLocationCriteria(criteria);
      setIsLocationEnabled(true);

      // Don't schedule initial notification - only send when app goes to background
      console.log('✅ Location notifications initialized - will only send when app goes to background');
    } catch (error) {
      console.error('Error initializing location notifications:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
        maximumAge: 300000, // 5 minutes
      });

      // Reverse geocode to get city/district info with timeout
      const reverseGeocode = await Promise.race([
        Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reverse geocode timeout')), 5000)
        )
      ]).catch(error => {
        console.warn('Reverse geocode failed:', error);
        return [{ city: 'Unknown', subregion: 'Unknown' }];
      });

      const address = reverseGeocode[0];
      return {
        coords: location.coords,
        city: address?.city || address?.subregion || 'Unknown',
        district: address?.district,
        region: address?.region,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const storeLocationCriteria = async (criteria: LocationCriteria) => {
    try {
      await AsyncStorage.setItem('locationCriteria', JSON.stringify({
        ...criteria,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error storing location criteria:', error);
    }
  };

  const scheduleLocationNotification = async (criteria: LocationCriteria) => {
    try {
      console.log('🔔 Scheduling location notification with criteria:', criteria);
      
      // Send location data to server for background notifications
      const userData = await getStoredUserData();
      console.log('👤 User data:', userData);
      
      if (userData) {
        const locationText = criteria.city || criteria.district || criteria.region || 'Unknown';
        console.log('📍 Location text:', locationText);
        
        // Send to server to schedule background notifications
        const success = await sendLocationNotification({
          user_id: userData.user_id, // Can be null for anonymous users
          language: userData.language,
          location: locationText,
          coordinates: criteria.coordinates,
        });

        console.log('📤 Server notification result:', success);
        if (!success) {
          console.log('❌ Server notification failed - this is expected if server is not updated yet');
        } else {
          console.log('✅ Server notification sent successfully');
        }
      } else {
        console.log('❌ No user data available for notification');
      }

    } catch (error) {
      console.error('❌ Error scheduling location notification:', error);
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App has gone to the background - this is when we send notifications
      console.log('📱 App has gone to the background - checking if notifications should be sent');
      
      // Only send notifications when app goes to background AND user has been active for a while
      if (locationCriteria && isLocationEnabled) {
        const now = Date.now();
        const sessionDuration = now - appStartTime.current;
        const minimumSessionTime = 5 * 60 * 1000; // 5 minutes minimum session time
        
        // Don't send notifications if user just opened and closed the app quickly
        if (sessionDuration < minimumSessionTime) {
          console.log('⏰ Session too short:', Math.round(sessionDuration / 1000), 'seconds - skipping notifications');
          appState.current = nextAppState;
          return;
        }
        
        // Check if we should send notifications (rate limiting on client side too)
        const lastNotificationTime = await AsyncStorage.getItem('lastNotificationSent');
        
        if (lastNotificationTime) {
          const timeSinceLastNotification = now - parseInt(lastNotificationTime);
          const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
          
          if (timeSinceLastNotification < twoHoursInMs) {
            console.log('⏰ Client-side rate limiting: Notifications sent too recently, skipping');
            appState.current = nextAppState;
            return;
          }
        }
        
        console.log('✅ Sending notifications to server (app in background)');
        await scheduleLocationNotification(locationCriteria);
        
        // Store the time when we sent notifications
        await AsyncStorage.setItem('lastNotificationSent', now.toString());
      }
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground - reset session timer for new session
      console.log('📱 App has come to the foreground - resetting session timer');
      appStartTime.current = Date.now(); // Reset session timer
    }

    appState.current = nextAppState;
  };

  const updateLocationCriteria = async (newCriteria: Partial<LocationCriteria>) => {
    try {
      const updatedCriteria = { ...locationCriteria, ...newCriteria };
      setLocationCriteria(updatedCriteria);
      await storeLocationCriteria(updatedCriteria);
      
      // Don't reschedule notifications immediately - only when app goes to background
      // The new criteria will be used when the app goes to background
    } catch (error) {
      console.error('Error updating location criteria:', error);
    }
  };

  const enableLocationNotifications = async () => {
    try {
      // Check if user already has notification preferences
      const existingPreferences = await getNotificationPreferences();
      if (existingPreferences && existingPreferences.enabled) {
        console.log('✅ User already has notification preferences - skipping registration');
        // Load existing criteria
        const storedCriteria = await getStoredLocationCriteria();
        if (storedCriteria) {
          setLocationCriteria(storedCriteria);
          setIsLocationEnabled(true);
          return true;
        }
      }

      const location = await getCurrentLocation();
      if (!location) return false;

      const criteria: LocationCriteria = {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        city: location.city || 'Unknown',
        district: location.district,
        region: location.region,
      };

      setLocationCriteria(criteria);
      await storeLocationCriteria(criteria);
      setIsLocationEnabled(true);

      // Store preferences locally (works without server)
      const userData = await getStoredUserData();
      console.log('👤 User data for registration:', userData);
      
      if (userData) {
        const locationText = criteria.city || criteria.district || criteria.region || 'Unknown';
        console.log('📍 Location for registration:', locationText);
        
        // Store preferences locally (always works)
        await storeNotificationPreferences({
          enabled: true,
          location: locationText,
          coordinates: criteria.coordinates,
          language: userData.language,
        });
        
        console.log('✅ Local notification preferences stored');

        // Try server registration (REQUIRED for notifications to work)
        const pushToken = await AsyncStorage.getItem('expoPushToken');
        if (pushToken) {
          console.log('📱 Push token found, registering with server...');
          console.log('📱 Push token (first 20 chars):', pushToken.substring(0, 20) + '...');
          
          // Get device ID for anonymous user tracking
          const deviceId = await getOrCreateDeviceId();
          
          const registrationSuccess = await registerNotificationPreferences({
            user_id: userData.user_id, // Can be null for anonymous users
            device_id: deviceId || undefined, // Include device ID for anonymous tracking
            push_token: pushToken,
            language: userData.language,
            location: locationText,
            coordinates: criteria.coordinates,
          });

          console.log('📝 Server registration result:', registrationSuccess);
          if (!registrationSuccess) {
            console.log('❌ Server registration failed - notifications will not work!');
            return false; // Don't enable notifications if registration fails
          } else {
            console.log('✅ Server registration successful - notifications will work');
          }
        } else {
          console.log('❌ No push token found - notifications will not work!');
          return false; // Don't enable notifications without push token
        }
      } else {
        console.log('❌ No user data available for registration');
      }

      // Don't schedule notifications immediately - only when app goes to background
      return true;
    } catch (error) {
      console.error('Error enabling location notifications:', error);
      return false;
    }
  };

  const disableLocationNotifications = async () => {
    try {
      setLocationCriteria(null);
      setIsLocationEnabled(false);
      await AsyncStorage.removeItem('locationCriteria');
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error disabling location notifications:', error);
    }
  };

  const getStoredLocationCriteria = async (): Promise<LocationCriteria | null> => {
    try {
      const stored = await AsyncStorage.getItem('locationCriteria');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored location criteria:', error);
      return null;
    }
  };

  return {
    locationCriteria,
    isLocationEnabled,
    updateLocationCriteria,
    enableLocationNotifications,
    disableLocationNotifications,
    getStoredLocationCriteria,
    scheduleLocationNotification,
  };
};
