import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../constants";
import { Property } from "../../types/property";
import { useUser } from "../useUser";
import { api } from "../../services/api";
import { logApiError } from "../../utils/apiError";

function normalizePropertiesResponse(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }
  if (data && typeof data === "object") {
    const root = data as Record<string, unknown>;
    if (Array.isArray(root.data)) {
      return root.data as Record<string, unknown>[];
    }
    if (Array.isArray(root.properties)) {
      return root.properties as Record<string, unknown>[];
    }
  }
  return [];
}

const fetchProperties = async (userID: number): Promise<Property[]> => {
  const res = await api.get(`/property/userid/${userID}`);
  const raw = normalizePropertiesResponse(res.data);

  return raw.map((p) => {
    let images: string[] = [];
    if (Array.isArray(p.images)) images = p.images as string[];
    else if (typeof p.images === "string" && String(p.images).trim()) {
      try {
        images = JSON.parse(p.images as string);
      } catch {
        images = [];
      }
    }

    let amenities: string[] = [];
    if (Array.isArray(p.amenities)) amenities = p.amenities as string[];
    else if (typeof p.amenities === "string" && String(p.amenities).trim()) {
      try {
        amenities = JSON.parse(p.amenities as string);
      } catch {
        amenities = [];
      }
    }

    const id = Number(p.ID ?? p.id ?? 0);

    return {
      ...p,
      ID: id,
      images,
      amenities,
      status:
        (p.status as string) ??
        (p.isActive === true
          ? "live"
          : p.isActive === false
            ? "pending"
            : undefined),
      hostPrivateNote:
        (p.hostPrivateNote as string) ??
        (p.host_private_note as string) ??
        (p.host_private_notes as string) ??
        "",
      reviewNotes:
        (p.reviewNotes as string) ??
        (p.review_notes as string) ??
        (p.note as string) ??
        "",
    } as Property;
  });
};

export const useMyPropertiesQuery = () => {
  const { user } = useUser();
  const userId = user?.ID;

  return useQuery({
    queryKey: [...queryKeys.myProperties, userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await fetchProperties(userId);
      } catch (e) {
        logApiError("myProperties.fetch", e);
        throw e;
      }
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
    retry: 2,
  });
};
