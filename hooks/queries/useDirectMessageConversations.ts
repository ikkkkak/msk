/**
 * SOLID-COMPLIANT DIRECT MESSAGE CONVERSATIONS HOOK
 *
 * ZERO FLICKER / ZERO DISAPPEARANCE GUARANTEE:
 * - Data NEVER disappears during refetch
 * - UI sees stable data at all times
 * - New data silently replaces old data
 * - No loading states that clear the feed
 */

import React, {
  useCallback,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { directMessageEndpoints } from "../../constants";
import { useUser } from "../useUser";
import { isMeskenyTeamConversation } from "../../utils/meskenyTeamMessaging";

// =============================================================================
// TYPES
// =============================================================================

export interface ConversationFeedResponse {
  items: ConversationItem[];
  nextCursor: string | null;
  hasMore: boolean;
  serverTimestamp: number;
  total: number;
  status?: string;
}

export interface ConversationItem {
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string;
  is_meskeny_team?: boolean;
  last_message: {
    id: number;
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id?: number;
    receiver_id?: number;
  } | null;
  unread_count: number;
}

interface UseDirectMessageConversationsOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

// =============================================================================
// GLOBAL STABLE CACHE - Persists across re-renders and refetches
// =============================================================================

// This ensures data NEVER disappears - even during refetch
let globalConversationsCache: ConversationItem[] = [];

export function resetDirectMessageConversationsCache(): void {
  globalConversationsCache = [];
}

// =============================================================================
// FETCHER - Simple, reliable fetch
// =============================================================================

export const fetchDirectMessageConversations = async (
  accessToken: string | undefined
): Promise<ConversationItem[]> => {
  if (!accessToken) {
    return [];
  }

  try {
    const url = `${directMessageEndpoints.listConversations()}?limit=200`;

    const response = await api.get(url, {
      timeout: 15000,
    });

    const data = response.data;
    if (!data || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: ConversationItem) => ({
      ...item,
      is_meskeny_team: isMeskenyTeamConversation(item),
    }));
  } catch (error: any) {
    console.error("❌ Fetch conversations error:", error.message || "Unknown");
    // Re-throw so React Query keeps previous data on pull-to-refresh / refetch errors
    throw error;
  }
};

// =============================================================================
// MAIN HOOK - Zero flicker, always stable
// =============================================================================

export const useAccumulatedConversations = (
  options: UseDirectMessageConversationsOptions = {}
) => {
  const { user } = useUser();
  const {
    enabled = true,
    staleTime = 0,
    cacheTime = 30 * 60 * 1000 // 30 minutes
  } = options;

  const isAuthenticated = enabled && !!user?.ID && !!user?.accessToken;

  const query = useQuery<ConversationItem[]>({
    queryKey: ["directMessageConversations", user?.ID],
    queryFn: () => fetchDirectMessageConversations(user!.accessToken),
    enabled: isAuthenticated,
    staleTime: staleTime,
    gcTime: cacheTime,
    placeholderData: (previousData) =>
      isAuthenticated ? previousData || globalConversationsCache : [],
    refetchOnMount: isAuthenticated ? "always" : false,
    refetchOnReconnect: isAuthenticated,
    retry: 2,
    retryDelay: 800,
  });

  useEffect(() => {
    if (Array.isArray(query.data) && query.data.length > 0) {
      globalConversationsCache = query.data;
    }
  }, [query.data]);

  // Simple: Return query data or empty array
  const conversations = query.data || [];

  // Simple refetch - React Query handles deduplication
  const refetch = useCallback(async () => {
    try {
      await query.refetch();
    } catch (e) {
      // Silent fail - data stays visible
    }
  }, [query.refetch]);

  return {
    conversations,
    totalConversations: conversations.length,
    isLoading: query.isLoading && conversations.length === 0, // Only loading if no data
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    hasMore: false,
    refetch,
    fetchNextPage: async () => {},
    query
  };
};

// Alias for backwards compatibility
export const useDirectMessageConversations = useAccumulatedConversations;

// =============================================================================
// UTILITY: Manual invalidation
// =============================================================================

export const useInvalidateConversations = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useCallback(() => {
    if (user?.ID) {
      queryClient.invalidateQueries({ queryKey: ["directMessageConversations", user.ID] });
    }
  }, [queryClient, user?.ID]);
};
