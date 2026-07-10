/**
 * Connectivity-aware hook for video loading & data usage
 * Adapts video behavior: autoplay, prefetch, resolution based on connection quality
 */
import { useState, useEffect, useMemo } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export type ConnectionQuality = "good" | "moderate" | "poor" | "offline";

export interface ConnectivityState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  connectionQuality: ConnectionQuality;
  /** Should videos autoplay (Wi-Fi, strong 4G/5G) */
  shouldAutoplayVideo: boolean;
  /** Should prefetch next 1-2 videos (Wi-Fi, 4G) */
  shouldPrefetchVideo: boolean;
  /** Prefetch distance: 2 on good, 1 on moderate, 0 on poor */
  prefetchDistance: number;
  /** Show low-connectivity message (moderate/poor) */
  showLowConnectivityMessage: boolean;
  /** User must tap to load video (offline or poor) */
  requiresTapToLoad: boolean;
  /** Feed API quality tier — poor/offline uses smaller payloads */
  feedQuality: "high" | "low";
}

function mapToConnectionQuality(state: NetInfoState | null): ConnectionQuality {
  // NetInfo is null on first render — assume good so prefetch cache keys match the feed screen.
  if (state === null) return "good";
  if (!state.isConnected) return "offline";
  if (state.isInternetReachable === false) return "poor";

  const type = (state.type || "").toLowerCase();
  const details = state.details as any;
  const cellularGeneration = details?.cellularGeneration?.toLowerCase?.() || "";

  if (type === "wifi" || type === "ethernet") return "good";
  if (type === "cellular") {
    if (
      cellularGeneration === "4g" ||
      cellularGeneration === "5g" ||
      cellularGeneration === "lte"
    )
      return "good";
    if (cellularGeneration === "3g") return "moderate";
    return "poor"; // 2g, unknown
  }

  return "moderate"; // unknown type, assume moderate
}

const initialState: ConnectivityState = {
  isConnected: false,
  isInternetReachable: null,
  type: "unknown",
  connectionQuality: "offline",
  shouldAutoplayVideo: false,
  shouldPrefetchVideo: false,
  prefetchDistance: 0,
  showLowConnectivityMessage: true,
  requiresTapToLoad: false,
  feedQuality: "high",
};

export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((s) => setState(s));
    NetInfo.fetch().then(setState);
    return unsubscribe;
  }, []);

  return useMemo(() => {
    const quality = mapToConnectionQuality(state);
    const isConnected = state?.isConnected ?? false;
    const isReachable = state?.isInternetReachable;

    const result: ConnectivityState = {
      isConnected,
      isInternetReachable: isReachable ?? null,
      type: state?.type || "unknown",
      connectionQuality: quality,
      // Autoplay on Wi‑Fi / strong cellular and on 3G (moderate). Poor/2G stays tap‑to‑play to avoid endless buffer.
      shouldAutoplayVideo:
        quality === "good" || quality === "moderate",
      shouldPrefetchVideo: quality === "good" || quality === "moderate",
      prefetchDistance: quality === "good" ? 2 : quality === "moderate" ? 1 : 0,
      showLowConnectivityMessage: quality === "moderate" || quality === "poor",
      requiresTapToLoad: quality === "poor" || quality === "offline",
      feedQuality:
        quality === "poor" || quality === "offline" ? "low" : "high",
    };

    return result;
  }, [state]);
}
