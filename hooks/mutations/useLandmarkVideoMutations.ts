import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

/**
 * Landmark video like/save mutations.
 * Idempotent: heart from isLikedByUser, count from server only.
 */

export type LikeLandmarkVideoResponse = {
  landmarkID: number;
  likesCount: number;
  liked: boolean;
};

const landmarkVideoId = (v: any) => Number((v as any).ID ?? (v as any).landmarkID);

export const useLikeLandmarkVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landmarkID: number): Promise<LikeLandmarkVideoResponse> => {
      const response = await api.post(`/landmarks/${landmarkID}/like`, {});
      const likesCount = response.data?.likesCount ?? response.data?.likeCount ?? 0;
      const liked = response.data?.liked ?? response.data?.isLikedByUser ?? true;
      return { landmarkID, likesCount, liked };
    },
    onMutate: async (landmarkID: number) => {
      await queryClient.cancelQueries({ queryKey: ["cursorVideoFeed", "landmarks"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["cursorVideoFeed", "landmarks"] });
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "landmarks"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                landmarkVideoId(v) === landmarkID ? { ...v, liked: true } : v
              )
            }))
          };
        }
      );
      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data: LikeLandmarkVideoResponse) => {
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "landmarks"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                landmarkVideoId(v) === data.landmarkID
                  ? { ...v, likesCount: data.likesCount, liked: data.liked }
                  : v
              )
            }))
          };
        }
      );
    }
  });
};

export const useUnlikeLandmarkVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landmarkID: number): Promise<LikeLandmarkVideoResponse> => {
      const response = await api.post(`/landmarks/${landmarkID}/unlike`, {});
      const likesCount = response.data?.likesCount ?? response.data?.likeCount ?? 0;
      const liked = response.data?.liked ?? response.data?.isLikedByUser ?? false;
      return { landmarkID, likesCount, liked };
    },
    onMutate: async (landmarkID: number) => {
      await queryClient.cancelQueries({ queryKey: ["cursorVideoFeed", "landmarks"] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["cursorVideoFeed", "landmarks"] });
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "landmarks"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                landmarkVideoId(v) === landmarkID ? { ...v, liked: false } : v
              )
            }))
          };
        }
      );
      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data: LikeLandmarkVideoResponse) => {
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "landmarks"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                landmarkVideoId(v) === data.landmarkID
                  ? { ...v, likesCount: data.likesCount, liked: data.liked }
                  : v
              )
            }))
          };
        }
      );
    }
  });
};

export const useSaveLandmarkVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landmarkID: number) => {
      const response = await api.post(`/landmarks/${landmarkID}/save`, {});
      return {
        landmarkID,
        savesCount: response.data?.savesCount,
        saved: true
      };
    },
    onSuccess: (data) => {
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "landmarks"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) => {
                const vId = Number((v as any).ID ?? (v as any).landmarkID);
                if (vId === data.landmarkID) {
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

export const useUnsaveLandmarkVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landmarkID: number) => {
      const response = await api.post(`/landmarks/${landmarkID}/unsave`, {});
      return {
        landmarkID,
        savesCount: response.data?.savesCount,
        saved: false
      };
    },
    onSuccess: (data) => {
      queryClient.setQueriesData(
        { queryKey: ["cursorVideoFeed", "landmarks"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) => {
                const vId = Number((v as any).ID ?? (v as any).landmarkID);
                if (vId === data.landmarkID) {
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
