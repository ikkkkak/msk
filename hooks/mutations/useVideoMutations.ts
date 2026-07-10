import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import {
  CreateVideoInput,
  CreateCommentInput,
  UpdateCommentInput,
  LikeCommentInput
} from "../../types/video";
import { videoEndpoints, queryKeys } from "../../constants";

/** Server like response: count and heart from DB only (idempotent API). */
export type LikeVideoResponse = { videoID: number; likesCount: number; liked: boolean };

export const useCreateVideoMutation = () => {
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: CreateVideoInput) => {
      const res = await axios.post(videoEndpoints.create, input, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      return res.data.video;
    }
  });
};

export const useLikeVideoMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoID: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const res = await axios.post(
        videoEndpoints.like,
        { videoID },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      const likesCount = res.data?.likesCount ?? res.data?.likeCount ?? 0;
      const liked = res.data?.liked ?? res.data?.isLikedByUser ?? true;
      return { videoID, likesCount, liked };
    },
    onMutate: async (videoID: number) => {
      await qc.cancelQueries({ queryKey: ["cursorVideoFeed", "rent"] });
      const previousQueries = qc.getQueriesData({ queryKey: ["cursorVideoFeed", "rent"] });
      const { videoCacheService } = await import("../../services/videoCache");
      await videoCacheService.updateVideoInCache("rent", videoID, { liked: true });
      qc.setQueriesData(
        { queryKey: ["cursorVideoFeed", "rent"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                v.ID === videoID ? { ...v, liked: true } : v
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
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: async (data: LikeVideoResponse) => {
      const { videoCacheService } = await import("../../services/videoCache");
      await videoCacheService.updateVideoInCache("rent", data.videoID, {
        likesCount: data.likesCount,
        liked: data.liked
      });
      qc.setQueriesData(
        { queryKey: ["cursorVideoFeed", "rent"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                v.ID === data.videoID
                  ? { ...v, likesCount: data.likesCount, liked: data.liked }
                  : v
              )
            }))
          };
        }
      );
      qc.invalidateQueries(
        { queryKey: ["cursorVideoFeed", "rent"] },
        { refetchType: "none" }
      );
    }
  });
};

export const useUnlikeVideoMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoID: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const res = await axios.post(
        videoEndpoints.unlike,
        { videoID },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      const likesCount = res.data?.likesCount ?? res.data?.likeCount ?? 0;
      const liked = res.data?.liked ?? res.data?.isLikedByUser ?? false;
      return { videoID, likesCount, liked };
    },
    onMutate: async (videoID: number) => {
      await qc.cancelQueries({ queryKey: ["cursorVideoFeed", "rent"] });
      const previousQueries = qc.getQueriesData({ queryKey: ["cursorVideoFeed", "rent"] });
      const { videoCacheService } = await import("../../services/videoCache");
      await videoCacheService.updateVideoInCache("rent", videoID, { liked: false });
      qc.setQueriesData(
        { queryKey: ["cursorVideoFeed", "rent"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                v.ID === videoID ? { ...v, liked: false } : v
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
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: async (data: LikeVideoResponse) => {
      const { videoCacheService } = await import("../../services/videoCache");
      await videoCacheService.updateVideoInCache("rent", data.videoID, {
        likesCount: data.likesCount,
        liked: data.liked
      });
      qc.setQueriesData(
        { queryKey: ["cursorVideoFeed", "rent"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                v.ID === data.videoID
                  ? { ...v, likesCount: data.likesCount, liked: data.liked }
                  : v
              )
            }))
          };
        }
      );
      qc.invalidateQueries(
        { queryKey: ["cursorVideoFeed", "rent"] },
        { refetchType: "none" }
      );
    }
  });
};

export const useSaveVideoMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoID: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const res = await axios.post(
        videoEndpoints.save,
        { videoID },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      return { videoID, savesCount: res.data?.savesCount, saved: true };
    },
    // CRITICAL: Update query cache directly to maintain feed stability AND persist state
    onSuccess: async (data) => {
      const { videoCacheService } = await import("../../services/videoCache");
      await videoCacheService.updateVideoInCache("rent", data.videoID, {
        savesCount: data.savesCount,
        saved: true // CRITICAL: Set saved to true
      });
      // Update query cache - CRITICAL for persistence across reloads
      qc.setQueryData({ queryKey: ["cursorVideoFeed", "rent", user?.ID] }, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: page.videos.map((v: any) =>
                v.ID === data.videoID
                  ? { ...v, savesCount: data.savesCount, saved: true } // CRITICAL: Set saved to true
                  : v
              )
            }))
          };
        });
      }
  });
};

export const useUnsaveVideoMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoID: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }
      const res = await axios.post(
        videoEndpoints.unsave,
        { videoID },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      return { videoID, savesCount: res.data?.savesCount, saved: false };
    },
    // CRITICAL: Update query cache directly to maintain feed stability AND persist state
    onSuccess: async (data) => {
      const { videoCacheService } = await import("../../services/videoCache");
      await videoCacheService.updateVideoInCache("rent", data.videoID, {
        savesCount: data.savesCount,
        saved: false // CRITICAL: Set saved to false
      });
      // Update query cache - CRITICAL for persistence across reloads
      qc.setQueryData({ queryKey: ["cursorVideoFeed", "rent", user?.ID] }, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: page.videos.map((v: any) =>
                v.ID === data.videoID
                  ? { ...v, savesCount: data.savesCount, saved: false } // CRITICAL: Set saved to false
                  : v
              )
            }))
          };
        });
      }
  });
};

