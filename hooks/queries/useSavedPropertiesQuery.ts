import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useUser } from "../useUser";

export const useSavedPropertiesQuery = () => {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ["savedProperties"],
    queryFn: async () => {
      const response = await api.get("/user/wishlist");
      const properties = response.data.properties || [];
      return properties;
    },
    enabled: !!user?.ID && !!user?.accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};
