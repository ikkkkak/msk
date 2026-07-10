import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useUser } from "./useUser";

// Group Management Hooks
export const useQuitGroup = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      reason
    }: {
      groupId: number;
      reason?: string;
    }) => {
      const res = await api.post(`/groups/${groupId}/quit`, { reason });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
      qc.invalidateQueries({ queryKey: ["groupMembers"] });
    }
  });
};

export const useBlockUserInGroup = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      reason
    }: {
      groupId: number;
      userId: number;
      reason?: string;
    }) => {
      const res = await api.post(`/groups/${groupId}/block/${userId}`, {
        reason
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blockedUsersInGroup"] });
    }
  });
};

export const useUnblockUserInGroup = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId
    }: {
      groupId: number;
      userId: number;
    }) => {
      const res = await api.delete(`/groups/${groupId}/unblock/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blockedUsersInGroup"] });
    }
  });
};

export const useGetBlockedUsersInGroup = (groupId: number) => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["blockedUsersInGroup", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/blocked-users`);
      return res.data?.blocked_users ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken && !!groupId
  });
};

export const useGetGroupQuitHistory = (groupId: number) => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["groupQuitHistory", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/quit-history`);
      return res.data?.quits ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken && !!groupId
  });
};

// Direct Message Management Hooks
export const useSendDirectMessage = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      receiver_id: number;
      content: string;
      type?: string;
      ref_type?: string;
      ref_id?: number;
      reply_to_id?: number; // Support reply to message
    }) => {
      const res = await api.post("/direct-messages", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directMessages"] });
    }
  });
};

export const useGetDirectMessages = (userId: number) => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["directMessages", userId],
    queryFn: async () => {
      const res = await api.get(`/direct-messages/${userId}`);
      return res.data?.messages ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken && !!userId
  });
};

export const useMarkDirectMessageRead = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      const res = await api.post(`/direct-messages/${messageId}/read`, {});
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directMessages"] });
    }
  });
};

// User Blocking for Direct Messages
export const useBlockUser = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason
    }: {
      userId: number;
      reason?: string;
    }) => {
      const res = await api.post(`/user-blocks/${userId}`, { reason });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["directMessages"] });
    }
  });
};

export const useUnblockUser = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.delete(`/user-blocks/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["directMessages"] });
    }
  });
};

export const useGetBlockedUsers = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["blockedUsers"],
    queryFn: async () => {
      const res = await api.get("/user-blocks");
      return res.data?.blocked_users ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken
  });
};
