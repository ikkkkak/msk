import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export type PushTokenResult = {
  token: string;
  type: 'expo' | 'fcm' | 'apns' | 'unknown';
};

export const getExistingPermissionStatus = async (): Promise<Notifications.PermissionStatus> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const obtainPushToken = async (): Promise<PushTokenResult | null> => {
  const permissionStatus = await getExistingPermissionStatus();
  if (permissionStatus !== 'granted') {
    console.log('🔕 Push permission not granted, skipping token retrieval');
    return null;
  }

  let token = '';
  let tokenType: PushTokenResult['type'] = 'unknown';

  const isProduction = !__DEV__ && Boolean(Constants.expoConfig?.extra?.eas?.projectId);

  if (isProduction && Platform.OS === 'android') {
    try {
      const result = await Notifications.getDevicePushTokenAsync();
      token = result.data;
      const isExpoToken = token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
      if (!isExpoToken && token.length > 50) {
        tokenType = 'fcm';
      } else {
        tokenType = 'expo';
      }
    } catch (error) {
      console.warn('⚠️ Failed to obtain native FCM token, will fallback to Expo token', error);
    }
  }

  if (!token) {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId;
    const expoResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined as any);
    token = expoResult.data;
    const isExpoToken = token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
    if (Platform.OS === 'ios' && !isExpoToken) {
      tokenType = 'apns';
    } else if (isExpoToken) {
      tokenType = 'expo';
    } else {
      tokenType = 'fcm';
    }
  }

  if (!token) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return { token, type: tokenType };
};


