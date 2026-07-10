import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export interface AINotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  relevance_score: number;
  action_type?: string;
  action_payload?: Record<string, unknown>;
  status: string;
  created_at: string;
}

export function useAINotifications(limit = 20) {
  const [items, setItems] = useState<AINotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/ai/notifications", { params: { limit } });
      setItems(res.data?.notifications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const markRead = useCallback(async (id: number) => {
    await api.post(`/ai/notifications/${id}/read`);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)),
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh, markRead };
}
