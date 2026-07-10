import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";

export const useAddPropertySaleToWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertySaleId: number) => {
      console.log("🔍 useAddPropertySaleToWishlistMutation - Adding property sale:", propertySaleId);
      const response = await api.post("/user/wishlist/property-sales", {
        propertySaleID: propertySaleId
      });
      console.log("🔍 useAddPropertySaleToWishlistMutation - Server response:", response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log("🔍 useAddPropertySaleToWishlistMutation - Success, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["savedPropertySales"] });
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] }); // Also invalidate combined saved
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
};

export const useRemovePropertySaleFromWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertySaleId: number) => {
      console.log("🔍 useRemovePropertySaleFromWishlistMutation - Removing property sale:", propertySaleId);
      const response = await api.delete(`/user/wishlist/property-sales/${propertySaleId}`);
      console.log("🔍 useRemovePropertySaleFromWishlistMutation - Server response:", response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log("🔍 useRemovePropertySaleFromWishlistMutation - Success, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["savedPropertySales"] });
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    }
  });
};
