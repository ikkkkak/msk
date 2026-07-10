import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export interface Category {
  id: number;
  type: "property" | "experience";
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string;
  description: {
    en: string;
    fr: string;
    ar: string;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Amenity {
  id: number;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  icon: string;
  category: string;
  description: {
    en: string;
    fr: string;
    ar: string;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AmenityCategory {
  id: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
}

// Hook to fetch property categories (from /api/categories?type=property, categories table)
export const usePropertyCategories = () => {
  return useQuery({
    queryKey: ["categories", "property"],
    queryFn: async (): Promise<Category[]> => {
      try {
        const response = await api.get("/categories?type=property");
        const data = response?.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn(
          "[usePropertyCategories] API failed, returning empty:",
          err
        );
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch experience categories
export const useExperienceCategories = () => {
  return useQuery({
    queryKey: ["categories", "experience"],
    queryFn: async (): Promise<Category[]> => {
      const response = await api.get("/categories?type=experience");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch all amenities (from /api/categories/amenities, amenities table)
export const useAmenities = (category?: string) => {
  return useQuery({
    queryKey: ["amenities", category],
    queryFn: async (): Promise<Amenity[]> => {
      try {
        const url = category
          ? `/categories/amenities?category=${category}`
          : "/categories/amenities";
        const response = await api.get(url);
        const data = response?.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn("[useAmenities] API failed, returning empty:", err);
        return [];
      }
    },
    // Cache amenities globally for 24h – single source of truth
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 25 * 60 * 60 * 1000, // slightly longer than staleTime
  });
};

// Hook to fetch amenity categories
export const useAmenityCategories = () => {
  return useQuery({
    queryKey: ["amenity-categories"],
    queryFn: async (): Promise<AmenityCategory[]> => {
      const response = await api.get("/categories/amenities/categories");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch property-specific categories
export const usePropertyCategoriesById = (propertyId: number) => {
  return useQuery({
    queryKey: ["property-categories", propertyId],
    queryFn: async (): Promise<Category[]> => {
      const response = await api.get(`/categories/property/${propertyId}`);
      return response.data.data;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch property-specific amenities
export const usePropertyAmenitiesById = (propertyId: number) => {
  return useQuery({
    queryKey: ["property-amenities", propertyId],
    queryFn: async (): Promise<Amenity[]> => {
      const response = await api.get(
        `/categories/property/${propertyId}/amenities`
      );
      return response.data.data;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
