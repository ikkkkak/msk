import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";

export const useCancelReservationMutation = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: number) => {
      if (!user?.accessToken) {
        throw new Error("No access token");
      }

      const response = await fetch(
        `${endpoints.baseURL}/apartment/${reservationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel reservation");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user reservations
      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
    }
  });
};
