import { useCallback, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  HOST_STUDIO_LIVE_INTERVAL_MS,
  useHostStudioQuery,
  type HostStudioData,
} from "./useHostStudioQuery";
import type { UseQueryResult } from "@tanstack/react-query";

export type HostStudioLiveResult = UseQueryResult<HostStudioData, Error> & {
  /** Cached studio payload — always prefer this for UI. */
  studio: HostStudioData | undefined;
  /** True only when there is no cached data yet. */
  showInitialSkeleton: boolean;
  /** Error with no cached fallback. */
  showBlockingError: boolean;
  /** Background sync (pull-to-refresh or live poll). */
  isSyncing: boolean;
};

/**
 * Host Studio with focus-aware refresh + light polling.
 * Keeps previous data visible (stale-while-revalidate) for fast, low-jank UI.
 */
export function useHostStudioLive(enabled = true): HostStudioLiveResult {
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const query = useHostStudioQuery(enabled, {
    refetchInterval:
      enabled && focused ? HOST_STUDIO_LIVE_INTERVAL_MS : false,
  });

  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      void refetch();
    }, [enabled, refetch]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const onAppState = (next: AppStateStatus) => {
        if (next === "active") void refetch();
      };
      const sub = AppState.addEventListener("change", onAppState);
      return () => sub.remove();
    }, [enabled, refetch]),
  );

  const studio = query.data;
  const hasData = studio != null;
  const showInitialSkeleton = query.isPending && !hasData;
  const showBlockingError = query.isError && !hasData;
  const isSyncing = query.isFetching && hasData;

  return {
    ...query,
    studio,
    showInitialSkeleton,
    showBlockingError,
    isSyncing,
  };
}
