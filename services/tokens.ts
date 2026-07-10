import { refreshSessionTokens } from "./session";

export const refreshTokens = async (refreshToken: string) => {
  // Backward compatible wrapper; refresh is handled via single-flight session manager.
  // Note: refreshToken param is ignored intentionally to avoid token-rotation races.
  const refreshed = await refreshSessionTokens();
  if (!refreshed) return null;
  return { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken };
};
