/**
 * Shared inbox prefetch — single source of truth for Messages tab query keys + API routes.
 */

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "../constants";
import { fetchConversations } from "../hooks/queries/useConversationsQuery";
import {
  fetchDirectMessageConversations,
  resetDirectMessageConversationsCache,
} from "../hooks/queries/useDirectMessageConversations";
import { api } from "./api";
import { messagingWs } from "./messagingWs";

const MESSAGING_QUERY_ROOTS = new Set([
  "conversations",
  "directMessageConversations",
  "my-groups",
  "myGroups",
  "directMessages",
]);

export function isMessagingQueryKey(key: QueryKey): boolean {
  const root = Array.isArray(key) ? String(key[0] ?? "") : "";
  return MESSAGING_QUERY_ROOTS.has(root);
}

/** Stop inbox fetches, WS, and cached rows when the session ends. */
export function teardownMessagingSession(queryClient: QueryClient): void {
  try {
    messagingWs.disconnect();
  } catch {
    // ignore
  }

  (global as any).__unread_lastRead_cache = {};
  resetDirectMessageConversationsCache();

  queryClient.cancelQueries({
    predicate: (q) => isMessagingQueryKey(q.queryKey),
  });
  queryClient.removeQueries({
    predicate: (q) => isMessagingQueryKey(q.queryKey),
  });
}

export async function prefetchMessagingInbox(
  queryClient: QueryClient,
  user: { ID: number; accessToken: string },
): Promise<void> {
  if (!user?.ID || !user?.accessToken) return;

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.conversations,
      queryFn: () => fetchConversations(user.ID, user.accessToken),
      staleTime: 0,
    }),
    queryClient.prefetchQuery({
      queryKey: ["directMessageConversations", user.ID],
      queryFn: () => fetchDirectMessageConversations(user.accessToken),
      staleTime: 0,
    }),
    queryClient.prefetchQuery({
      queryKey: ["my-groups"],
      queryFn: () => api.get("/experience/groups").then((r) => r.data ?? []),
      staleTime: 0,
    }),
  ]);
}

export function invalidateMessagingInbox(
  queryClient: QueryClient,
  userId: number,
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  queryClient.invalidateQueries({
    queryKey: ["directMessageConversations", userId],
  });
  queryClient.invalidateQueries({ queryKey: ["my-groups"] });
}
