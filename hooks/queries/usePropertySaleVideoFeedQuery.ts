import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { PropertySaleVideo } from "../../types/propertySaleVideo";
import { queryKeys, endpoints } from "../../constants";

export const usePropertySaleVideoFeedQuery = (
  page: number = 1,
  limit: number = 10
) => {
  const { user } = useUser();
  return useQuery<PropertySaleVideo[]>({
    queryKey: [...queryKeys.propertySaleVideoFeed(page), user?.ID],
    queryFn: async () => {
      // Property sale video feed requires auth to filter hidden videos and flagged users
      console.log(
        "🔍 Fetching property sale video feed for user:",
        user?.ID,
        "with token:",
        user?.accessToken ? "Present" : "Missing"
      );
      const res = await axios.get(
        `${endpoints.baseURL}/property-sale-videos/feed?page=${page}&limit=${limit}`,
        {
          headers: user?.accessToken
            ? { Authorization: `Bearer ${user.accessToken}` }
            : {}
        }
      );
      console.log(
        "📹 Received property sale videos:",
        res.data.videos?.length || 0,
        "videos"
      );
      return res.data.videos as PropertySaleVideo[];
    },
    enabled: true, // optional auth; key includes user?.ID for per-user cache
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData // keepPreviousData equivalent
  });
};

export const useLikedPropertySaleVideosQuery = () => {
  const { user } = useUser();
  return useQuery<PropertySaleVideo[]>({
    queryKey: ["likedPropertySaleVideos"],
    queryFn: async () => {
      const res = await axios.get(
        `${endpoints.baseURL}/property-sale-videos/liked`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return res.data.videos as PropertySaleVideo[];
    },
    enabled: false,
    staleTime: 30 * 1000 // Disabled until endpoint is created
  });
};

export const useSavedPropertySaleVideosQuery = () => {
  const { user } = useUser();
  return useQuery<PropertySaleVideo[]>({
    queryKey: ["savedPropertySaleVideos"],
    queryFn: async () => {
      const res = await axios.get(
        `${endpoints.baseURL}/property-sale-videos/saved`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      return res.data.videos as PropertySaleVideo[];
    },
    enabled: false,
    staleTime: 30 * 1000 // Disabled until endpoint is created
  });
};
