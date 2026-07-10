import * as SecureStore from "expo-secure-store";
import type { User } from "../types/user";

const SECURE_KEY = "user";

/** Migrates legacy stored user (with tokens) to tokenStorage. Call before getStoredUser when migrating. */
export async function migrateLegacyTokensToStorage(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const rt = parsed?.refreshToken;
    const uid = parsed?.ID;
    if (rt && uid != null) {
      const { tokenStorage } = await import("./tokenStorage");
      await tokenStorage.setRefresh(rt, String(uid));
    }
  } catch {
    // ignore
  }
}

/**
 * User profile storage — R-04/R-05: NO tokens stored here.
 * Access token: memory only (tokenStorage). Refresh token: SecureStore only (tokenStorage).
 */
export async function getStoredUser(): Promise<Omit<User, "accessToken" | "refreshToken"> | null> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    delete parsed.accessToken;
    delete parsed.refreshToken;
    return parsed;
  } catch {
    return null;
  }
}

/** Stores user profile only — tokens live in tokenStorage. */
export async function setStoredUser(user: User): Promise<void> {
  const { accessToken: _, refreshToken: __, ...profile } = user;
  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(profile));
}

export async function removeStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEY);
}

