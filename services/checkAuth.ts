import type { User } from "../types/user";
import { getStoredUser } from "./userStorage";
import { tokenStorage } from "./tokenStorage";
import { refreshSessionTokens, isNetworkOrTimeoutError } from "./session";
import { isAccessTokenExpired } from "../utils/jwtExpiry";

export type BootAuthResult =
  | { status: "guest" }
  | { status: "authenticated"; user: User; offline?: boolean };

const BOOT_REFRESH_TIMEOUT_MS = 6_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("BOOT_REFRESH_TIMEOUT")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

function profileToUser(
  profile: Omit<User, "accessToken" | "refreshToken">,
  accessToken: string,
  refreshToken: string,
): User {
  return { ...profile, accessToken, refreshToken } as User;
}

/**
 * Boot-time auth: refresh when needed, stay logged in on network errors, logout only on 401 refresh.
 */
export async function checkAuth(): Promise<BootAuthResult> {
  const profile = await getStoredUser();
  const refreshToken = await tokenStorage.getRefresh();

  if (!profile || !refreshToken) {
    return { status: "guest" };
  }

  let accessToken = tokenStorage.getAccess() ?? "";

  const accessValid =
    !!accessToken && !isAccessTokenExpired(accessToken, 60_000);

  if (accessValid) {
    return {
      status: "authenticated",
      user: profileToUser(profile, accessToken, refreshToken),
    };
  }

  try {
    const refreshed = await withTimeout(
      refreshSessionTokens(),
      BOOT_REFRESH_TIMEOUT_MS,
    );
    if (refreshed?.user) {
      return { status: "authenticated", user: refreshed.user };
    }
  } catch (err: unknown) {
    if (isNetworkOrTimeoutError(err) || isBootTimeout(err)) {
      return {
        status: "authenticated",
        user: profileToUser(profile, accessToken, refreshToken),
        offline: true,
      };
    }
  }

  // Refresh returned null without throwing — stale session or revoked token cleared in session.ts
  const stillHasRefresh = await tokenStorage.getRefresh();
  if (!stillHasRefresh) {
    return { status: "guest" };
  }

  // Network blip: keep profile if refresh token remains
  return {
    status: "authenticated",
    user: profileToUser(profile, accessToken, refreshToken),
    offline: true,
  };
}

function isBootTimeout(err: unknown): boolean {
  return err instanceof Error && err.message === "BOOT_REFRESH_TIMEOUT";
}
