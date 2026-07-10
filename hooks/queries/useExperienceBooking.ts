import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { experienceBookingEndpoints } from "../../constants";
import { useUser } from "../useUser";

interface ExperienceBookingRequest {
  experienceId: number;
  groupId: number;
  participantCount: number;
  selectedDate: string;
  selectedTime?: string;
  notes?: string;
  userId: number;
}

interface ExperienceBooking {
  id: number;
  experienceId: number;
  groupId: number;
  participantCount: number;
  selectedDate: string;
  selectedTime?: string;
  notes?: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  experience: any;
  group: any;
}

interface BookingResponse {
  success: boolean;
  message: string;
  data: ExperienceBooking;
}

export const useCreateExperienceBooking = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation<BookingResponse, Error, ExperienceBookingRequest>({
    mutationFn: async (bookingData: ExperienceBookingRequest) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }

      const response = await axios.post(
        experienceBookingEndpoints.createBooking,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user-experience-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["experience-details"] });
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });

        console.log("Booking created successfully:", data);
      },
      onError: (error) => {
        console.error("Booking creation failed:", error);
      }
  });
};

export const useGetUserBookings = () => {
  const { user } = useUser();

  return useQuery<ExperienceBooking[], Error>({
    queryKey: ["user-experience-bookings"],
    queryFn: async () => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(
        experienceBookingEndpoints.getUserBookings,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        }
      );

      return response.data.data || [];
    },
    enabled: !!user?.accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    retry: 2
  });
};

export const useCancelExperienceBooking = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, number>({
    mutationFn: async (bookingId: number) => {
      if (!user?.accessToken) {
        throw new Error("Authentication required");
      }

      const response = await axios.delete(
        experienceBookingEndpoints.cancelBooking(bookingId),
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        }
      );

      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["user-experience-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["experience-details"] });

        console.log("Booking cancelled successfully");
      },
      onError: (error) => {
        console.error("Booking cancellation failed:", error);
      }
  });
};
