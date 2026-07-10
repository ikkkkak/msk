/**
 * Global connectivity snapshot for non-React code (API layer, mutation queue).
 * Updated by ConnectivityBridge mounted in App.
 */
import type { ConnectionQuality } from "../hooks/useConnectivity";

let tier: ConnectionQuality = "good";
let isConnected = true;

type ReconnectListener = () => void;
const reconnectListeners = new Set<ReconnectListener>();

/** Register callback when device goes offline → online (refetch critical data). */
export function onReconnect(listener: ReconnectListener): () => void {
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
}

export function setConnectivitySnapshot(opts: {
  connectionQuality: ConnectionQuality;
  isConnected: boolean;
}): void {
  const wasConnected = isConnected;
  tier = opts.connectionQuality;
  isConnected = opts.isConnected;

  if (!wasConnected && isConnected && tier !== "offline") {
    reconnectListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }
}

export function getConnectionQuality(): ConnectionQuality {
  return tier;
}

export function getIsConnected(): boolean {
  return isConnected;
}

/** Queue writes only when fully offline — poor networks still attempt then fallback. */
export function shouldQueueMutations(): boolean {
  return !isConnected || tier === "offline";
}

export function apiTimeoutMs(): number {
  switch (tier) {
    case "offline":
      return 4_000;
    case "poor":
      return 20_000;
    case "moderate":
      return 15_000;
    default:
      return 8_000;
  }
}

export function batchMutationLimit(): number {
  if (tier === "poor" || tier === "offline") return 3;
  if (tier === "moderate") return 8;
  return 15;
}
