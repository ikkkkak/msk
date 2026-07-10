import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { endpoints } from "../../constants";
import { PropertySaleVideoComment } from "../../types/propertySaleVideo";

export const usePropertySaleVideoCommentsQuery = (videoID: number) => {
  const { user } = useUser();

  return useQuery<PropertySaleVideoComment[]>({
    queryKey: ["propertySaleVideoComments", videoID],
    queryFn: async () => {
      const headers: { Authorization?: string } = {};
      if (user?.accessToken) {
        headers.Authorization = `Bearer ${user.accessToken}`;
      }

      const response = await axios.get(
        `${endpoints.baseURL}/property-sale-videos/${videoID}/comments`,
        { headers }
      );

      return response.data?.comments || [];
    },
    enabled: !!videoID && videoID > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes (cacheTime renamed to gcTime in v5)
  });
};
