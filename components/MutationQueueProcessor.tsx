/**
 * Drains offline mutation queue on reconnect / foreground.
 */
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { flushMutationQueue } from "../services/mutationQueue";

export const MutationQueueProcessor: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    void flushMutationQueue();

    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void flushMutationQueue();
      }
    });

    const appSub = AppState.addEventListener("change", (next) => {
      if (
        (appState.current === "background" || appState.current === "inactive") &&
        next === "active"
      ) {
        void flushMutationQueue();
      }
      appState.current = next;
    });

    const interval = setInterval(() => {
      void flushMutationQueue();
    }, 45_000);

    return () => {
      netSub();
      appSub.remove();
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
};
