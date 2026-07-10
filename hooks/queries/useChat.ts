import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { groupEndpoints } from "../../constants";

export const useGroupMessages = (groupId: number) => {
  return useQuery({
    queryKey: ["groupMessages", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.listMessages(groupId));
      return res.data?.messages ?? [];
    }
    // Removed refetchInterval to prevent infinite API calls
  });
};

export const useSendMessage = (groupId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      content: string;
      color?: string;
      ttlSec?: number;
    }) => {
      const res = await api.post(groupEndpoints.sendMessage(groupId), data);
      return res.data?.message;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    }
  });
};

export const useTyping = (groupId: number) => {
  const touch = async () => {
    try {
      await api.post(groupEndpoints.typing(groupId), {});
    } catch {}
  };
  const { data } = useQuery({
    queryKey: ["typing", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.typing(groupId));
      return res.data?.typing ?? [];
    }
    // Removed refetchInterval to prevent infinite API calls
  });
  return { typing: data || [], touch };
};

export const useGroupWishlist = (groupId: number) => {
  return useQuery({
    queryKey: ["groupWishlist", groupId],
    queryFn: async () => {
      const res = await api.get(groupEndpoints.wishlist(groupId));
      return res.data?.items ?? [];
    }
    // Removed refetchInterval to prevent infinite API calls
  });
};

export const useAddToWishlist = (groupId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { experienceID: number }) => {
      const res = await api.post(groupEndpoints.wishlist(groupId), data);
      return res.data?.item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupWishlist", groupId] });
      qc.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    }
  });
};

export const useLikeWishlistItem = (groupId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wishlistID: number) => {
      await api.post(groupEndpoints.wishlistLike(groupId, wishlistID), {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupWishlist", groupId] });
    }
  });
};

export const useSharePropertyToGroup = (groupId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (propertyID: number) => {
      const res = await api.post(groupEndpoints.shareProperty(groupId), {
        propertyID
      });
      return res.data?.message;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMessages", groupId] });
    }
  });
};
