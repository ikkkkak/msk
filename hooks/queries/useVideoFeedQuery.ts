import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { Video } from "../../types/video";
import { queryKeys, videoEndpoints, VideoFilters } from "../../constants";

export const useVideoFeedQuery = (
  page: number = 1,
  limit: number = 10,
  filters?: VideoFilters
) => {
  const { user } = useUser();
  return useQuery<Video[]>({
    queryKey: [...queryKeys.videoFeed(page), filters, user?.ID],
    queryFn: async () => {
      // Video feed now requires auth to filter hidden videos and flagged users
      console.log(
        "🔍 Fetching video feed for user:",
        user?.ID,
        "with token:",
        user?.accessToken ? "Present" : "Missing"
      );
      const res = await axios.get(videoEndpoints.feed(page, limit, filters), {
        headers: user?.accessToken
          ? { Authorization: `Bearer ${user.accessToken}` }
          : {}
      });
      console.log(
        "📹 Received videos:",
        res.data.videos?.length || 0,
        "videos"
      );
      return res.data.videos as Video[];
    },
    enabled: true, // optional auth; key includes user?.ID for per-user cache
    staleTime: 10 * 1000, // Reduced to 10 seconds for fresher content
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes (formerly cacheTime)
    placeholderData: (previousData) => previousData, // keepPreviousData equivalent
    refetchOnMount: true, // Always refetch when component mounts to get fresh videos
    refetchOnWindowFocus: true // Refetch when app comes to foreground
  });
};

export const useLikedVideosQuery = () => {
  const { user } = useUser();
  return useQuery<Video[]>({
    queryKey: ["likedVideos"],
    queryFn: async () => {
      const res = await axios.get(videoEndpoints.liked, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      return res.data.videos as Video[];
    },
    enabled: !!user?.accessToken,
    staleTime: 30 * 1000
  });
};

export const useSavedVideosQuery = () => {
  const { user } = useUser();
  return useQuery<Video[]>({
    queryKey: ["savedVideos"],
    queryFn: async () => {
      const res = await axios.get(videoEndpoints.saved, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      return res.data.videos as Video[];
    },
    enabled: !!user?.accessToken,
    staleTime: 30 * 1000
  });
};
