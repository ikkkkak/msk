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
    if (refreshed?.accessToken) return refreshed.accessToken;

    // Refresh unavailable right now (rate limit, network blip, server hiccup)
    // but the current access token is still inside its lifetime — keep
    // authenticating with it instead of silently downgrading every API call
    // to anonymous. This was the "logged-in user gets 401 ← anonymous" bug:
    // the proactive-refresh window starts 5 minutes BEFORE expiry, and a
    // failed early refresh threw away a perfectly valid token.
    if (access && !isAccessTokenExpired(access)) return access;
    return null;
  })();

  try {
    return await ensureInFlight;
  } finally {
    ensureInFlight = null;
  }
}