export const useCreateVideoCommentMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const res = await axios.post(videoEndpoints.comment, input, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      return res.data.comment;
    },
    onSuccess: (_, variables) => {
      // Update cursorVideoFeed cache: increment commentsCount (preserves liked/saved - no refetch)
      qc.setQueriesData(
        { queryKey: ["cursorVideoFeed", "rent"] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: (page.videos || []).map((v: any) =>
                Number(v?.ID) === variables.videoID
                  ? { ...v, commentsCount: (v.commentsCount ?? 0) + 1 }
                  : v
              )
            }))
          };
        }
      );
      qc.invalidateQueries({ queryKey: queryKeys.videoComments(variables.videoID) });
    }
  });
};

export const useUpdateVideoCommentMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentID,
      input
    }: {
      commentID: number;
      input: UpdateCommentInput;
    }) => {
      const res = await axios.put(
        videoEndpoints.updateComment(commentID),
        input,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return res.data.comment;
    },
    onSuccess: () => qc.invalidateQueries()
  });
};

export const useDeleteVideoCommentMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentID, videoID }: { commentID: number; videoID: number }) => {
      await axios.delete(videoEndpoints.deleteComment(commentID), {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      return { commentID, videoID };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["videoFeed"] });
      qc.invalidateQueries({ queryKey: queryKeys.videoComments(variables.videoID) });
    }
  });
};

export const useLikeVideoCommentMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LikeCommentInput) => {
      console.log("🔍 useLikeVideoCommentMutation: Starting", {
        commentID: input.commentID,
        hasUser: !!user,
        userID: user?.ID,
        hasAccessToken: !!user?.accessToken
      });

      if (!user?.accessToken) {
        console.error("❌ No access token available");
        throw new Error("Authentication required - please sign in again");
      }

      console.log("📤 Sending like request to:", videoEndpoints.likeComment);
      const res = await axios.post(videoEndpoints.likeComment, input, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });

      console.log("✅ Like successful:", res.data);
      return { commentID: input.commentID, likesCount: res.data?.likesCount };
    },
      onSuccess: (data) => {
        // Update all videoComments queries (we don't know which videoID the comment belongs to)
        qc.setQueriesData({ queryKey: ["videoComments"] }, (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((comment: any) => {
            if (comment.ID === data.commentID) {
              const currentCount =
                typeof comment.likesCount === "number" &&
                !isNaN(comment.likesCount)
                  ? comment.likesCount
                  : 0;
              const newCount =
                data.likesCount !== undefined
                  ? data.likesCount
                  : currentCount + 1;
              return { ...comment, isLiked: true, likesCount: newCount };
            }
            // Also update in replies
            if (comment.replies && Array.isArray(comment.replies)) {
              return {
                ...comment,
                replies: comment.replies.map((reply: any) => {
                  if (reply.ID === data.commentID) {
                    const currentCount =
                      typeof reply.likesCount === "number" &&
                      !isNaN(reply.likesCount)
                        ? reply.likesCount
                        : 0;
                    const newCount =
                      data.likesCount !== undefined
                        ? data.likesCount
                        : currentCount + 1;
                    return { ...reply, isLiked: true, likesCount: newCount };
                  }
                  return reply;
                })
              };
            }
            return comment;
          });
        });
        // Invalidate to ensure consistency with server
        qc.invalidateQueries({ queryKey: ["videoComments"] });
      }
    }
  );
};

export const useUnlikeVideoCommentMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LikeCommentInput) => {
      console.log("🔍 useUnlikeVideoCommentMutation: Starting", {
        commentID: input.commentID,
        hasUser: !!user,
        userID: user?.ID,
        hasAccessToken: !!user?.accessToken
      });

      if (!user?.accessToken) {
        console.error("❌ No access token available");
        throw new Error("Authentication required - please sign in again");
      }

      console.log(
        "📤 Sending unlike request to:",
        videoEndpoints.unlikeComment
      );
      const res = await axios.post(videoEndpoints.unlikeComment, input, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });

      console.log("✅ Unlike successful:", res.data);
      return { commentID: input.commentID, likesCount: res.data?.likesCount };
    },
      onSuccess: (data) => {
        // Update all videoComments queries (we don't know which videoID the comment belongs to)
        qc.setQueriesData({ queryKey: ["videoComments"] }, (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((comment: any) => {
            if (comment.ID === data.commentID) {
              const currentCount =
                typeof comment.likesCount === "number" &&
                !isNaN(comment.likesCount)
                  ? comment.likesCount
                  : 0;
              const newCount =
                data.likesCount !== undefined
                  ? Math.max(0, data.likesCount)
                  : Math.max(0, currentCount - 1);
              return { ...comment, isLiked: false, likesCount: newCount };
            }
            // Also update in replies
            if (comment.replies && Array.isArray(comment.replies)) {
              return {
                ...comment,
                replies: comment.replies.map((reply: any) => {
                  if (reply.ID === data.commentID) {
                    const currentCount =
                      typeof reply.likesCount === "number" &&
                      !isNaN(reply.likesCount)
                        ? reply.likesCount
                        : 0;
                    const newCount =
                      data.likesCount !== undefined
                        ? Math.max(0, data.likesCount)
                        : Math.max(0, currentCount - 1);
                    return { ...reply, isLiked: false, likesCount: newCount };
                  }
                  return reply;
                })
              };
            }
            return comment;
          });
        });
        // Invalidate to ensure consistency with server
        qc.invalidateQueries({ queryKey: ["videoComments"] });
      }
  });
};

export const useDeleteVideoMutation = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoID: number) => {
      const res = await axios.delete(videoEndpoints.deleteVideo(videoID), {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videoFeed"] })
  });
};
