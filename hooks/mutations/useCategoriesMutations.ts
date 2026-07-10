import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';

// Mutation to update property categories
export const useUpdatePropertyCategories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ propertyId, categoryIds }: { propertyId: number; categoryIds: number[] }) => {
      const response = await api.put(`/categories/property/${propertyId}`, {
        category_ids: categoryIds,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch property categories
      queryClient.invalidateQueries({ queryKey: ['property-categories', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
    },
  });
};

// Mutation to update property amenities
export const useUpdatePropertyAmenities = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ propertyId, amenityIds }: { propertyId: number; amenityIds: number[] }) => {
      const response = await api.put(`/categories/property/${propertyId}/amenities`, {
        amenity_ids: amenityIds,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch property amenities
      queryClient.invalidateQueries({ queryKey: ['property-amenities', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
    },
  });
};
