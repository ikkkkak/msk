import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../../constants";
import { Experience } from "../../types/experience";

interface PublicExperiencesResponse {
  experiences: Experience[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsePublicExperiencesOptions {
  page?: number;
  limit?: number;
  city?: string;
  enabled?: boolean;
}

export const usePublicExperiencesQuery = (
  options: UsePublicExperiencesOptions = {}
) => {
  const { page = 1, limit = 10, city, enabled = true } = options;

  return useQuery<PublicExperiencesResponse>({
    queryKey: ["publicExperiences", page, limit, city],
    queryFn: async () => {
      const response = await axios.get(
        endpoints.publicExperiences(page, limit, city)
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
