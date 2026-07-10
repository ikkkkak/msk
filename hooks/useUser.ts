import { useContext } from "react";
import {
  removeStoredUser,
  setStoredUser,
} from "../services/userStorage";
import { tokenStorage } from "../services/tokenStorage";
import { publicApi } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";

import { AuthContext } from "../context";
import { User } from "../types/user";
import { Property } from "../types/property";
import { queryKeys } from "../constants";
import { alterAllowsNotifications, alterPushToken } from "../services/user";
import { socket } from "../constants/socket";
import { bootstrapAuthenticatedSession } from "../services/authenticatedSessionBootstrap";
import { teardownMessagingSession } from "../services/messagingInboxPrefetch";
import { emitAuthLogout } from "../services/authEvents";

export const useUser = () => {
  const { user, setUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const setAndStoreUser = async (user: User) => {
    const stringUser = JSON.stringify(user);
    console.log(
      "🔄 STORING USER: allowsNotifications =",
      user.allowsNotifications
    );
    setUser(user);
    await setStoredUser(JSON.parse(stringUser) as User);
  };

  const login = async (user: User) => {
    tokenStorage.setAccess(user.accessToken, String(user.ID));
    await tokenStorage.setRefresh(user.refreshToken, String(user.ID));

    const hydrated = await bootstrapAuthenticatedSession(queryClient, user);

    await setAndStoreUser(hydrated);

    socket.auth = {
      userID: hydrated.ID,
      username:
        hydrated.firstName && hydrated.lastName
          ? `${hydrated.firstName} ${hydrated.lastName}`
          : `${hydrated.phoneNumber || hydrated.email}`,
      accessToken: hydrated.accessToken,
    };
    socket.connect();

    const searchedProperties: Property[] | undefined = queryClient.getQueryData(
      queryKeys.searchProperties,
    );
    if (searchedProperties) {
      for (const i of searchedProperties) {
        i.liked = false;
        if (hydrated.savedProperties?.includes(i.ID)) i.liked = true;
      }
      queryClient.setQueryData(queryKeys.searchProperties, searchedProperties);
    }
  };

  const logout = async () => {
    if (user) {
      const prevUser = { ...user };
      teardownMessagingSession(queryClient);
      setUser(null);
      emitAuthLogout();
      try {
        const refreshToken = await tokenStorage.getRefresh();
        if (refreshToken) {
          await publicApi.post("/auth/logout", {
            refresh_token: refreshToken,
            refreshToken,
          });
        }
        try {
          const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
          if (pushToken)
            await alterPushToken(prevUser.ID, "remove", pushToken, prevUser.accessToken);
        } catch {
          // ignore
        }
      } catch {
        // Clear regardless of server response
      } finally {
        await tokenStorage.clearAll();
        removeStoredUser().catch(() => {});
      }
      socket.disconnect();
      queryClient.clear();
    }
  };

  const setSavedProperties = (savedProperties: number[]) => {
    if (user) {
      const newUser = { ...user };
      newUser.savedProperties = savedProperties;
      setAndStoreUser(newUser).catch(() => {});
    }
  };

  const setSavedExperiences = (savedExperiences: number[]) => {
    if (user) {
      const newUser = { ...user };
      newUser.savedExperiences = savedExperiences;
      setAndStoreUser(newUser).catch(() => {});
    }
  };

  const addPushToken = async (token: string) => {
    // Get the latest user from context at call time
    const currentUser = user;
    if (!currentUser) {
      console.error("❌ Cannot add push token: no user");
      return;
    }

    const updatedUser = { ...currentUser };
    const prevUser = { ...currentUser };

    console.log(
      "🔄 ADD TOKEN: Current allowsNotifications:",
      currentUser.allowsNotifications
    );

    updatedUser.pushToken = token;
    // Preserve allowsNotifications from current user
    updatedUser.allowsNotifications = currentUser.allowsNotifications;

    // Store immediately for optimistic update
    setAndStoreUser(updatedUser).catch(() => {});

    try {
      await alterPushToken(
        currentUser.ID,
        "add",
        token,
        currentUser.accessToken
      );
    } catch (error) {
      console.error("❌ Failed to add push token:", error);
      setAndStoreUser(prevUser).catch(() => {});
    }
  };

  const replacePushToken = async (token: string) => {
    // Get the latest user from context at call time
    const currentUser = user;
    if (!currentUser) {
      console.error("❌ Cannot replace push token: no user");
      return;
    }

    const updatedUser = { ...currentUser };
    const prevUser = { ...currentUser };

    console.log("🔄 REPLACE TOKEN: OLD TOKEN:", prevUser.pushToken || "NULL");
    console.log("🔄 REPLACE TOKEN: NEW TOKEN:", token);
    console.log(
      "🔄 REPLACE TOKEN: Current allowsNotifications:",
      currentUser.allowsNotifications
    );

    updatedUser.pushToken = token;
    // Preserve allowsNotifications from current user
    updatedUser.allowsNotifications = currentUser.allowsNotifications;

    // Store immediately for optimistic update
    setAndStoreUser(updatedUser).catch(() => {});

    try {
      console.log("🔄 REPLACE TOKEN: Sending replace request to backend...");
      await alterPushToken(
        currentUser.ID,
        "replace",
        token,
        currentUser.accessToken
      );
      console.log("✅ TOKEN REPLACED: Successfully replaced token in database");
      console.log("✅ TOKEN REPLACED: NEW TOKEN STORED:", token);
    } catch (error) {
      console.error("❌ TOKEN REPLACE ERROR:", error);
      setAndStoreUser(prevUser).catch(() => {});
    }
  };

  const setAllowsNotifications = async (allowed: boolean) => {
    if (!user) {
      console.error("❌ Cannot set notifications: no user");
      return;
    }

    // Prevent duplicate updates
    if (user.allowsNotifications === allowed) {
      console.log(
        `⚠️ Notifications already ${
          allowed ? "enabled" : "disabled"
        }, skipping update`
      );
      return;
    }

    const prevUser = { ...user };
    const updatedUser = { ...user, allowsNotifications: allowed };

    console.log(`🔄 SETTING NOTIFICATIONS: ${allowed} for user ${user.ID}`);

    // Optimistic update
    setAndStoreUser(updatedUser).catch(() => {});

    try {
      console.log("🔄 CALLING BACKEND: alterAllowsNotifications");
      await alterAllowsNotifications(user.ID, allowed);
      console.log("✅ BACKEND SUCCESS: Notifications updated successfully");
    } catch (error) {
      console.error(
        "❌ BACKEND ERROR: alterAllowsNotifications failed:",
        error
      );
      console.log("🔄 REVERTING: Setting back to previous state");
      setAndStoreUser(prevUser).catch(() => {});
      throw error;
    }
  };

  const updatePhoneNumber = async (phoneNumber: string | null) => {
    if (!user) return;
    const prevUser = { ...user };
    const updatedUser = { ...user, phoneNumber: phoneNumber || undefined };
    setAndStoreUser(updatedUser).catch(() => {});
    try {
      const { api } = await import("../services/api");
      await api.put("/user/profile", {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: phoneNumber || "",
      });
    } catch (err: any) {
      setAndStoreUser(prevUser).catch(() => {});
      throw err;
    }
  };

  return {
    user,
    login,
    logout,
    setSavedProperties,
    setSavedExperiences,
    addPushToken,
    replacePushToken,
    setAllowsNotifications,
    updatePhoneNumber,
  };
};
