import { publicApi } from "./api";
import type { User } from "../types/user";
import { getStoredUser } from "./userStorage";
import { tokenStorage } from "./tokenStorage";
import { emitAuthFailure, emitTokensRefreshed } from "./authEvents";

let refreshInFlight: Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

async function buildUser(
  profile: Omit<User, "accessToken" | "refreshToken"> | null,
  accessToken: string,
  refreshToken: string
): Promise<User | null> {
  if (!profile) return null;
  return { ...profile, accessToken, refreshToken } as User;
}

export function isNetworkOrTimeoutError(err: any): boolean {
  if (!err) return true;
  const status = err?.response?.status;
  const code = err?.code;
  // No response (network error, timeout, etc.)
  if (status == null && (code === "ECONNABORTED" || code === "ERR_NETWORK" || code === "NETWORK_ERROR")) return true;
  return false;
}

export async function refreshSessionTokens(): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
} | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const stored = await tokenStorage.getRefresh();
    if (!stored) return null;

    const profile = await getStoredUser();
    if (!profile) return null;

    const tryRefresh = async (): Promise<{
      user: User;
      accessToken: string;
      refreshToken: string;
    } | null> => {
      const body = { refresh_token: stored, refreshToken: stored };
      let res;
      try {
        res = await publicApi.post(`/token/refresh`, body);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          res = await publicApi.post(`/auth/refresh`, body);
        } else {
          throw err;
        }
      }
      const newAccess = res.data?.accessToken as string | undefined;
      const newRefresh =
        (res.data?.refreshToken as string | undefined) || stored;
      if (!newAccess) return null;

      tokenStorage.setAccess(newAccess, String(profile.ID));
      await tokenStorage.setRefresh(newRefresh, String(profile.ID));
      emitTokensRefreshed(newAccess, newRefresh);

      const user = await buildUser(profile, newAccess, newRefresh);
      if (!user) return null;
      return { user, accessToken: newAccess, refreshToken: newRefresh };
    };

    let result: Awaited<ReturnType<typeof tryRefresh>> = null;
    try {
      result = await tryRefresh();
    } catch (err: any) {
      const status = err?.response?.status;
      // Retry once on network/timeout so a brief blip doesn't log the user out
      if (isNetworkOrTimeoutError(err)) {
        try {
          result = await tryRefresh();
        } catch (retryErr: any) {
          // Still no response - do NOT clear tokens; user can retry on next launch
          return null;
        }
      }
      if (!result && status === 401) {
        // Only log out on 401 Unauthorized (refresh token invalid/expired).
        // Do NOT log out on 403 or network errors.
        await tokenStorage.clearAll();
        emitAuthFailure();
      }
    }
    return result;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

