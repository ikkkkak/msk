import { useCallback, useState } from "react";
import { api, publicApi } from "../services/api";
import { normalizeChatSessionId } from "../services/aiService";
import { tokenStorage } from "../services/tokenStorage";

export interface EscalationStatus {
  id: number;
  session_id: string;
  status: "pending" | "assigned" | "in_progress" | "resolved";
  urgency: "low" | "medium" | "high" | "urgent";
  reason: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

export type EscalationContact = {
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
};

function escalationClient() {
  return tokenStorage.getAccess() ? api : publicApi;
}

export function useAIEscalation() {
  const [escalation, setEscalation] = useState<EscalationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const requestAgent = useCallback(
    async (
      sessionId: string | number | null | undefined,
      reason?: string,
      contact?: EscalationContact,
      anonSessionId?: string | number | null,
    ) => {
      setLoading(true);
      try {
        const sid = normalizeChatSessionId(sessionId, anonSessionId);
        const body = {
          session_id: sid,
          anon_session_id: sid,
          reason: reason ?? "",
          guest_name: contact?.guest_name ?? "",
          guest_email: contact?.guest_email ?? "",
          guest_phone: contact?.guest_phone ?? "",
        };
        const client = escalationClient();
        let res;
        try {
          res = await client.post("/ai/escalate", body);
        } catch (primaryError) {
          if (client === publicApi) throw primaryError;
          res = await publicApi.post("/ai/escalate", body);
        }
        const row = res.data?.escalation;
        if (row) setEscalation(row);
        return row as EscalationStatus;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshStatus = useCallback(async (id: number) => {
    try {
      const client = escalationClient();
      let res;
      try {
        res = await client.get(`/ai/escalate/status/${id}`);
      } catch (primaryError) {
        if (client === publicApi) throw primaryError;
        res = await publicApi.get(`/ai/escalate/status/${id}`);
      }
      const row = res.data?.escalation;
      if (row) setEscalation(row);
      return row as EscalationStatus;
    } catch {
      return null;
    }
  }, []);

  return { escalation, loading, requestAgent, refreshStatus, setEscalation };
}
