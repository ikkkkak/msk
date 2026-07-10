import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const useAddToWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: number) => {
      console.log("🔍 useAddToWishlistMutation - Adding property:", propertyId);
      const response = await api.post("/user/wishlist", {
        propertyID: propertyId
      });
      console.log(
        "🔍 useAddToWishlistMutation - Server response:",
        response.data
      );
      return response.data;
    },
    onSuccess: () => {
      console.log(
        "🔍 useAddToWishlistMutation - Success, invalidating queries"
      );
      // Invalidate saved properties query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
};

export const useRemoveFromWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: number) => {
      console.log(
        "🔍 useRemoveFromWishlistMutation - Removing property:",
        propertyId
      );
      const response = await api.delete(`/user/wishlist/${propertyId}`);
      console.log(
        "🔍 useRemoveFromWishlistMutation - Server response:",
        response.data
      );
      return response.data;
    },
    onSuccess: () => {
      console.log(
        "🔍 useRemoveFromWishlistMutation - Success, invalidating queries"
      );
      // Invalidate saved properties query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
};
