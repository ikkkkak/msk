import { useMemo } from "react";
import { useHostMode } from "../contexts/HostModeContext";
import { useUser } from "../hooks/useUser";

export function useAgentRunContext() {
  const { isHostMode } = useHostMode();
  const { user } = useUser();

  return useMemo(() => {
    const loggedIn = Boolean(user?.ID && user?.accessToken);
    const persona: "buyer" | "broker" =
      loggedIn && isHostMode ? "broker" : "buyer";
    let tier: "free" | "pro" | "broker" | "anon" = "anon";
    if (loggedIn) {
      tier = persona === "broker" ? "broker" : "free";
    }
    return { persona, tier, isBrokerMode: persona === "broker" };
  }, [isHostMode, user?.ID, user?.accessToken]);
}
