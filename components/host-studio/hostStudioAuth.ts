import type { TFunction } from "i18next";

export function isHostStudioAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const ax = error as {
    response?: { status?: number; data?: Record<string, unknown> };
    message?: string;
  };
  const status = ax.response?.status;
  if (status === 401 || status === 403) return true;

  const data = ax.response?.data;
  const code = String(data?.code ?? "").toUpperCase();
  if (code === "NO_TOKEN" || code === "TOKEN_EXPIRED" || code === "UNAUTHORIZED") {
    return true;
  }

  const msg = String(data?.error ?? data?.message ?? ax.message ?? "").toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("user not found") ||
    msg.includes("token expired") ||
    msg.includes("invalid token") ||
    msg.includes("sign in")
  );
}

export function getHostStudioErrorMessage(
  error: unknown,
  t: TFunction,
): string {
  if (isHostStudioAuthError(error)) {
    return t(
      "hostStudio.sessionExpiredSub",
      "Your session ended. Sign in again to view your video and listing stats.",
    );
  }
  const ax = error as { message?: string; response?: { data?: { error?: string } } };
  return (
    String(ax.response?.data?.error ?? ax.message ?? "") ||
    t(
      "hostStudio.loadErrorSub",
      "Check your connection and that the server is running, then try again.",
    )
  );
}
