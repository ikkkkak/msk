import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";
import { openSettings } from "expo-linking";
import { useRef } from "react";
import { useNavigation } from "@react-navigation/native";

import { useUser } from "./useUser";
import { obtainPushToken } from "../utils/pushToken";
import { linkMarketingDeviceToUser } from "../services/marketingNotifications";

// Global flag to prevent duplicate registration attempts across hook instances
let isRegistering = false;
let registrationAttempted = false;

export const useNotifications = () => {
  const { addPushToken, replacePushToken, setAllowsNotifications, user } = useUser();
  const registrationInProgress = useRef(false);
  const navigation = useNavigation<any>();

  const registerForPushNotificationsAsync = async (alertUser?: boolean, forceNewToken?: boolean) => {
    // Prevent duplicate calls within the same hook instance
    if (registrationInProgress.current) {
      console.log('⚠️ Registration already in progress, skipping duplicate call');
      return null;
    }

    // Prevent duplicate calls across hook instances (global guard)
    if (isRegistering) {
      console.log('⚠️ Registration already in progress globally, skipping duplicate call');
      return null;
    }

    registrationInProgress.current = true;
    isRegistering = true;
    
    try {
      if (!Device.isDevice) {
        Alert.alert("Error", "Must use physical device for Push Notifications");
        registrationInProgress.current = false;
        isRegistering = false;
        return null;
      }

      if (!user) {
        console.log('❌ No user found, cannot register for notifications');
        registrationInProgress.current = false;
        isRegistering = false;
        return null;
      }
      // Step 1: Check permissions first
      // CRITICAL: Only check, NEVER request permission automatically
      // Permission should only be requested when user explicitly clicks button in NotificationPermissionScreen
      console.log('🔐 STEP 1: Checking notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      const finalStatus = existingStatus;
      
      // NEVER request permission automatically - this should only happen via NotificationPermissionScreen
      if (existingStatus !== "granted") {
        console.log('🔐 Permission not granted - user must grant via NotificationPermissionScreen');
        throw new Error("Permission not granted - user must grant permission via NotificationPermissionScreen");
      } else {
        console.log('✅ Permission already granted, proceeding with registration');
      }

      if (finalStatus !== "granted") {
        console.log('❌ Permission denied by user');
        if (alertUser) {
          Alert.alert(
            "Permission Required",
            "To enable Push Notifications please change your settings.",
            [
              { text: "Cancel" },
              { text: "Open Settings", onPress: openSettings },
            ]
          );
        }
        if (user.allowsNotifications) {
          await setAllowsNotifications(false);
        }
        throw new Error("User doesn't allow for notifications");
      }

      console.log('✅ Permission granted, generating token...');

      const tokenResult = await obtainPushToken();
      if (!tokenResult?.token) {
        throw new Error('Failed to generate push token');
      }

      const token = tokenResult.token;
      console.log('🔑 Token generated successfully:', token.substring(0, 30) + '...');
      console.log('🔑 Token type:', tokenResult.type);
      console.log('🔑 Token length:', token.length);

      // Step 3: Store token on server
      console.log('💾 Storing token on server...');
      if (forceNewToken) {
        await replacePushToken(token);
        console.log('✅ Token replaced on server');
      } else {
        await addPushToken(token);
        console.log('✅ Token added to server');
      }

      try {
        await linkMarketingDeviceToUser();
        console.log('🔗 Marketing device linked to authenticated user');
      } catch (linkError) {
        console.warn('⚠️ Failed to link marketing device to user (non-critical)', linkError);
      }

      console.log('🎉 NOTIFICATION REGISTRATION COMPLETE!');
      registrationAttempted = true;
      return token;

    } catch (error) {
      console.error('❌ NOTIFICATION REGISTRATION FAILED:', error);
      if (user?.allowsNotifications) {
        await setAllowsNotifications(false);
      }
      throw error;
    } finally {
      registrationInProgress.current = false;
      // Reset global flag after a delay to allow retries if needed
      setTimeout(() => {
        isRegistering = false;
      }, 2000);
    }
  };

  // This listener is fired whenever a notification is received while the app is foregrounded
  const handleNotification = (notification: Notifications.Notification) => {
    // could be useful if you want to display your own toast message
    // could also make a server call to refresh data in other part of the app
  };

  // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data: Record<string, any> = response.notification.request.content.data || {};

    const screen = data.screen as string | undefined;

    if (screen === "ListingGuide" || data.type === "meskeny_guide") {
      let params: Record<string, unknown> = {};
      if (typeof data.params === "string") {
        try {
          params = JSON.parse(data.params);
        } catch {
          params = {};
        }
      }
      const propertySaleId =
        params.propertySaleId ??
        data.propertyId ??
        data.propertyID;
      const commentId = params.commentId ?? data.id;
      const parsedId = Number(propertySaleId);
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        navigation.navigate("ListingGuide", {
          propertySaleId: parsedId,
          commentId: commentId ? Number(commentId) : undefined,
        });
        return;
      }
    }

    const propertyIdRaw =
      data.propertyId ?? data.id ?? data.propertyID ?? data.property_id;
    if (
      (screen === "PropertySaleDetails" || data.type === "new_property" || data.type === "nearby_property" || data.type === "trending_properties" || data.type === "weekly_digest" || data.type === "continue_browsing") &&
      propertyIdRaw != null
    ) {
      const parsedPropertyId = Number(propertyIdRaw);
      if (!Number.isNaN(parsedPropertyId) && parsedPropertyId > 0) {
        navigation.navigate("PropertySaleDetails", { propertyId: parsedPropertyId });
        return;
      }
    }

    if (typeof data?.url === "string" && data.url.length > 0) {
      Linking.openURL(data.url);
    }
  };

  return {
    registerForPushNotificationsAsync,
    handleNotification,
    handleNotificationResponse,
  };
};