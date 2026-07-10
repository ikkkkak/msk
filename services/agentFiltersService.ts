/**
 * Persist MeskenyGPT session filters (Spec v2 §7) before a search turn.
 */
import { serverUrl } from "../constants";
import { tokenStorage } from "./tokenStorage";

export type AgentFilterPatch = {
  sessionId?: string;
  anonSessionId?: string;
  city?: string;
  zone?: string;
  quartier?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
};

export async function updateAgentFilters(
  patch: AgentFilterPatch,
): Promise<boolean> {
  const token = tokenStorage.getAccess();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `${serverUrl.replace(/\/+$/, "")}/ai/agent/filters`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: patch.sessionId ?? "",
          anon_session_id: patch.anonSessionId ?? "",
          city: patch.city,
          zone: patch.zone,
          quartier: patch.quartier,
          type: patch.type,
          min_price: patch.minPrice,
          max_price: patch.maxPrice,
          bedrooms: patch.bedrooms,
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}
