import type { QueryClient } from "@tanstack/react-query";
import { directMessageEndpoints } from "../constants";
import { api } from "./api";

export type RentThreadCache = {
  messages: unknown[];
  nextCursor: number | null;
};

export type DirectMessageThread = {
  messages: unknown[];
  isMeskenyTeam: boolean;
};

export async function fetchDirectMessageThread(
  otherUserId: number,
): Promise<DirectMessageThread> {
  if (!otherUserId) return { messages: [], isMeskenyTeam: false };
  const res = await api.get(directMessageEndpoints.getMessages(otherUserId));
  return {
    messages: res.data?.messages ?? [],
    isMeskenyTeam: Boolean(res.data?.is_meskeny_team),
  };
}

export function rentConversationMessagesKey(conversationID: number) {
  return ["rentConversationMessages", conversationID] as const;
}

export async function fetchRentConversationThread(
  conversationID: number,
): Promise<RentThreadCache> {
  const res = await api.get(
    `/messages?conversationID=${conversationID}&limit=30`,
  );
  return {
    messages: res.data?.messages ?? [],
    nextCursor: res.data?.nextCursor ?? null,
  };
}

/** Warm thread cache before navigation — tap feels instant. */
export function prefetchDirectMessageThread(
  queryClient: QueryClient,
  otherUserId: number,
): void {
  if (!otherUserId) return;
  void queryClient.prefetchQuery({
    queryKey: ["directMessages", otherUserId],
    queryFn: () => fetchDirectMessageThread(otherUserId),
    staleTime: 60_000,
  });
}

export function prefetchRentConversationThread(
  queryClient: QueryClient,
  conversationID: number,
): void {
  if (!conversationID) return;
  void queryClient.prefetchQuery({
    queryKey: rentConversationMessagesKey(conversationID),
    queryFn: () => fetchRentConversationThread(conversationID),
    staleTime: 60_000,
  });
}
