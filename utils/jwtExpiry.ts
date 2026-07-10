/** Decode JWT payload without verification (client-side exp check only). */
export function getJwtExpiryMs(token: string | null | undefined): number | null {
  if (!token || !token.includes(".")) return null;
  try {
    const payload = token.split(".")[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const claims = JSON.parse(json) as { exp?: number };
    if (typeof claims.exp !== "number") return null;
    return claims.exp * 1000;
  } catch {
    return null;
  }
}

/** True when access token is past exp (with optional skew). */
export function isAccessTokenExpired(
  token: string | null | undefined,
  skewMs = 30_000,
): boolean {
  const expMs = getJwtExpiryMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}

/** Proactively refresh when within buffer of expiry (default 5 min). */
export function shouldProactivelyRefresh(
  token: string | null | undefined,
  bufferMs = 5 * 60 * 1000,
): boolean {
  const expMs = getJwtExpiryMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - bufferMs;
}
