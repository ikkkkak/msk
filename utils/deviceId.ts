import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const STORAGE_KEY = 'marketingDeviceId';

const generateFallbackId = () => {
  const randomSegment = () => Math.random().toString(36).slice(2, 10);
  return `anon-${Date.now()}-${randomSegment()}-${randomSegment()}`;
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached && cached.length > 0) {
      return cached;
    }

    let deviceId: string | null = null;

    try {
      if (Platform.OS === 'android') {
        deviceId = await Application.getAndroidIdAsync();
      } else if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync();
      } else {
        deviceId = Application.applicationId ?? null;
      }
    } catch (error) {
      console.warn('Failed to obtain device identifier from native APIs, using fallback.', error);
    }

    if (!deviceId || deviceId === 'unknown') {
      deviceId = generateFallbackId();
    }

    await AsyncStorage.setItem(STORAGE_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.warn('Failed to obtain cached device identifier, generating fallback.', error);
    const fallback = generateFallbackId();
    try {
      await AsyncStorage.setItem(STORAGE_KEY, fallback);
    } catch {
      // ignore secondary failure
    }
    return fallback;
  }
};


