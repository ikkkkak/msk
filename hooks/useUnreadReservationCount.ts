import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useUser } from "./useUser";

export const useUnreadReservationCount = () => {
  const { user } = useUser();
  const isHost = Boolean(user?.ID);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["host-reservations", user?.ID],
    queryFn: () =>
      api.get("/apartment/host/reservations").then((res) => res.data),
    enabled: isHost,
    staleTime: 30 * 1000,
    refetchInterval: isHost ? 30 * 1000 : false,
    refetchOnWindowFocus: isHost,
    retry: false,
  });

  const unreadCount = useMemo(() => {
    if (!reservations || !Array.isArray(reservations)) return 0;

    return reservations.filter(
      (reservation: { status?: string; hostViewed?: boolean }) =>
        reservation.status === "pending" && !reservation.hostViewed,
    ).length;
  }, [reservations]);

  return {
    unreadCount,
    isLoading: isHost && isLoading,
    reservations: isHost ? reservations : [],
  };
};
