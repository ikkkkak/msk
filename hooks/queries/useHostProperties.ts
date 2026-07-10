import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { endpoints } from "../../constants";
import { useUser } from "../useUser";
import { getAppLanguage } from "../../utils/translation";

export const useHostProperties = (
  hostId: number | undefined,
  excludePropertyId?: number,
  byPropertyId?: number
) => {
  const { user } = useUser();

  return useQuery({
    queryKey: ["hostProperties", hostId, excludePropertyId, byPropertyId],
    queryFn: async () => {
      const lang = getAppLanguage();
      // Prefer server-side resolution by propertyId when provided
      if (byPropertyId) {
        const baseUrl = endpoints.getHostPropertiesByPropertyID(
          byPropertyId,
          excludePropertyId
        );
        const url = baseUrl.includes("?")
          ? `${baseUrl}&lang=${lang}`
          : `${baseUrl}?lang=${lang}`;
        const response = await api.get(url, {
          headers: user?.accessToken
            ? { Authorization: `Bearer ${user.accessToken}` }
            : {}
        });
        return response.data || [];
      }

      if (!hostId) {
        return [];
      }

      let url = `${endpoints.getPropertiesByUserID}${hostId}`;
      const separator = excludePropertyId ? "&" : "?";
      if (excludePropertyId) {
        url += `?exclude=${excludePropertyId}${separator}lang=${lang}`;
      } else {
        url += `?lang=${lang}`;
      }

      const response = await api.get(url, {
        headers: user?.accessToken
          ? {
              Authorization: `Bearer ${user.accessToken}`
            }
          : {}
      });

      return response.data || [];
    },
    enabled: !!hostId || !!byPropertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
};
