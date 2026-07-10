import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../../services/api";
import {
  experienceInviteEndpoints,
  groupEndpoints,
  availabilityEndpoints,
  directMessageEndpoints,
  userBlockEndpoints,
  queryKeys
} from "../../constants";
import { useUser } from "../useUser";
import { fetchDirectMessageThread } from "../../services/messagingThreadPrefetch";

export const useCreateExperienceInvites = (experienceId: number) => {
  const { user } = useUser();
  return useMutation({
    mutationFn: async (payload: {
      inviteeUserIDs: number[];
      createLink?: boolean;
      expiresInHours?: number;
    }) => {
      const res = await api.post(
        experienceInviteEndpoints.createInvites(experienceId),
        payload
      );
      return res.data;
    }
  });
};

export const useListInvites = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ["experienceInvites"],
    queryFn: async () => {
      const res = await api.get(experienceInviteEndpoints.listInvites());
      const invites = res.data?.invites ?? [];
      // eslint-disable-next-line no-console
      console.log(`[INVITES] fetched ${invites.length}`);
      return invites;
    },
    staleTime: 30000,
    enabled: !!user?.accessToken
    // Removed refetchInterval to prevent infinite API calls
  });
};

export const useAcceptInvite = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: number) => {
      const res = await api.post(
        experienceInviteEndpoints.acceptInvite(inviteId),
        {}
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experienceInvites"] });
    }
  });
};

export const useDeclineInvite = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: number) => {
      const res = await api.post(
        experienceInviteEndpoints.declineInvite(inviteId),
        {}
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experienceInvites"] });
    }
  });
};

export const useCancelInvite = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: number) => {
      const res = await api.post(
        experienceInviteEndpoints.cancelInvite(inviteId),
        {}
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["experienceInvites"] });
    }
  });
};

export const useExperienceParticipants = (experienceId: number) => {
  return useQuery({
    queryKey: ["experienceParticipants", experienceId],
    queryFn: async () => {
      const res = await api.get(
        experienceInviteEndpoints.listParticipants(experienceId)
      );
      return res.data?.participants ?? [];
    },
    enabled: !!experienceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });
};

export const useRemoveParticipant = (experienceId: number) => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.post(
        `${experienceInviteEndpoints.listParticipants(
          experienceId
        )}/${userId}/remove`.replace("/participants", "/participants"),
        {}
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["experienceParticipants", experienceId]
      });
    }
  });
};

// Groups: create/open, my groups, members, finalize
export const useCreateOrOpenGroup = (experienceId: number) => {
  const { user } = useUser();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      expiresInHr?: number;
      privacy?: "public" | "private";
    }) => {
      const res = await api.post(
        groupEndpoints.createOrOpen(experienceId),
        payload
      );
      return res.data?.group;
    }
  });
};

export const useMyGroups = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ["myGroups"],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.myGroups());
      return res.data?.groups ?? [];
    },
    enabled: !!user?.accessToken,
    // REMOVED: refetchInterval - was causing excessive API calls
    // Use socket events or manual refetch instead
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    placeholderData: (previousData) => previousData || [], // Keep previous data
    retry: 1, // Only retry once
  });
};

export const useMarkGroupAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number) => {
      const res = await api.post(groupEndpoints.markAsRead(groupId), {});
      return res.data;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    }
  });
};

export const useGroupMembers = (groupId: number) => {
  return useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.members(groupId));
      return res.data?.members ?? [];
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0 // Don't cache
  });
};

export const useFinalizeGroup = (groupId: number) => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(groupEndpoints.finalize(groupId), {});
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    }
  });
};

// Update group (owner-only)
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      data
    }: {
      groupId: number;
      data: {
        name?: string;
        status?: string;
        expiresInHr?: number;
        photoURL?: string;
        privacy?: "public" | "private";
      };
    }) => {
      const res = await api.put(groupEndpoints.update(groupId), data);
      return res.data?.group;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
    }
  });
};

// Delete group (owner-only)
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number) => {
      const res = await api.delete(groupEndpoints.delete(groupId));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    }
  });
};

