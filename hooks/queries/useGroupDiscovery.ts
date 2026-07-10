import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { groupEndpoints } from "../../constants";

export const useDiscoverGroups = () => {
  return useMutation({
    mutationFn: async (filters: {
      privacy?: "public" | "private" | "all";
      location?: string;
      interests?: string;
      limit?: number;
      offset?: number;
    }) => {
      const res = await api.post(groupEndpoints.discoverGroups(), filters);
      return res.data;
    }
  });
};

export const useRequestJoinGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { groupID: number; message?: string }) => {
      const res = await api.post(groupEndpoints.requestJoinGroup(), data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myJoinRequests"] });
    }
  });
};

export const useMyJoinRequests = () => {
  return useQuery({
    queryKey: ["myJoinRequests"],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.myJoinRequests());
      return res.data?.requests ?? [];
    }
    // Removed refetchInterval to prevent infinite API calls
  });
};

export const useGroupJoinRequests = (groupId: number) => {
  return useQuery({
    queryKey: ["groupJoinRequests", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.groupJoinRequests(groupId));
      return res.data?.requests ?? [];
    }
    // Removed refetchInterval to prevent infinite API calls
  });
};

export const useRespondToJoinRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      action
    }: {
      requestId: number;
      action: "accept" | "decline";
    }) => {
      const res = await api.post(
        groupEndpoints.respondToJoinRequest(requestId),
        { action }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupJoinRequests"] });
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    }
  });
};
