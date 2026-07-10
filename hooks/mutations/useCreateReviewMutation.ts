import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";

interface CreateReviewRequest {
  propertyId: number;
  reservationId: number;
  stars: number;
  title: string;
  body: string;
}

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const response = await api.post(endpoints.createReview(data.propertyId), {
        stars: data.stars,
        title: data.title,
        body: data.body,
        reservationID: data.reservationId
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create review");
      }

      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch property reviews
      queryClient.invalidateQueries({
        queryKey: ["property-reviews", variables.propertyId]
      });

      // Invalidate property details to update rating
      queryClient.invalidateQueries({
        queryKey: ["propertyDetails", variables.propertyId]
      });
    }
  });
};
