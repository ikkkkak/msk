import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";

export type PropertyAvailability = {
  date: string; // ISO YYYY-MM-DD
  status: string; // available | blocked | booked | unavailable
};

export function usePropertyAvailability(propertyID: number) {
  const { user } = useUser();
  return useQuery<PropertyAvailability[]>({
    queryKey: ["propertyAvailability", propertyID],
    queryFn: async () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      const qs = `?startDate=${start.toISOString().slice(0, 10)}&endDate=${end
        .toISOString()
        .slice(0, 10)}`;
      const res = await fetch(
        `${endpoints.baseURL}/availability/property/${propertyID}${qs}`,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      if (!res.ok) throw new Error("Failed to fetch availability");
      const json = await res.json();
      // API returns { success, data }; normalize to array
      return json?.data || [];
    },
    enabled: !!propertyID,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000
  } as any);
}
