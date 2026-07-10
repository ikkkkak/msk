import { useListingWishlist } from "./useListingWishlist";

/**
 * Property sale favorites — backed by unified listing wishlist (server + cache).
 */
export const usePropertySaleFavorite = (
  propertySaleId: number | undefined,
  options?: { showToast?: boolean },
) => {
  const { isSaved, toggle, isPending, requiresLogin } = useListingWishlist(
    "sale",
    propertySaleId,
    { showToast: options?.showToast },
  );

  const toggleFavorite = async () => {
    const result = await toggle();
    return {
      success: result.success,
      isFavorite: result.saved,
      message: result.success
        ? result.saved
          ? "added"
          : "removed"
        : "failed",
    };
  };

  return {
    isFavorite: isSaved,
    toggleFavorite,
    isLoading: isPending,
    requiresLogin,
  };
};
