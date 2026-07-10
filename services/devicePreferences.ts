import { publicApi } from "./api";
import { getOrCreateDeviceId } from "../utils/deviceId";
import * as SecureStore from "expo-secure-store";

const PREFS_KEY = "meskeny_device_prefs";
const CHECKED_KEY = "meskeny_prefs_checked";

export type DevicePreferences = {
  exists: boolean;
  hasPushToken: boolean;
  interests?: string[];
  favorite_city_id?: number | null;
  favorite_city_name?: string;
  favorite_zone_id?: number | null;
  favorite_zone_name?: string;
};

export async function fetchDevicePreferences(): Promise<DevicePreferences | null> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const res = await publicApi.get("/device/preferences", {
      params: { deviceId },
    });
    if (res.data?.success !== true) return null;
    return res.data?.data ?? null;
  } catch {
    return null;
  }
}

// Gate resolver for boot flow:
// - returns cached preferences first
// - avoids repeated API calls when server has no preferences
// - never forces modal on network failures
export async function resolveDevicePreferences(): Promise<DevicePreferences | null> {
  try {
    const cached = await SecureStore.getItemAsync(PREFS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as DevicePreferences;
        if (Array.isArray(parsed?.interests) && parsed.interests.length > 0) {
          return parsed;
        }
      } catch {
        // ignore corrupt cache and continue with fresh resolution
      }
    }

    const checked = await SecureStore.getItemAsync(CHECKED_KEY);
    if (checked === "empty") return null;

    const deviceId = await getOrCreateDeviceId();
    const res = await publicApi.get("/device/preferences", {
      params: { deviceId },
    });
    const prefs = res?.data?.success === true ? (res.data?.data as DevicePreferences | null) : null;
    const interests = prefs?.interests ?? [];
    if (prefs?.exists && interests.length > 0) {
      await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
      await SecureStore.deleteItemAsync(CHECKED_KEY);
      return prefs;
    }

    // We reached API successfully and there are no usable preferences.
    await SecureStore.setItemAsync(CHECKED_KEY, "empty");
    return null;
  } catch (error) {
    // network/storage failure: caller should decide fallback and avoid forcing modal.
    throw error;
  }
}

export async function resolveDevicePreferencesGate(): Promise<{
  preferences: DevicePreferences | null;
  shouldShowModal: boolean;
}> {
  try {
    const prefs = await resolveDevicePreferences();
    return {
      preferences: prefs,
      shouldShowModal: !prefs,
    };
  } catch {
    return {
      preferences: null,
      shouldShowModal: false,
    };
  }
}

export async function upsertDevicePreferences(input: {
  interests: string[];
  favorite_city_id?: number | null;
  favorite_city_name?: string;
  favorite_zone_id?: number | null;
  favorite_zone_name?: string;
}): Promise<boolean> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const payload = {
      deviceId,
      interests: input.interests,
      favorite_city_id: input.favorite_city_id ?? null,
      favorite_city_name: input.favorite_city_name ?? "",
      favorite_zone_id: input.favorite_zone_id ?? null,
      favorite_zone_name: input.favorite_zone_name ?? "",
    };
    const res = await publicApi.put("/device/preferences", payload);
    const ok = res.data?.success === true;
    if (ok) {
      const normalized: DevicePreferences = {
        exists: true,
        hasPushToken: false,
        interests: input.interests,
        favorite_city_id: input.favorite_city_id ?? null,
        favorite_city_name: input.favorite_city_name ?? "",
        favorite_zone_id: input.favorite_zone_id ?? null,
        favorite_zone_name: input.favorite_zone_name ?? "",
      };
      await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(normalized));
      await SecureStore.deleteItemAsync(CHECKED_KEY);
    }
    return ok;
  } catch {
    return false;
  }
}

export async function clearResolvedDevicePreferences(): Promise<void> {
  await SecureStore.deleteItemAsync(PREFS_KEY);
  await SecureStore.deleteItemAsync(CHECKED_KEY);
}

