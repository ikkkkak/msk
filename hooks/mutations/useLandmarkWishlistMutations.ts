import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const useAddLandmarkToWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landmarkID: number) => {
      const response = await api.post(`/landmarks/${landmarkID}/save`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedLandmarks"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useRemoveLandmarkFromWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (landmarkID: number) => {
      const response = await api.post(`/landmarks/${landmarkID}/unsave`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedLandmarks"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};
