/**
 * Refetches host + public feeds when the device reconnects after being offline.
 */
import { useEffect } from "react";
import { onReconnect } from "../services/connectivityBridge";

export function ReconnectRefetchBridge({
  queryClient,
}: {
  queryClient: import("@tanstack/react-query").QueryClient;
}): null {
  useEffect(() => {
    return onReconnect(() => {
      void queryClient.refetchQueries({ queryKey: ["user-properties"] });
      void queryClient.refetchQueries({ queryKey: ["user-organization"] });
      void queryClient.refetchQueries({ queryKey: ["publicPropertySales"] });
      void queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
    });
  }, [queryClient]);

  return null;
}
