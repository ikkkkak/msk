import { publicApi } from "./api";
import type { User } from "../types/user";
import { getStoredUser } from "./userStorage";
import { tokenStorage } from "./tokenStorage";
import { emitAuthFailure, emitTokensRefreshed } from "./authEvents";
import { getOrCreateDeviceId } from "../utils/deviceId";

let refreshInFlight: Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

/**
 * Server-asked cooldown (429 Retry-After). While active, refresh attempts
 * short-circuit to null instead of re-hitting the rate limit — callers keep
 * using the current access token via ensureValidAccessToken's fallback.
 */
let refreshBackoffUntil = 0;

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
  if (Date.now() < refreshBackoffUntil) {
    return null;
  }

  refreshInFlight = (async () => {
    const stored = await tokenStorage.getRefresh();
    if (!stored) return null;

    const profile = await getStoredUser();
    if (!profile) return null;

    // X-Device-ID keys the server's refresh rate limit per device (not per
    // carrier-NAT IP) and lets rotation bind the new token to this device.
    let deviceId: string | undefined;
    try {
      deviceId = await getOrCreateDeviceId();
    } catch {
      /* refresh still works without it */
    }
    const headers = deviceId ? { "X-Device-ID": deviceId } : undefined;

    const tryRefresh = async (): Promise<{
      user: User;
      accessToken: string;
      refreshToken: string;
    } | null> => {
      const body = { refresh_token: stored, refreshToken: stored };
      let res;
      try {
        res = await publicApi.post(`/token/refresh`, body, { headers });
      } catch (err: any) {
        if (err?.response?.status === 404) {
          res = await publicApi.post(`/auth/refresh`, body, { headers });
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
      // Rate limited: honor Retry-After and stop hammering the endpoint.
      // The session survives — the access token keeps working via the
      // still-valid-token fallback until the cooldown passes.
      if (status === 429) {
        const retryAfter = Number(err?.response?.headers?.["retry-after"]);
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter, 120) * 1000
            : 60_000;
        refreshBackoffUntil = Date.now() + waitMs;
        return null;
      }
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

