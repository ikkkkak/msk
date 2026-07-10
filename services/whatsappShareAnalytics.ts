import { Platform } from "react-native";
import { endpoints } from "../constants";
import { API_PATHS } from "../constants/apiPaths";
import { tokenStorage } from "./tokenStorage";
import { getOrCreateDeviceId } from "../utils/deviceId";

export type WhatsAppShareEventName =
  | "sheet_opened"
  | "share_started"
  | "share_completed"
  | "share_failed"
  | "share_dismissed";

type TrackPayload = {
  propertySaleId: number;
  event: WhatsAppShareEventName;
  propertyTitle?: string | null;
};

/** Fire-and-forget analytics for WhatsApp share card funnel. */
export function trackWhatsAppShareEvent({
  propertySaleId,
  event,
  propertyTitle,
}: TrackPayload): void {
  if (!propertySaleId) return;

  void (async () => {
    try {
      const token = tokenStorage.getAccess();
      const deviceId = await getOrCreateDeviceId().catch(() => null);
      const url = `${endpoints.baseURL}${API_PATHS.whatsappShareEvents}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (deviceId) headers["X-Device-ID"] = deviceId;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          property_sale_id: propertySaleId,
          event,
          platform: Platform.OS,
          property_title: propertyTitle?.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (__DEV__) {
          console.warn(
            "[WhatsAppShareAnalytics]",
            event,
            res.status,
            body || res.statusText,
          );
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.warn("[WhatsAppShareAnalytics]", event, err);
      }
    }
  })();
}
