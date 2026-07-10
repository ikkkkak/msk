import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useUser } from "../useUser";

export const useSavedLandmarksQuery = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["savedLandmarks"],
    queryFn: async () => {
      const response = await api.get("/user/wishlist/landmarks");
      return response.data?.landmarks ?? response.data ?? [];
    },
    enabled: !!user?.ID && !!user?.accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};
