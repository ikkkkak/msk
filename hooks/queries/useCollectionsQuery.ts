import { useQuery } from "@tanstack/react-query";
import { Collection } from "../../types/collection";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";
import axios from "axios";

export const useCollectionsQuery = () => {
  const { user } = useUser();

  return useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: async () => {
      console.log("Fetching collections for user:", user?.ID);
      const response = await axios.get(endpoints.collections, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      console.log("Collections response:", response.data);
      return response.data.collections;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!user?.accessToken, // Only run query if user is authenticated
    onError: (error) => {
      console.error("Collections query error:", error);
    }
  });
};
