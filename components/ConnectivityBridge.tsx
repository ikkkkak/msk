/**
 * Pushes NetInfo state into connectivityBridge for API + mutation queue.
 */
import { useEffect } from "react";
import { useConnectivity } from "../hooks/useConnectivity";
import { setConnectivitySnapshot } from "../services/connectivityBridge";

export function ConnectivityBridge(): null {
  const c = useConnectivity();

  useEffect(() => {
    setConnectivitySnapshot({
      connectionQuality: c.connectionQuality,
      isConnected: c.isConnected,
    });
  }, [c.connectionQuality, c.isConnected]);

  return null;
}
