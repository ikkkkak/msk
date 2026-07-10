import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { ensureValidAccessToken } from "../services/proactiveRefresh";
import { tokenStorage } from "../services/tokenStorage";

/**
 * Refreshes JWT on foreground when near expiry — keeps ~2 week sessions alive
 * without waiting for a 401 from the API.
 */
export function SessionRefreshBridge() {
  const lastRefreshAttempt = useRef(0);

  useEffect(() => {
    let current = AppState.currentState;

    const maybeRefresh = async () => {
      const refresh = await tokenStorage.getRefresh();
      if (!refresh) return;

      const now = Date.now();
      // At most one proactive refresh attempt per minute while foregrounded.
      if (now - lastRefreshAttempt.current < 60_000) return;
      lastRefreshAttempt.current = now;

      await ensureValidAccessToken();
    };

    const onChange = (next: AppStateStatus) => {
      if (current !== "active" && next === "active") {
        void maybeRefresh();
      }
      current = next;
    };

    void maybeRefresh();
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  return null;
}
