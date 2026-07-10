import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get(endpoints.notifications);
      return res.data?.notifications ?? [];
    }
    // Removed refetchInterval to prevent infinite API calls
  });
};

export const useMarkNotificationAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await api.patch(
        endpoints.markNotificationRead(notificationId)
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch(endpoints.markAllNotificationsRead);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
};
