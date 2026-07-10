import { tokenStorage } from "./tokenStorage";
import { refreshSessionTokens } from "./session";
import {
  isAccessTokenExpired,
  shouldProactivelyRefresh,
} from "../utils/jwtExpiry";

let ensureInFlight: Promise<string | null> | null = null;

/**
 * Ensures a valid access token before API calls.
 * Refreshes silently when JWT is missing, expired, or within 5 min of expiry.
 */
export async function ensureValidAccessToken(): Promise<string | null> {
  if (ensureInFlight) return ensureInFlight;

  ensureInFlight = (async () => {
    const access = tokenStorage.getAccess();
    const refresh = await tokenStorage.getRefresh();

    if (!refresh) return access;

    const needsRefresh =
      !access ||
      isAccessTokenExpired(access) ||
      shouldProactivelyRefresh(access);

    if (!needsRefresh) return access;

    const refreshed = await refreshSessionTokens();
    return refreshed?.accessToken ?? null;
  })();

  try {
    return await ensureInFlight;
  } finally {
    ensureInFlight = null;
  }
}
