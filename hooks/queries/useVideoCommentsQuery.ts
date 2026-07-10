import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { VideoComment } from "../../types/video";
import { videoEndpoints, queryKeys } from "../../constants";

export const useVideoCommentsQuery = (videoID: number) => {
  const { user } = useUser();
  return useQuery({
    queryKey: queryKeys.videoComments(videoID),
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.accessToken) {
        headers.Authorization = `Bearer ${user.accessToken}`;
      }

      const res = await axios.get(videoEndpoints.getComments(videoID), {
        headers,
      });
      return res.data.comments as VideoComment[];
    },
    enabled: !!videoID,
    staleTime: 30 * 1000,
  });
};
