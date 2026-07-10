import { useMutation, useQuery } from "@tanstack/react-query";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";

export function useCreateReservation(propertyID: number) {
  const { user } = useUser();
  return useMutation({
    mutationFn: async (payload: {
      checkIn: string;
      checkOut: string;
      numGuests: number;
      note?: string;
    }) => {
      const res = await fetch(
        `${endpoints.baseURL}/apartment/property/${propertyID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.accessToken}`
          },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) throw new Error("Failed to create reservation");
      return res.json();
    }
  });
}

export function usePropertyReservations(propertyID: number) {
  const { user } = useUser();
  return useQuery({
    queryKey: ["reservations", propertyID],
    queryFn: async () => {
      const res = await fetch(
        `${endpoints.baseURL}/apartment/property/${propertyID}`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      if (!res.ok) throw new Error("Failed to fetch reservations");
      return res.json();
    }
  });
}

export function useUpdateReservationStatus() {
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({
      id,
      status
    }: {
      id: number;
      status: "confirmed" | "rejected" | "cancelled";
    }) => {
      const res = await fetch(`${endpoints.baseURL}/apartment/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.accessToken}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update reservation status");
      return res.json();
    }
  });
}
