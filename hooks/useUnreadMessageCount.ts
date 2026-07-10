import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { useUser } from "./useUser";
import { AppState } from "react-native";
import { socket } from "../constants/socket";
import { messagingWs } from "../services/messagingWs";
import { queryKeys } from "../constants";
import { fetchConversations } from "./queries/useConversationsQuery";
import { fetchDirectMessageConversations } from "./queries/useDirectMessageConversations";
import { onAuthLogout, onAuthSessionReady } from "../services/authEvents";
import {
  directConversationUnread,
  rentConversationUnread,
} from "../utils/messagingUnread";

export const useUnreadMessageCount = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [rentLastReadMs, setRentLastReadMs] = useState<
    Record<number, number>
  >({});

  const isAuthenticated = !!user?.ID && !!user?.accessToken;

  const { data: conversations } = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => fetchConversations(user!.ID, user!.accessToken),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });

  const { data: groups } = useQuery({
    queryKey: ["my-groups"],
    queryFn: () => api.get("/experience/groups").then((res) => res.data),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });

  const { data: directMessageConversations } = useQuery({
    queryKey: ["directMessageConversations", user?.ID],
    queryFn: () => fetchDirectMessageConversations(user!.accessToken),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const off = onAuthLogout(() => {
      setRentLastReadMs({});
    });
    return off;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !conversations?.length) {
      setRentLastReadMs({});
      return;
    }
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        conversations.map(async (conv) => {
          const convId = conv?.ID ?? (conv as { id?: number })?.id;
          if (!convId) return null;
          const raw = await AsyncStorage.getItem(`lastRead:conv:${convId}`);
          const ms = raw ? new Date(raw).getTime() : 0;
          (global as any).__unread_lastRead_cache =
            (global as any).__unread_lastRead_cache || {};
          (global as any).__unread_lastRead_cache[convId] = raw ?? undefined;
          return [Number(convId), ms] as const;
        }),
      );
      if (cancelled) return;
      const next: Record<number, number> = {};
      for (const p of pairs) {
        if (p) next[p[0]] = p[1];
      }
      setRentLastReadMs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversations, isAuthenticated]);

  const unreadCount = useMemo(() => {
    if (!isAuthenticated) return 0;

    let count = 0;

    if (conversations && Array.isArray(conversations)) {
      for (const conv of conversations) {
        const convId = Number(conv?.ID ?? (conv as { id?: number })?.id ?? 0);
        const lastReadAt = rentLastReadMs[convId];
        count += rentConversationUnread(
          conv,
          user?.ID,
          lastReadAt !== undefined ? lastReadAt : undefined,
        );
      }
    }

    if (groups && Array.isArray(groups)) {
      for (const group of groups) {
        count += Number(group.unreadCount ?? 0);
      }
    }

    if (
      directMessageConversations &&
      Array.isArray(directMessageConversations)
    ) {
      for (const dmConv of directMessageConversations) {
        count += directConversationUnread(dmConv, user?.ID);
      }
    }

    return count;
  }, [
    isAuthenticated,
    conversations,
    groups,
    directMessageConversations,
    user?.ID,
    rentLastReadMs,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        queryClient.invalidateQueries({ queryKey: ["my-groups"] });
        queryClient.invalidateQueries({
          queryKey: ["directMessageConversations", user?.ID],
        });
      }
    });
    return () => sub.remove();
  }, [queryClient, user?.ID, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const off = onAuthSessionReady((userId) => {
      if (userId !== user?.ID) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.invalidateQueries({
        queryKey: ["directMessageConversations", userId],
      });
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
    });
    return off;
  }, [queryClient, user?.ID, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onIncoming = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.invalidateQueries({
        queryKey: ["directMessageConversations", user?.ID],
      });
    };
    socket?.on?.("message", onIncoming);
    socket?.on?.("receiveMessage", onIncoming);
    return () => {
      socket?.off?.("message", onIncoming);
      socket?.off?.("receiveMessage", onIncoming);
    };
  }, [queryClient, user?.ID, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    messagingWs.connect(user.accessToken);
    const off = messagingWs.on((evt) => {
      const type = evt?.type;
      if (
        type === "dm:new_message" ||
        type === "conv:new_message" ||
        type === "dm:read" ||
        type === "conv:state"
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        queryClient.invalidateQueries({
          queryKey: ["directMessageConversations", user?.ID],
        });
        queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      }
    });
    return () => off();
  }, [queryClient, user?.ID, user?.accessToken, isAuthenticated]);

  return { unreadCount };
};
