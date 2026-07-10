import AsyncStorage from "@react-native-async-storage/async-storage";

import { endpoints } from "../constants";

const notificationsRegisterUrl = `${endpoints.notifications}/register`;
const notificationsSendLocationUrl = `${endpoints.notifications}/send-location`;

export interface NotificationRegistrationData {
  user_id?: number | null;
  device_id?: string; // Device identifier for anonymous users
  push_token: string;
  language: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /** IANA timezone for server-side quiet hours (optional). */
  timezone?: string;
  quiet_start_hour?: number;
  quiet_end_hour?: number;
  max_smart_per_day?: number;
}

export const registerNotificationPreferences = async (
  data: NotificationRegistrationData,
): Promise<boolean> => {
  try {
    console.log("📝 Registering notification preferences with data:", {
      user_id: data.user_id,
      language: data.language,
      location: data.location,
      push_token: data.push_token
        ? data.push_token.substring(0, 20) + "..."
        : "MISSING",
      coordinates: data.coordinates,
    });
    console.log("🌐 API URL:", notificationsRegisterUrl);

    const response = await fetch(notificationsRegisterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("📡 Registration response status:", response.status);
    console.log("📡 Registration response ok:", response.ok);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(
          "❌ Registration endpoint not found - server may need to be updated",
        );
        return false;
      }
      const errorText = await response.text();
      console.log("❌ Registration error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Registration server response:", result);
    return result.success === true;
  } catch (error) {
    console.error("❌ Error registering notification preferences:", error);
    return false;
  }
};

export const sendLocationNotification = async (
  data: Omit<NotificationRegistrationData, "push_token">,
): Promise<boolean> => {
  try {
    console.log("📤 Sending location notification to server:", data);
    console.log("🌐 API URL:", notificationsSendLocationUrl);

    const response = await fetch(
      notificationsSendLocationUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    console.log("📡 Response status:", response.status);
    console.log("📡 Response ok:", response.ok);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(
          "❌ Notification endpoint not found - server may need to be updated",
        );
        return false;
      }
      const errorText = await response.text();
      console.log("❌ Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Server response:", result);
    return result.success === true;
  } catch (error) {
    console.error("❌ Error sending location notification:", error);
    return false;
  }
};

export const getStoredUserData = async (): Promise<{
  user_id: number | null;
  language: string;
} | null> => {
  try {
    const userData = await AsyncStorage.getItem("user");
    const language = (await AsyncStorage.getItem("selectedLanguage")) || "en";

    // Return user data if available, otherwise return null user_id
    if (userData) {
      const user = JSON.parse(userData);
      return {
        user_id: user.ID,
        language,
      };
    }

    // Return anonymous user data
    return {
      user_id: null,
      language,
    };
  } catch (error) {
    console.error("Error getting stored user data:", error);
    return null;
  }
};

export const storeNotificationPreferences = async (preferences: {
  enabled: boolean;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  language?: string;
}): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      "notificationPreferences",
      JSON.stringify({
        ...preferences,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Error storing notification preferences:", error);
  }
};

export const getNotificationPreferences = async (): Promise<{
  enabled: boolean;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  language?: string;
} | null> => {
  try {
    const stored = await AsyncStorage.getItem("notificationPreferences");
    if (!stored) return null;

    const preferences = JSON.parse(stored);
    return {
      enabled: preferences.enabled || false,
      location: preferences.location,
      coordinates: preferences.coordinates,
      language: preferences.language,
    };
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return null;
  }
};

export const checkExistingNotificationPreferences =
  async (): Promise<boolean> => {
    try {
      console.log(
        "🔍 Checking if user has existing notification preferences...",
      );

      const userData = await getStoredUserData();
      if (!userData) {
        console.log("❌ No user data available");
        return false;
      }

      // Check if we have a push token
      const pushToken = await AsyncStorage.getItem("expoPushToken");
      if (!pushToken) {
        console.log("❌ No push token available");
        return false;
      }

      // Check if user already has preferences stored locally
      const localPreferences = await getNotificationPreferences();
      if (localPreferences && localPreferences.enabled) {
        console.log("✅ User has local notification preferences");
        return true;
      }

      // For now, we'll assume if they have a push token and permission, they might have preferences
      // In a real app, you might want to make an API call to check the database
      console.log("🔍 No existing preferences found");
      return false;
    } catch (error) {
      console.error(
        "❌ Error checking existing notification preferences:",
        error,
      );
      return false;
    }
  };

export const testNotificationEndpoints = async (): Promise<boolean> => {
  try {
    console.log("🧪 Testing notification endpoints...");
    const response = await fetch(`${endpoints.notifications}/test`);

    if (!response.ok) {
      console.log("❌ Test endpoint failed:", response.status);
      return false;
    }

    const result = await response.json();
    console.log("✅ Test endpoint response:", result);
    return true;
  } catch (error) {
    console.error("❌ Error testing notification endpoints:", error);
    return false;
  }
};
