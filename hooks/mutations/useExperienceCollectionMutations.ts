import { useMutation, useQueryClient } from "@tanstack/react-query";
import { experienceCollectionService } from "../../services/experienceCollectionService";
import { useUser } from "../useUser";
import {
  CreateExperienceCollectionRequest,
  UpdateExperienceCollectionRequest,
  AddExperienceToCollectionRequest,
  RemoveExperienceFromCollectionRequest,
  RemoveExperienceFromAllCollectionsRequest
} from "../../types/experienceCollection";

export const useCreateExperienceCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (data: CreateExperienceCollectionRequest) => {
      console.log("Mutation: Creating collection with data:", data);
      console.log(
        "Mutation: User access token:",
        user?.accessToken ? "Present" : "Missing"
      );

      try {
        const response = await experienceCollectionService.createCollection(
          data,
          user?.accessToken || ""
        );
        console.log("Mutation: Success response:", response);
        return response;
      } catch (error) {
        console.error("Mutation: Error creating collection:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Mutation: Success callback - invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["userExperienceCollections"] });
    },
    onError: (error) => {
      console.error("Mutation: Error callback:", error);
    }
  });
};

export const useUpdateExperienceCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: number;
      data: UpdateExperienceCollectionRequest;
    }) => {
      const response = await experienceCollectionService.updateCollection(
        id,
        data,
        user?.accessToken || ""
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userExperienceCollections"] });
    }
  });
};

export const useDeleteExperienceCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await experienceCollectionService.deleteCollection(
        id,
        user?.accessToken || ""
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userExperienceCollections"] });
    }
  });
};

export const useAddExperienceToCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (data: AddExperienceToCollectionRequest) => {
      const response =
        await experienceCollectionService.addExperienceToCollection(
          data,
          user?.accessToken || ""
        );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userExperienceCollections"] });
      queryClient.invalidateQueries({
        queryKey: ["collectionExperiences", variables.collectionID]
      });
      queryClient.invalidateQueries({ queryKey: ["userSavedExperiences"] });
      queryClient.invalidateQueries({ queryKey: ["publicExperiences"] });
    }
  });
};

export const useRemoveExperienceFromCollectionMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (data: RemoveExperienceFromCollectionRequest) => {
      const response =
        await experienceCollectionService.removeExperienceFromCollection(
          data,
          user?.accessToken || ""
        );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userExperienceCollections"] });
      queryClient.invalidateQueries({
        queryKey: ["collectionExperiences", variables.collectionID]
      });
      queryClient.invalidateQueries({ queryKey: ["userSavedExperiences"] });
      queryClient.invalidateQueries({ queryKey: ["publicExperiences"] });
    }
  });
};

export const useRemoveExperienceFromAllCollectionsMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (data: RemoveExperienceFromAllCollectionsRequest) => {
      const response =
        await experienceCollectionService.removeExperienceFromAllCollections(
          data,
          user?.accessToken || ""
        );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userExperienceCollections"] });
      queryClient.invalidateQueries({ queryKey: ["userSavedExperiences"] });
      queryClient.invalidateQueries({ queryKey: ["publicExperiences"] });
    }
  });
};
