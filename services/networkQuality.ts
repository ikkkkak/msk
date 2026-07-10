import NetInfo from "@react-native-community/netinfo";
import type { ConnectionQuality } from "../hooks/useConnectivity";

/** Resolve feed quality before ConnectivityProvider mounts (splash prefetch). */
export async function resolveInitialFeedQuality(): Promise<"high" | "low"> {
  try {
    const state = await NetInfo.fetch();
    const q = mapNetInfoToQuality(state);
    return q === "poor" || q === "offline" ? "low" : "high";
  } catch {
    return "high";
  }
}

function mapNetInfoToQuality(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
  type?: string;
  details?: unknown;
} | null): ConnectionQuality {
  if (state === null) return "good";
  if (!state.isConnected) return "offline";
  if (state.isInternetReachable === false) return "poor";

  const type = (state.type || "").toLowerCase();
  const details = state.details as { cellularGeneration?: string } | undefined;
  const gen = (details?.cellularGeneration || "").toLowerCase();

  if (type === "wifi" || type === "ethernet") return "good";
  if (type === "cellular") {
    if (gen === "4g" || gen === "5g" || gen === "lte") return "good";
    if (gen === "3g") return "moderate";
    return "poor";
  }
  return "moderate";
}
