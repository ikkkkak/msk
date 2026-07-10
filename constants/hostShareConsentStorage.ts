import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "host_share_consent_v1";
const TOAST_DISMISS_PREFIX = "host_share_consent_toast_dismissed_";

export type HostShareConsentCache = {
  shareProfileWithHosts: boolean;
  hasDecided: boolean;
  lockedHostId?: number | null;
  syncedAt: string;
};

export const hostShareConsentStorage = {
  async get(): Promise<HostShareConsentCache | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as HostShareConsentCache;
    } catch {
      return null;
    }
  },

  async set(value: HostShareConsentCache): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  },

  async isToastDismissed(userId: number): Promise<boolean> {
    if (!userId) return false;
    try {
      const v = await AsyncStorage.getItem(`${TOAST_DISMISS_PREFIX}${userId}`);
      return v === "1";
    } catch {
      return false;
    }
  },

  async setToastDismissed(userId: number, dismissed: boolean): Promise<void> {
    if (!userId) return;
    if (dismissed) {
      await AsyncStorage.setItem(`${TOAST_DISMISS_PREFIX}${userId}`, "1");
    } else {
      await AsyncStorage.removeItem(`${TOAST_DISMISS_PREFIX}${userId}`);
    }
  }
};
