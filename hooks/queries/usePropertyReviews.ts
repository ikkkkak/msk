import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";

export interface PropertyReview {
  id: number;
  userID: number;
  propertyID: number;
  title: string;
  body: string;
  stars: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatarURL: string;
  };
}

export const usePropertyReviews = (propertyId: number) => {
  const { user } = useUser();
  return useQuery<{
    reviews: PropertyReview[];
    canReview: boolean;
    hasExistingReview: boolean;
    userReservationID: number;
    averageRating: number;
    reviewCount: number;
  }>({
    queryKey: ["property-reviews", propertyId],
    queryFn: async () => {
      const res = await axios.get(
        `${endpoints.baseURL}/reviews/property/${propertyId}`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      const data = res.data?.data || res.data || {};
      return {
        reviews: data.reviews || [],
        canReview: !!data.canReview,
        hasExistingReview: !!data.hasExistingReview,
        userReservationID: data.userReservationID || 0,
        averageRating: data.averageRating || 0,
        reviewCount: data.reviewCount || 0
      };
    },
    enabled: !!propertyId && !!user?.accessToken,
    staleTime: 60_000
  });
};

export const useCreatePropertyReview = (propertyId: number) => {
  const { user } = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      stars: number;
      title?: string;
      body?: string;
      reservationID: number;
    }) => {
      const res = await axios.post(
        `${endpoints.baseURL}/reviews/property/${propertyId}`,
        input,
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      );
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["property-reviews", propertyId] });
    }
  });
};
