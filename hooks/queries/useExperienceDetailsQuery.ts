import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { experienceEndpoints } from "../../constants";
import { useUser } from "../useUser";
import { Experience } from "../../types/experience";

export const useExperienceDetailsQuery = (experienceId: number) => {
  const { user } = useUser();

  return useQuery<Experience>({
    queryKey: ["experienceDetails", experienceId],
    queryFn: async () => {
      const response = await axios.get(
        experienceEndpoints.details(experienceId),
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      );
      return response.data.experience;
    },
    enabled: !!user?.accessToken && !!experienceId
  });
};
