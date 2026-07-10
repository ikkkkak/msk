import { useQuery } from "@tanstack/react-query";
import { experienceCollectionService } from "../../services/experienceCollectionService";
import { ExperienceCollection } from "../../types/experienceCollection";
import { Experience } from "../../types/experience";
import { useUser } from "../useUser";

interface GetUserCollectionsResponse {
  success: boolean;
  collections: ExperienceCollection[];
}

interface GetCollectionExperiencesResponse {
  success: boolean;
  experiences: Experience[];
}

interface GetUserSavedExperiencesResponse {
  success: boolean;
  experiences: Experience[];
}

export const useUserExperienceCollectionsQuery = () => {
  const { user } = useUser();
  return useQuery<GetUserCollectionsResponse>({
    queryKey: ["userExperienceCollections"],
    queryFn: () =>
      experienceCollectionService.getUserCollections(user?.accessToken || ""),
    enabled: !!user?.accessToken
  });
};

export const useCollectionExperiencesQuery = (collectionId: number) => {
  const { user } = useUser();
  return useQuery<GetCollectionExperiencesResponse>({
    queryKey: ["collectionExperiences", collectionId],
    queryFn: () =>
      experienceCollectionService.getCollectionExperiences(
        collectionId,
        user?.accessToken || ""
      ),
    enabled: !!collectionId && !!user?.accessToken
  });
};

export const useUserSavedExperiencesQuery = () => {
  const { user } = useUser();
  return useQuery<GetUserSavedExperiencesResponse>({
    queryKey: ["userSavedExperiences"],
    queryFn: () =>
      experienceCollectionService.getUserSavedExperiences(
        user?.accessToken || ""
      ),
    enabled: !!user?.accessToken
  });
};
