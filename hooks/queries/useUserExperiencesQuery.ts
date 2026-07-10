import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { experienceEndpoints } from "../../constants";
import { useUser } from "../useUser";
import { Experience } from "../../types/experience";

export const useUserExperiencesQuery = () => {
  const { user } = useUser();

  return useQuery<Experience[]>({
    queryKey: ["userExperiences"],
    queryFn: async () => {
      const response = await axios.get(experienceEndpoints.getUserExperiences, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`
        }
      });
      return response.data.experiences;
    },
    enabled: !!user?.accessToken
  });
};
