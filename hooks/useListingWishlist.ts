import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../context/ToastContext";
import { useUser } from "./useUser";
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "./mutations/useWishlistMutations";
import {
  useAddPropertySaleToWishlistMutation,
  useRemovePropertySaleFromWishlistMutation,
} from "./mutations/usePropertySaleWishlistMutations";
import {
  useAddLandmarkToWishlistMutation,
  useRemoveLandmarkFromWishlistMutation,
} from "./mutations/useLandmarkWishlistMutations";
import { useSavedPropertySalesQuery } from "./queries/useSavedPropertySalesQuery";
import { useSavedLandmarksQuery } from "./queries/useSavedLandmarksQuery";

export type ListingWishlistKind = "rent" | "sale" | "landmark";

type ToggleResult = {
  success: boolean;
  saved: boolean;
  message?: string;
};

const entityIdFromItem = (item: any): number | undefined => {
  const raw = item?.id ?? item?.ID ?? item?.landmark_id ?? item?.landmarkID;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const toastKey = (kind: ListingWishlistKind, action: "added" | "removed" | "failed") =>
  `listingWishlist.${kind}.${action}`;

/** Saved IDs for a listing kind (lists, map chips). */
export function useListingWishlistIds(kind: ListingWishlistKind) {
  const { user } = useUser();
  const { data: savedSales } = useSavedPropertySalesQuery();
  const { data: savedLandmarks } = useSavedLandmarksQuery();

  return useMemo(() => {
    if (kind === "rent") {
      return new Set((user?.savedProperties ?? []).map(Number));
    }
    if (kind === "sale") {
      const ids = (savedSales ?? [])
        .map((p: any) => entityIdFromItem(p))
        .filter((id): id is number => id != null);
      return new Set(ids);
    }
    const ids = (savedLandmarks ?? [])
      .map((lm: any) => entityIdFromItem(lm))
      .filter((id): id is number => id != null);
    return new Set(ids);
  }, [kind, user?.savedProperties, savedSales, savedLandmarks]);
}

/** Toggle + toast for one listing (cards, detail screens). */
export function useListingWishlist(
  kind: ListingWishlistKind,
  entityId: number | undefined,
  options?: { initialSaved?: boolean; showToast?: boolean },
) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user, setSavedProperties } = useUser();
  const queryClient = useQueryClient();
  const showToastOnSuccess = options?.showToast !== false;

  const addRent = useAddToWishlistMutation();
  const removeRent = useRemoveFromWishlistMutation();
  const addSale = useAddPropertySaleToWishlistMutation();
  const removeSale = useRemovePropertySaleFromWishlistMutation();
  const addLandmark = useAddLandmarkToWishlistMutation();
  const removeLandmark = useRemoveLandmarkFromWishlistMutation();

  const savedIds = useListingWishlistIds(kind);

  const isSaved = useMemo(() => {
    if (!entityId) return false;
    if (savedIds.has(entityId)) return true;
    return options?.initialSaved === true;
  }, [entityId, savedIds, options?.initialSaved]);

  const isPending =
    addRent.isPending ||
    removeRent.isPending ||
    addSale.isPending ||
    removeSale.isPending ||
    addLandmark.isPending ||
    removeLandmark.isPending;

  const notify = useCallback(
    (action: "added" | "removed" | "failed") => {
      if (!showToastOnSuccess && action !== "failed") return;
      const type = action === "failed" ? "error" : "success";
      showToast(t(toastKey(kind, action)), type);
    },
    [kind, showToast, showToastOnSuccess, t],
  );

  const syncRentSaved = useCallback(
    (id: number, saved: boolean) => {
      if (!user) return;
      const current = user.savedProperties ?? [];
      const next = saved
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((x) => x !== id);
      setSavedProperties(next);
    },
    [user, setSavedProperties],
  );

  const toggle = useCallback(async (): Promise<ToggleResult> => {
    if (!entityId) {
      return { success: false, saved: false };
    }
    if (!user) {
      showToast(t("listingWishlist.loginRequired"), "info");
      return { success: false, saved: false, message: "login_required" };
    }

    try {
      if (isSaved) {
        if (kind === "rent") {
          await removeRent.mutateAsync(entityId);
          syncRentSaved(entityId, false);
        } else if (kind === "sale") {
          await removeSale.mutateAsync(entityId);
        } else {
          await removeLandmark.mutateAsync(entityId);
        }
        await queryClient.invalidateQueries({
          queryKey:
            kind === "sale"
              ? ["savedPropertySales"]
              : kind === "landmark"
                ? ["savedLandmarks"]
                : ["savedProperties"],
        });
        notify("removed");
        return { success: true, saved: false };
      }

      if (kind === "rent") {
        await addRent.mutateAsync(entityId);
        syncRentSaved(entityId, true);
      } else if (kind === "sale") {
        await addSale.mutateAsync(entityId);
      } else {
        await addLandmark.mutateAsync(entityId);
      }
      await queryClient.invalidateQueries({
        queryKey:
          kind === "sale"
            ? ["savedPropertySales"]
            : kind === "landmark"
              ? ["savedLandmarks"]
              : ["savedProperties"],
      });
      notify("added");
      return { success: true, saved: true };
    } catch {
      notify("failed");
      return { success: false, saved: isSaved };
    }
  }, [
    entityId,
    user,
    isSaved,
    kind,
    removeRent,
    removeSale,
    removeLandmark,
    addRent,
    addSale,
    addLandmark,
    syncRentSaved,
    queryClient,
    notify,
    showToast,
    t,
  ]);

  const toggleById = useCallback(
    async (id: number): Promise<ToggleResult> => {
      if (!user) {
        showToast(t("listingWishlist.loginRequired"), "info");
        return { success: false, saved: false };
      }
      const saved = savedIds.has(id);
      try {
        if (saved) {
          if (kind === "rent") {
            await removeRent.mutateAsync(id);
            syncRentSaved(id, false);
          } else if (kind === "sale") {
            await removeSale.mutateAsync(id);
          } else {
            await removeLandmark.mutateAsync(id);
          }
          notify("removed");
          return { success: true, saved: false };
        }
        if (kind === "rent") {
          await addRent.mutateAsync(id);
          syncRentSaved(id, true);
        } else if (kind === "sale") {
          await addSale.mutateAsync(id);
        } else {
          await addLandmark.mutateAsync(id);
        }
        notify("added");
        return { success: true, saved: true };
      } catch {
        notify("failed");
        return { success: false, saved };
      }
    },
    [
      user,
      savedIds,
      kind,
      removeRent,
      removeSale,
      removeLandmark,
      addRent,
      addSale,
      addLandmark,
      syncRentSaved,
      notify,
      showToast,
      t,
    ],
  );

  return {
    isSaved,
    toggle,
    toggleById,
    isPending,
    requiresLogin: !user,
  };
}
