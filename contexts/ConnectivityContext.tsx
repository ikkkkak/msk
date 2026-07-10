/**
 * Connectivity Context – provides network-aware behavior for video loading
 */
import React, { createContext, useContext } from "react";
import { useConnectivity, ConnectivityState } from "../hooks/useConnectivity";

const ConnectivityContext = createContext<ConnectivityState | null>(null);

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const connectivity = useConnectivity();
  return (
    <ConnectivityContext.Provider value={connectivity}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export function useConnectivityContext(): ConnectivityState {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) {
    return {
      isConnected: true,
      isInternetReachable: true,
      type: "unknown",
      connectionQuality: "good",
      shouldAutoplayVideo: true,
      shouldPrefetchVideo: true,
      prefetchDistance: 2,
      showLowConnectivityMessage: false,
      requiresTapToLoad: false,
      feedQuality: "high",
    };
  }
  return ctx;
}
