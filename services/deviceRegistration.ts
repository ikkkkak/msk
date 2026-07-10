import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { endpoints } from '../constants';

const DEVICE_REGISTRATION_KEY = '@device_registration';
const DEVICE_ID_KEY = '@device_id';

/**
 * Get or create a stable device identifier
 * Uses SecureStore for secure storage, falls back to AsyncStorage
 * This ID must be consistent across app restarts
 */
async function getDeviceId(): Promise<string> {
  // First, try to get existing device ID from SecureStore
  try {
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }
  } catch (error) {
    // SecureStore failed, try AsyncStorage
  }

  // Try AsyncStorage as backup
  try {
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      // Found in AsyncStorage, also store in SecureStore for future use
      try {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, storedId);
      } catch (error) {
        // Ignore SecureStore error
      }
      return storedId;
    }
  } catch (error) {
    // AsyncStorage also failed, continue to generate new ID
  }

  // No existing ID found, generate a new stable one
  let deviceId: string;
  
  try {
    // Try to use platform-specific stable identifiers first
    if (Platform.OS === 'android' && Application.androidId) {
      // Android: Use androidId (most stable)
      deviceId = Application.androidId;
    } else {
      // iOS or fallback: Generate a persistent UUID-like identifier
      // This will be stored and reused forever for this device
      deviceId = await generateAndStoreStableId();
    }
    
    // Store in both SecureStore and AsyncStorage for redundancy
    try {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    } catch (error) {
      // If SecureStore fails, AsyncStorage will be used
    }
    try {
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (error) {
      // If both fail, we still have the ID to return
    }
    
    return deviceId;
  } catch (error) {
    console.warn('⚠️ Failed to generate device ID:', error);
    // Last resort: generate a simple ID (should rarely happen)
    const fallbackId = `${Platform.OS}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    // Try to store it in AsyncStorage at least
    try {
      await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
    } catch (e) {
      // Ignore
    }
    return fallbackId;
  }
}

/**
 * Generate and store a stable ID that persists across app restarts
 */
async function generateAndStoreStableId(): Promise<string> {
  const STABLE_ID_KEY = '@device_stable_id';
  
  // Try to get existing stable ID
  try {
    let stableId = await SecureStore.getItemAsync(STABLE_ID_KEY);
    if (stableId) {
      return stableId;
    }
    stableId = await AsyncStorage.getItem(STABLE_ID_KEY);
    if (stableId) {
      // Found in AsyncStorage, also store in SecureStore
      try {
        await SecureStore.setItemAsync(STABLE_ID_KEY, stableId);
      } catch (error) {
        // Ignore
      }
      return stableId;
    }
  } catch (error) {
    // Continue to generate new one
  }
  
  // Generate a new stable ID (UUID-like format but without dashes)
  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  const stableId = `${Platform.OS}_${timestamp}_${randomPart1}${randomPart2}`;
  
  // Store in both places
  try {
    await SecureStore.setItemAsync(STABLE_ID_KEY, stableId);
  } catch (error) {
    // Ignore
  }
  try {
    await AsyncStorage.setItem(STABLE_ID_KEY, stableId);
  } catch (error) {
    // Ignore
  }
  
  return stableId;
}

/**
 * Collect device information silently
 */
async function collectDeviceInfo(): Promise<{
  deviceId: string;
  deviceModel: string;
  deviceType: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  userId?: number;
}> {
  const deviceId = await getDeviceId();
  
  // Get device model
  const deviceModel = Device.modelName || Device.deviceName || 'Unknown';
  
  // Determine device type
  let deviceType = 'phone';
  if (Device.deviceType === Device.DeviceType.TABLET) {
    deviceType = 'tablet';
  } else if (Device.deviceType === Device.DeviceType.DESKTOP) {
    deviceType = 'desktop';
  } else if (Device.deviceType === Device.DeviceType.TV) {
    deviceType = 'tv';
  }
  
  // Get platform
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  
  // Get OS version
  const osVersion = Device.osVersion || 'Unknown';
  
  // Get app version
  const appVersion = Application.nativeApplicationVersion || Application.nativeBuildVersion || 'Unknown';
  
  // Get user ID if available (optional)
  let userId: number | undefined;
  try {
    const userStr = await SecureStore.getItemAsync('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userId = user.ID;
    }
  } catch (error) {
    // User not logged in or error reading user - that's fine
  }
  
  return {
    deviceId,
    deviceModel,
    deviceType,
    platform,
    osVersion,
    appVersion,
    userId,
  };
}

/**
 * Register device silently in the background
 * This function is designed to be non-blocking and fail silently
 * It will update existing device registration if device already exists (same device ID)
 */
export async function registerDeviceSilently(): Promise<void> {
  try {
    // Check if we've already registered recently (within last 24 hours)
    // This prevents excessive API calls, but the backend will still update if called
    const lastRegistration = await AsyncStorage.getItem(DEVICE_REGISTRATION_KEY);
    if (lastRegistration) {
      const lastRegTime = parseInt(lastRegistration, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // If registered within last 24 hours, skip (backend will update existing record anyway)
      if (now - lastRegTime < twentyFourHours) {
        if (__DEV__) {
          console.log('📱 Device registration skipped (registered within 24h)');
        }
        return;
      }
    }
    
    // Collect device information (this includes stable device ID)
    const deviceInfo = await collectDeviceInfo();
    
    // Register device with server (non-blocking, fire and forget)
    // Backend will update existing device if device ID matches, or create new one if it doesn't
    axios.post(`${endpoints.baseURL}/device/register`, deviceInfo, {
      timeout: 5000, // 5 second timeout
    }).then(() => {
      // Success - store registration timestamp
      AsyncStorage.setItem(DEVICE_REGISTRATION_KEY, Date.now().toString()).catch(() => {});
      if (__DEV__) {
        console.log('✅ Device registered/updated successfully');
      }
    }).catch((error) => {
      // Fail silently - don't log errors to avoid noise
      // Only log in development
      if (__DEV__) {
        console.log('📱 Device registration failed (silent):', error.message);
      }
    });
    
  } catch (error) {
    // Fail completely silently - this is background registration
    // Only log in development
    if (__DEV__) {
      console.log('📱 Device registration error (silent):', error);
    }
  }
}

/**
 * Update device registration when user logs in
 * This ensures we associate the device with the user
 */
export async function updateDeviceRegistrationOnLogin(userId: number): Promise<void> {
  try {
    const deviceInfo = await collectDeviceInfo();
    
    // Update registration with user ID
    axios.post(`${endpoints.baseURL}/device/register`, {
      ...deviceInfo,
      userId,
    }, {
      timeout: 5000,
    }).catch(() => {
      // Fail silently
    });
  } catch (error) {
    // Fail silently
  }
}

/**
 * Start a device session (when app is opened)
 * This tracks when the user opens the app
 */
export async function startDeviceSession(): Promise<number | null> {
  try {
    const deviceId = await getDeviceId();
    
    // Get user ID if available
    let userId: number | undefined;
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.ID;
      }
    } catch (error) {
      // User not logged in - that's fine
    }

    // Get app version
    const appVersion = Application.nativeApplicationVersion || Application.nativeBuildVersion || 'Unknown';
    
    const response = await axios.post(`${endpoints.baseURL}/device/session/start`, {
      deviceId,
      userId,
      appVersion,
    }, {
      timeout: 5000,
    }).catch(() => null);

    if (response?.data?.sessionId) {
      // Store session ID locally for later use
      await SecureStore.setItemAsync('@current_session_id', response.data.sessionId.toString()).catch(() => {});
      return response.data.sessionId;
    }
    
    return null;
  } catch (error) {
    // Fail silently
    return null;
  }
}

/**
 * End a device session (when app is closed/backgrounded)
 * This tracks when the user closes the app and calculates usage duration
 */
export async function endDeviceSession(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    
    // Get session ID if available
    let sessionId: number | undefined;
    try {
      const sessionIdStr = await SecureStore.getItemAsync('@current_session_id');
      if (sessionIdStr) {
        sessionId = parseInt(sessionIdStr, 10);
      }
    } catch (error) {
      // No session ID stored - that's fine
    }

    // Get user ID if available
    let userId: number | undefined;
    try {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.ID;
      }
    } catch (error) {
      // User not logged in - that's fine
    }
    
    // End the session
    await axios.post(`${endpoints.baseURL}/device/session/end`, {
      deviceId,
      sessionId,
      userId,
    }, {
      timeout: 3000, // Shorter timeout since app might be closing
    }).catch(() => {
      // Fail silently - app might be closing
    });

    // Clear stored session ID
    await SecureStore.deleteItemAsync('@current_session_id').catch(() => {});
  } catch (error) {
    // Fail completely silently - app might be closing
  }
}

