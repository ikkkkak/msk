import { useEffect, useRef, useCallback, useState } from "react";
import { useUser } from "./useUser";
import { api } from "../services/api";
import { endpoints } from "../constants";
import { getOrCreateDeviceId } from "../utils/deviceId";

interface TrackBehaviorParams {
  propertyId: number;
  propertyType: "sale" | "rent";
  interactionType: "view" | "click" | "favorite" | "contact";
  cityId?: number;
  cityName?: string;
  zoneId?: number;
  zoneName?: string;
  timeSpent?: number;
  deviceId?: string;
  phoneNumber?: string;
}

/**
 * Hook for tracking user behavior with properties
 * Automatically tracks view time and provides methods for other interactions
 */
export const usePropertyBehaviorTracking = (
  propertyId: number | undefined,
  propertyType: "sale" | "rent" = "sale",
  cityId?: number,
  cityName?: string,
  zoneId?: number,
  zoneName?: string
) => {
  const { user } = useUser();
  const viewStartTime = useRef<number | null>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");

  // Get device ID on mount
  useEffect(() => {
    getOrCreateDeviceId().then((id) => {
      if (id) {
        setDeviceId(id);
        console.log("📱 Device ID for tracking:", id);
      }
    }).catch((err) => {
      console.log("⚠️ Failed to get device ID:", err);
    });
  }, []);

  // Track view start
  useEffect(() => {
    if (!propertyId) return;

    // Track initial view
    trackBehavior({
      propertyId,
      propertyType,
      interactionType: "view",
      cityId,
      cityName,
      zoneId,
      zoneName,
      timeSpent: 0,
    });

    // Record start time
    viewStartTime.current = Date.now();

    // Track time spent every 10 seconds
    trackingInterval.current = setInterval(() => {
      if (viewStartTime.current) {
        const timeSpent = Math.floor((Date.now() - viewStartTime.current) / 1000);
        trackBehavior({
          propertyId,
          propertyType,
          interactionType: "view",
          cityId,
          cityName,
          zoneId,
          zoneName,
          timeSpent,
        });
      }
    }, 10000); // Every 10 seconds

    // Cleanup: Track final time spent when component unmounts
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }

      if (viewStartTime.current) {
        const totalTimeSpent = Math.floor(
          (Date.now() - viewStartTime.current) / 1000
        );
        if (totalTimeSpent > 0) {
          trackBehavior({
            propertyId,
            propertyType,
            interactionType: "view",
            cityId,
            cityName,
            zoneId,
            zoneName,
            timeSpent: totalTimeSpent,
          });
        }
      }
    };
  }, [propertyId, propertyType, cityId, cityName, zoneId, zoneName]);

  const trackBehavior = useCallback(
    async (params: TrackBehaviorParams) => {
      try {
        // Fetch device ID if not available yet (for anonymous tracking)
        let finalDeviceId = deviceId || params.deviceId;
        if (!finalDeviceId) {
          try {
            finalDeviceId = await getOrCreateDeviceId();
            if (finalDeviceId) {
              setDeviceId(finalDeviceId); // Cache it for future calls
            }
          } catch (err) {
            console.log("⚠️ Could not fetch device ID:", err);
          }
        }

        // Convert camelCase to snake_case to match backend expectations
        const payload = {
          property_id: params.propertyId,
          property_type: params.propertyType,
          interaction_type: params.interactionType,
          city_id: params.cityId,
          city_name: params.cityName || "",
          zone_id: params.zoneId,
          zone_name: params.zoneName || "",
          time_spent: params.timeSpent || 0,
          device_id: finalDeviceId || "", // Always include device_id (even for logged-in users)
          phone_number: user?.phoneNumber || params.phoneNumber || "",
        };
        
        console.log("📊 Tracking behavior:", {
          property_id: payload.property_id,
          interaction_type: payload.interaction_type,
          city_name: payload.city_name,
          device_id: payload.device_id ? payload.device_id.substring(0, 10) + "..." : "none",
          phone_number: payload.phone_number ? "***" : "none",
        });

        const response = await api.post(`${endpoints.user}/behavior/track`, payload);
        console.log("✅ Behavior tracked successfully:", response.data);
      } catch (error: any) {
        // Log error but don't break the app
        console.log("❌ Failed to track behavior:", error?.response?.data || error?.message || error);
      }
    },
    [deviceId, user?.phoneNumber]
  );

  const trackClick = useCallback(() => {
    if (!propertyId) return;
    trackBehavior({
      propertyId,
      propertyType,
      interactionType: "click",
      cityId,
      cityName,
      zoneId,
      zoneName,
    });
  }, [propertyId, propertyType, cityId, cityName, zoneId, zoneName, trackBehavior]);

  const trackFavorite = useCallback(() => {
    if (!propertyId) return;
    trackBehavior({
      propertyId,
      propertyType,
      interactionType: "favorite",
      cityId,
      cityName,
      zoneId,
      zoneName,
    });
  }, [propertyId, propertyType, cityId, cityName, zoneId, zoneName, trackBehavior]);

  const trackContact = useCallback(() => {
    if (!propertyId) return;
    trackBehavior({
      propertyId,
      propertyType,
      interactionType: "contact",
      cityId,
      cityName,
      zoneId,
      zoneName,
    });
  }, [propertyId, propertyType, cityId, cityName, zoneId, zoneName, trackBehavior]);

  return {
    trackClick,
    trackFavorite,
    trackContact,
  };
};
