import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { queryKeys, endpoints } from "../../constants";
import { executeSaleVideoMutation } from "../../services/mutationQueue";

// ---- Video Like/Unlike (idempotent: heart from isLikedByUser, count from server only) ----

const saleVideoStableId = (v: any) =>
  typeof v.ID === "string" ? parseInt(String(v.ID).split("_")[0], 10) : Number(v.ID);

export type LikePropertySaleVideoResponse = {
  videoID: number;
  likesCount: number;
  liked: boolean;
  queued?: boolean;
};

export const useLikePropertySaleVideoMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoID: number): Promise<LikePropertySaleVideoResponse> => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const result = await executeSaleVideoMutation({
        action: "sale_video_like",
        videoID,
        accessToken: user.accessToken,
      });
      return {
        videoID,
        likesCount: result.likesCount ?? 0,
        liked: result.liked ?? true,
        queued: result.queued,
      };
    },
    onMutate: async (videoID: number) => {
      await queryClient.cancelQueries({ queryKey: ["cursorVideoFeed", "sale"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["cursorVideoFeed", "sale"] });
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "sale"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                saleVideoStableId(v) === videoID ? { ...v, liked: true } : v
              )
            }))
          };
        }
      );
      return { previousQueries };
    },
    onError: (_err, _videoID, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data: LikePropertySaleVideoResponse) => {
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "sale"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                saleVideoStableId(v) === data.videoID
                  ? { ...v, likesCount: data.likesCount, liked: data.liked }
                  : v
              )
            }))
          };
        }
      );
      queryClient.invalidateQueries(
        { queryKey: ["cursorVideoFeed", "sale"] },
        { refetchType: "none" }
      );
    }
  });
};

export const useUnlikePropertySaleVideoMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoID: number): Promise<LikePropertySaleVideoResponse> => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const result = await executeSaleVideoMutation({
        action: "sale_video_unlike",
        videoID,
        accessToken: user.accessToken,
      });
      return {
        videoID,
        likesCount: result.likesCount ?? 0,
        liked: result.liked ?? false,
        queued: result.queued,
      };
    },
    onMutate: async (videoID: number) => {
      await queryClient.cancelQueries({ queryKey: ["cursorVideoFeed", "sale"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["cursorVideoFeed", "sale"] });
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "sale"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                saleVideoStableId(v) === videoID ? { ...v, liked: false } : v
              )
            }))
          };
        }
      );
      return { previousQueries };
    },
    onError: (_err, _videoID, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data: LikePropertySaleVideoResponse) => {
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "sale"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                saleVideoStableId(v) === data.videoID
                  ? { ...v, likesCount: data.likesCount, liked: data.liked }
                  : v
              )
            }))
          };
        }
      );
      queryClient.invalidateQueries(
        { queryKey: ["cursorVideoFeed", "sale"] },
        { refetchType: "none" }
      );
    }
  });
};

// ---- Video Save/Unsave ----

export const useSavePropertySaleVideoMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoID: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const result = await executeSaleVideoMutation({
        action: "sale_video_save",
        videoID,
        accessToken: user.accessToken,
      });
      return {
        videoID,
        savesCount: result.savesCount,
        saved: result.saved ?? true,
        queued: result.queued,
      };
    },
    onSuccess: (data) => {
      // CRITICAL: Update query cache directly to maintain feed stability AND persist state
      queryClient.setQueryData(
        ["cursorVideoFeed", "sale", user?.ID],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: page.videos.map((v: any) => {
                const vStableId =
                  typeof v.ID === "string"
                    ? parseInt(v.ID.split("_")[0], 10)
                    : Number(v.ID);
                if (vStableId === data.videoID) {
                  return {
                    ...v,
                    savesCount: data.savesCount ?? (v.savesCount ?? 0) + 1,
                    saved: true
                  };
                }
                return v;
              })
            }))
          };
        }
      );
    }
  });
};

export const useUnsavePropertySaleVideoMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoID: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const result = await executeSaleVideoMutation({
        action: "sale_video_unsave",
        videoID,
        accessToken: user.accessToken,
      });
      return {
        videoID,
        savesCount: result.savesCount,
        saved: result.saved ?? false,
        queued: result.queued,
      };
    },
    onSuccess: (data) => {
      // CRITICAL: Update query cache directly to maintain feed stability AND persist state
      queryClient.setQueryData(
        ["cursorVideoFeed", "sale", user?.ID],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: page.videos.map((v: any) => {
                const vStableId =
                  typeof v.ID === "string"
                    ? parseInt(v.ID.split("_")[0], 10)
                    : Number(v.ID);
                if (vStableId === data.videoID) {
                  return {
                    ...v,
                    savesCount:
                      data.savesCount ?? Math.max(0, (v.savesCount ?? 0) - 1),
                    saved: false
                  };
                }
                return v;
              })
            }))
          };
        }
      );
    }
  });
};

// ---- Comments CRUD ----

export const useCreatePropertySaleVideoCommentMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoID,
      content,
      parentID
    }: {
      videoID: number;
      content: string;
      parentID?: number;
    }) => {
      const response = await axios.post(
        `${endpoints.baseURL}/property-sale-videos/${videoID}/comments`,
        { content, parentID },
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return { ...response.data, videoID };
    },
    onSuccess: (_, variables) => {
      if (variables && variables.videoID != null) {
        // Update cursorVideoFeed cache: increment commentsCount (preserves liked/saved - no refetch)
        queryClient.setQueriesData(
          { queryKey: ["cursorVideoFeed", "sale"] },
          (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                videos: (page.videos || []).map((v: any) => {
                  const vId =
                    typeof v.ID === "string"
                      ? parseInt(String(v.ID).split("_")[0], 10)
                      : Number(v.ID);
                  if (vId === variables.videoID) {
                    return {
                      ...v,
                      commentsCount: (v.commentsCount ?? 0) + 1
                    };
                  }
                  return v;
                })
              }))
            };
          }
        );
        queryClient.invalidateQueries({
          queryKey: ["propertySaleVideoComments", variables.videoID]
        });
      }
    }
  });
};

export const useUpdatePropertySaleVideoCommentMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentID,
      content
    }: {
      commentID: number;
      content: string;
    }) => {
      const response = await axios.put(
        `${endpoints.baseURL}/property-sale-videos/comments/${commentID}`,
        { content },
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return { commentID, ...response.data };
    },
    onSuccess: (_, variables) => {
      if (variables && "commentID" in variables) {
        queryClient.invalidateQueries({
          queryKey: ["propertySaleVideoComments"]
        });
      }
    }
  });
};

export const useDeletePropertySaleVideoCommentMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentID,
      videoID
    }: {
      commentID: number;
      videoID: number;
    }) => {
      await axios.delete(
        `${endpoints.baseURL}/property-sale-videos/comments/${commentID}`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return { commentID, videoID };
    },
    onSuccess: (_, variables) => {
      if (variables && variables.videoID != null) {
        queryClient.invalidateQueries({
          queryKey: ["propertySaleVideoComments", variables.videoID]
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.propertySaleVideoFeed()
      });
    }
  });
};

// ---- Comment Like/Unlike ----

export const useLikePropertySaleVideoCommentMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentID: number) => {
      const response = await axios.post(
        `${endpoints.baseURL}/property-sale-videos/comments/${commentID}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return { commentID, likesCount: response.data?.likesCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["propertySaleVideoComments"]
      });
    }
  });
};

export const useUnlikePropertySaleVideoCommentMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentID: number) => {
      const response = await axios.post(
        `${endpoints.baseURL}/property-sale-videos/comments/${commentID}/unlike`,
        {},
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return { commentID, likesCount: response.data?.likesCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["propertySaleVideoComments"]
      });
    }
  });
};
