/**
 * Zero Re-Login Token Storage
 * R-04/R-05: Access token in memory ONLY. Refresh token in expo-secure-store ONLY.
 * Never AsyncStorage. Never persist access token to disk.
 */
import * as SecureStore from "expo-secure-store";

// ACCESS TOKEN — JavaScript memory only. Lost when app process ends. Never written to disk.
let _accessToken: string | null = null;
let _userID: string | null = null;

const REFRESH_KEY = "app_refresh_token";
const USER_ID_KEY = "app_user_id";

export const tokenStorage = {
  setAccess(token: string, userID: string) {
    _accessToken = token;
    _userID = userID;
  },
  getAccess(): string | null {
    return _accessToken;
  },
  getUserID(): string | null {
    return _userID;
  },
  clearAccess() {
    _accessToken = null;
    _userID = null;
  },

  async setRefresh(token: string, userID: string) {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
    await SecureStore.setItemAsync(USER_ID_KEY, userID);
  },
  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async clearRefresh() {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
  },

  async clearAll() {
    this.clearAccess();
    await this.clearRefresh();
  },
};