// Update member role (owner-only)
export const useUpdateMemberRole = (groupId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      role
    }: {
      memberId: number;
      role: string;
    }) => {
      const res = await api.post(
        groupEndpoints.updateMemberRole(groupId, memberId),
        { role }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers", groupId] });
    }
  });
};

// Remove member (owner-only)
export const useRemoveMember = (groupId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: number) => {
      const res = await api.post(
        groupEndpoints.removeMember(groupId, memberId),
        {}
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    }
  });
};

// Availability hooks
export const useListAvailability = (experienceId: number) => {
  return useQuery({
    queryKey: ["availability", experienceId],
    queryFn: async () => {
      const res = await api.get(
        availabilityEndpoints.listAvailability(experienceId)
      );
      return res.data?.availability ?? [];
    },
    staleTime: 30000
  });
};

export const useSetAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      experienceId,
      dates,
      status
    }: {
      experienceId: number;
      dates: string[];
      status: "available" | "blocked";
    }) => {
      const res = await api.post(
        availabilityEndpoints.setAvailability(experienceId),
        { dates, status }
      );
      return res.data;
    },
    onSuccess: (_, { experienceId }) => {
      queryClient.invalidateQueries({ queryKey: ["availability", experienceId] });
    }
  });
};

// Group quit functionality
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
      const url = groupEndpoints.quitGroup(groupId);
      const fullUrl = `${api.defaults.baseURL}${url}`;
      console.log("🔍 QUIT GROUP DEBUG:");
      console.log("Group ID:", groupId);
      console.log("Endpoint:", url);
      console.log("Full URL:", fullUrl);
      console.log("Request payload:", { reason });
      console.log(
        "Auth token:",
        api.defaults.headers.Authorization ? "Present" : "Missing"
      );
      console.log("API base URL:", api.defaults.baseURL);
      console.log("API headers:", api.defaults.headers);

      try {
        const res = await api.post(url, { reason });
        console.log("✅ Quit group success:", res.data);
        return res.data;
      } catch (error) {
        console.error("❌ Quit group error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
      qc.invalidateQueries({ queryKey: ["groupMembers"] });
    }
  });
};

// Group user blocking functionality
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
      const res = await api.post(
        groupEndpoints.blockUserInGroup(groupId, userId),
        { reason }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers"] });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
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
      const res = await api.delete(
        groupEndpoints.unblockUserInGroup(groupId, userId)
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers"] });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
    }
  });
};

// Get group quit history
export const useGroupQuitHistory = (groupId: number) => {
  const { user } = useUser();
  return useQuery({
    queryKey: ["groupQuitHistory", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.getGroupQuitHistory(groupId));
      return res.data?.quits ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken && !!groupId
  });
};

// Get blocked users in group
export const useBlockedUsersInGroup = (groupId: number) => {
  const { user } = useUser();
  return useQuery({
    queryKey: ["blockedUsers", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.getBlockedUsersInGroup(groupId));
      return res.data?.blocked_users ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken && !!groupId
  });
};

// Direct Message functionality
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
      const res = await api.post(directMessageEndpoints.sendMessage(), payload);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate both direct messages and conversations list
      qc.invalidateQueries({ queryKey: ["directMessages"] });
      qc.invalidateQueries({ queryKey: ["directMessageConversations"] });
      // Also invalidate conversations query to refresh the list
      qc.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
};

export const useGetDirectMessages = (userId: number) => {
  const { user } = useUser();
  return useQuery({
    queryKey: ["directMessages", userId],
    queryFn: () => fetchDirectMessageThread(userId),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    enabled: !!user?.accessToken && !!userId,
    placeholderData: (previous) => previous,
    refetchOnMount: true,
  });
};

export const useMarkDirectMessageRead = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: number) => {
      const res = await api.post(
        directMessageEndpoints.markAsRead(messageId),
        {}
      );
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
      const res = await api.post(userBlockEndpoints.blockUser(userId), {
        reason
      });
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
      const res = await api.delete(userBlockEndpoints.unblockUser(userId));
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
      const res = await api.get(userBlockEndpoints.getBlockedUsers());
      return res.data?.blocked_users ?? [];
    },
    staleTime: 30000,
    enabled: !!user?.accessToken
  });
};
