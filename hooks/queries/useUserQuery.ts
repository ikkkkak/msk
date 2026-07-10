import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "../useUser";
import { endpoints } from "../../constants";

export const useUserQuery = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["user", user?.ID],
    queryFn: async () => {
      if (!user?.ID || !user?.accessToken) {
        throw new Error("User not authenticated");
      }

      const response = await axios.get(`${endpoints.getUser(user.ID)}`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`
        }
      });
      const data = response.data;
      // Normalize languages field to array
      if (data?.languages && typeof data.languages === "string") {
        try {
          data.languages = JSON.parse(data.languages);
        } catch {}
      }
      return data;
    },
    enabled: !!user?.ID && !!user?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  });
};
