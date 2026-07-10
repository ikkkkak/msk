import {
  useMutation,
  useQueryClient,
  MutationFunction,
  UseMutationOptions
} from "@tanstack/react-query";
import { api } from "../../services/api";
import { useUser } from "../useUser";
import { endpoints } from "../../constants";

// Types for mutation params
type ReportVideoInput = {
  videoId: number;
  reason: string;
  description: string;
};

type FlagUserInput = {
  userId: number;
  reason: string;
  description: string;
};

type HideVideoInput = {
  videoId: number;
  reason: string;
};

type VideoFeedSnapshot = { key: unknown; data: unknown };

export const useReportVideoMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reason, description }: ReportVideoInput) => {
      console.log("🚨 REPORTING VIDEO:", {
        videoId,
        reason,
        description,
        userToken: user?.accessToken ? "Present" : "Missing",
        endpoint: `${endpoints.baseURL}/videos/${videoId}/report`
      });

      try {
        const response = await api.post(
          `/videos/${videoId}/report`,
          { reason, description },
          user?.accessToken
            ? { headers: { Authorization: `Bearer ${user.accessToken}` } }
            : undefined
        );

        console.log("✅ VIDEO REPORT SUCCESS:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("❌ VIDEO REPORT ERROR:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method
        });
        throw error;
      }
    },
    onMutate: async (variables: ReportVideoInput) => {
      const { videoId } = variables;
      console.log("⚡ Optimistic remove (report):", videoId);
      await queryClient.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "videoFeed"
      });
      const previousFeeds = queryClient.getQueriesData<unknown>({
        queryKey: ["videoFeed"]
      });
      const snapshots: VideoFeedSnapshot[] = previousFeeds.map(
        ([key, data]) => ({ key, data })
      );
      previousFeeds.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          const next = (data as any[]).filter(
            (v) => (v?.id ?? v?.ID) !== videoId
          );
          queryClient.setQueryData(key, next);
        }
      });
      return { snapshots };
    },
    onError: (
      error: unknown,
      _variables: ReportVideoInput,
      context: { snapshots?: VideoFeedSnapshot[] } | undefined
    ) => {
      console.error("💥 VIDEO REPORT MUTATION ERROR:", error);
      // Rollback
      context?.snapshots?.forEach((s: VideoFeedSnapshot) =>
        queryClient.setQueryData(s.key, s.data)
      );
    },
    onSettled: () => {
      // Invalidate to sync with server (per-user key includes user?.ID)
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "videoFeed"
      });
    }
  });
};

export const useFlagUserMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason, description }: FlagUserInput) => {
      console.log("🚩 FLAGGING USER:", {
        userId,
        reason,
        description,
        userToken: user?.accessToken ? "Present" : "Missing",
        endpoint: `${endpoints.baseURL}/users/${userId}/flag`
      });

      try {
        const response = await api.post(
          `/users/${userId}/flag`,
          { reason, description },
          user?.accessToken
            ? { headers: { Authorization: `Bearer ${user.accessToken}` } }
            : undefined
        );

        console.log("✅ USER FLAG SUCCESS:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("❌ USER FLAG ERROR:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method
        });
        throw error;
      }
    },
    onMutate: async (variables: FlagUserInput) => {
      const { userId } = variables;
      console.log("⚡ Optimistic remove by user (flag):", userId);
      await queryClient.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "videoFeed"
      });
      const previousFeeds = queryClient.getQueriesData<unknown>({
        queryKey: ["videoFeed"]
      });
      const snapshots: VideoFeedSnapshot[] = previousFeeds.map(
        ([key, data]) => ({ key, data })
      );
      previousFeeds.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          const next = (data as any[]).filter(
            (v) => (v?.user_id ?? v?.userID ?? v?.UserID) !== userId
          );
          queryClient.setQueryData(key, next);
        }
      });
      return { snapshots };
    },
    onError: (
      error: unknown,
      _variables: FlagUserInput,
      context: { snapshots?: VideoFeedSnapshot[] } | undefined
    ) => {
      console.error("💥 USER FLAG MUTATION ERROR:", error);
      context?.snapshots?.forEach((s: VideoFeedSnapshot) =>
        queryClient.setQueryData(s.key, s.data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "videoFeed"
      });
    }
  });
};

export const useHideVideoMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, reason }: HideVideoInput) => {
      console.log("👁️ HIDING VIDEO:", {
        videoId,
        reason,
        userToken: user?.accessToken ? "Present" : "Missing",
        endpoint: `${endpoints.baseURL}/videos/${videoId}/hide`
      });

      try {
        const response = await api.post(
          `/videos/${videoId}/hide`,
          { reason },
          user?.accessToken
            ? { headers: { Authorization: `Bearer ${user.accessToken}` } }
            : undefined
        );

        console.log("✅ VIDEO HIDE SUCCESS:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("❌ VIDEO HIDE ERROR:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method
        });
        throw error;
      }
    },
    onMutate: async (variables: HideVideoInput) => {
      const { videoId } = variables;
      console.log("⚡ Optimistic remove (hide):", videoId);
      await queryClient.cancelQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "videoFeed"
      });
      const previousFeeds = queryClient.getQueriesData<unknown>({
        queryKey: ["videoFeed"]
      });
      const snapshots: VideoFeedSnapshot[] = previousFeeds.map(
        ([key, data]) => ({ key, data })
      );
      previousFeeds.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          const next = (data as any[]).filter(
            (v) => (v?.id ?? v?.ID) !== videoId
          );
          queryClient.setQueryData(key, next);
        }
      });
      return { snapshots };
    },
    onError: (
      error: unknown,
      _variables: HideVideoInput,
      context: { snapshots?: VideoFeedSnapshot[] } | undefined
    ) => {
      console.error("💥 VIDEO HIDE MUTATION ERROR:", error);
      context?.snapshots?.forEach((s: VideoFeedSnapshot) =>
        queryClient.setQueryData(s.key, s.data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "videoFeed"
      });
    }
  });
};
