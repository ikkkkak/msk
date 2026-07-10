import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';

import { publicApi, api } from './api';
import { getOrCreateDeviceId } from '../utils/deviceId';

export interface MarketingDeviceRegistrationPayload {
  deviceId: string;
  fcmToken: string;
  marketingOptIn: boolean;
  locale?: string;
  timezone?: string;
  platform?: string;
  appVersion?: string;
  sdkVersion?: string;
}

export interface MarketingDeviceLinkPayload {
  deviceId: string;
}

const getDefaultRegistrationPayload = async (token: string): Promise<MarketingDeviceRegistrationPayload> => {
  const deviceId = await getOrCreateDeviceId();
  const locale = Localization.getLocales?.()[0]?.languageTag ?? Localization.locale;
  const timezone = Localization.getCalendars?.()[0]?.timeZone ?? Localization.timezone;
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'unknown';
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? Constants.nativeBuildVersion ?? undefined;

  return {
    deviceId,
    fcmToken: token,
    marketingOptIn: true,
    locale,
    timezone,
    platform: Platform.OS,
    appVersion,
    sdkVersion,
  };
};

export const registerMarketingDevice = async (token: string, overrides?: Partial<MarketingDeviceRegistrationPayload>) => {
  const payload = await getDefaultRegistrationPayload(token);
  const finalPayload = { ...payload, ...overrides };
  return publicApi.post('/notifications/marketing/device', finalPayload);
};

export const linkMarketingDeviceToUser = async (deviceId?: string) => {
  const resolvedDeviceId = deviceId ?? (await getOrCreateDeviceId());
  const payload: MarketingDeviceLinkPayload = {
    deviceId: resolvedDeviceId,
  };
  return api.put('/notifications/marketing/device/link', payload);
};


