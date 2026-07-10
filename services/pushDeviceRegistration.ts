import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

import type { User } from "../types/user";
import { getOrCreateDeviceId } from "../utils/deviceId";
import { obtainPushToken } from "../utils/pushToken";
import { registerNotificationPreferences } from "./notificationService";
import { linkMarketingDeviceToUser } from "./marketingNotifications";

export type PushRegistrationContext = {
  city?: string;
  latitude?: number;
  longitude?: number;
};

const DEFAULT_LAT = 18.0735;
const DEFAULT_LNG = -15.9582;

const throttleByUser = new Map<number, number>();
const THROTTLE_MS = 4000;

/**
 * Ensures marketing/device id exists, then if the user is logged in, allows notifications,
 * and OS permission is granted: syncs Expo push token to AsyncStorage, POSTs /notifications/register
 * (with timezone for server-side quiet hours), and updates user push tokens when missing/changed.
 * Does not request OS permission (respects existing app policy).
 */
export async function runPushDeviceRegistrationCheck(
  user: User | null | undefined,
  addPushToken: (token: string) => Promise<void>,
  ctx?: PushRegistrationContext,
): Promise<{ ok: boolean; reason: string }> {
  try {
    const deviceId = await getOrCreateDeviceId();
    if (!deviceId) {
      return { ok: false, reason: "no_device_id" };
    }

    if (!user?.ID) {
      return { ok: false, reason: "not_logged_in" };
    }
    if (user.allowsNotifications !== true) {
      return { ok: false, reason: "notifications_disabled" };
    }
    if (!Device.isDevice) {
      return { ok: false, reason: "not_physical_device" };
    }

    const now = Date.now();
    const last = throttleByUser.get(user.ID) ?? 0;
    if (now - last < THROTTLE_MS) {
      return { ok: false, reason: "throttled" };
    }
    throttleByUser.set(user.ID, now);

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      return { ok: false, reason: "permission_denied" };
    }

    const tokenResult = await obtainPushToken();
    if (!tokenResult?.token) {
      return { ok: false, reason: "no_token" };
    }
    const token = tokenResult.token;
    await AsyncStorage.setItem("expoPushToken", token);

    const lat =
      typeof ctx?.latitude === "number" && Number.isFinite(ctx.latitude)
        ? ctx.latitude
        : DEFAULT_LAT;
    const lng =
      typeof ctx?.longitude === "number" && Number.isFinite(ctx.longitude)
        ? ctx.longitude
        : DEFAULT_LNG;
    const city = (ctx?.city && String(ctx.city).trim()) || "Meskeny";

    const language =
      (await AsyncStorage.getItem("selectedLanguage")) || "en";
    const timezone =
      Localization.getCalendars?.()[0]?.timeZone ??
      Localization.timezone ??
      "";

    const regOk = await registerNotificationPreferences({
      user_id: user.ID,
      device_id: deviceId,
      push_token: token,
      language,
      location: city,
      coordinates: { latitude: lat, longitude: lng },
      timezone: timezone || undefined,
    });

    if (!regOk) {
      console.warn(
        "⚠️ runPushDeviceRegistrationCheck: /notifications/register did not return success",
      );
    }

    if (!user.pushToken || user.pushToken !== token) {
      await addPushToken(token);
    }

    try {
      await linkMarketingDeviceToUser();
    } catch {
      // non-critical
    }

    return { ok: true, reason: regOk ? "synced" : "token_synced_prefs_failed" };
  } catch (e) {
    console.warn("⚠️ runPushDeviceRegistrationCheck failed:", e);
    return { ok: false, reason: "error" };
  }
}
