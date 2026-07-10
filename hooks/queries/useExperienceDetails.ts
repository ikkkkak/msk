import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export const useExperienceDetails = (experienceId: number) => {
  return useQuery({
    queryKey: ["experienceDetails", experienceId],
    queryFn: async () => {
      const res = await api.get(`/experience/${experienceId}`);
      return res.data?.experience || res.data;
    },
    staleTime: 30000,
    enabled: !!experienceId
  });
};
