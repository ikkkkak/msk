import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { endpoints } from '../constants';
import { getOrCreateDeviceId } from '../utils/deviceId';

export function useRegisterPushToken(userId?: number) {
  useEffect(() => {
    (async () => {
      try {
        if (!Device.isDevice) return;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        const deviceId = await getOrCreateDeviceId();
        await axios.post(
          `${endpoints.baseURL}/users/push-token`,
          { token, deviceId },
          { headers: { 'X-User-ID': String(userId || 0) } },
        );
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.MAX });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [userId]);
}



