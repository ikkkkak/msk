/**
 * MESSAGES SCREEN - SOLID-COMPLIANT IMPLEMENTATION
 *
 * ARCHITECTURE:
 * S - Single Responsibility: Only renders conversation list UI
 * O - Open/Closed: Uses hooks for data, extensible without modification
 * L - Liskov Substitution: Conversation items are interchangeable
 * I - Interface Segregation: UI doesn't depend on networking logic
 * D - Dependency Inversion: Depends on hook abstractions, not API directly
 *
 * ZERO DISAPPEARANCE GUARANTEE:
 * - Always shows existing data while fetching
 * - Never clears feed on errors
 * - Defensive array handling throughout
 */

import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useConversationsQuery } from "../hooks/queries/useConversationsQuery";
import {
  useMyGroups,
  useMarkGroupAsRead,
} from "../hooks/queries/useExperienceInvites";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../hooks/useUser";
import {
  useAccumulatedConversations,
  ConversationItem,
} from "../hooks/queries/useDirectMessageConversations";
import { DirectMessageListItem } from "../components/DirectMessageListItem";
import { messagingWs } from "../services/messagingWs";
import { onAuthLogout, onAuthSessionReady } from "../services/authEvents";
import { useIsFocused } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchMessagingInbox } from "../services/messagingInboxPrefetch";
import { prefetchRentConversationThread } from "../services/messagingThreadPrefetch";
import { rentConversationUnread } from "../utils/messagingUnread";
import { isMeskenyTeamConversation } from "../utils/meskenyTeamMessaging";

function extractMessageSnippet(lastMessage: any, fallback = ""): string {
  if (!lastMessage) return fallback;
  const type = String(
    lastMessage?.type || lastMessage?.Type || "",
  ).toLowerCase();
  const refType = String(
    lastMessage?.ref_type || lastMessage?.refType || "",
  ).toLowerCase();
  const raw = String(
    lastMessage?.content ||
      lastMessage?.text ||
      lastMessage?.PreviewTitle ||
      "",
  ).trim();
  if (!raw) return fallback;
  const isLikelyPropertyCard =
    type === "property_card" || refType === "property_sale";
  if (!isLikelyPropertyCard) return raw;
  try {
    const parsed = JSON.parse(raw);
    const title = String(parsed?.title || "Listing");
    return `Shared listing: ${title}`;
  } catch {
    return "Shared listing";
  }
}

export const MessagesScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const conversations = useConversationsQuery();
  const { data: groups = [] } = useMyGroups();
  const markAsRead = useMarkGroupAsRead();
  const [tick, setTick] = useState(0);
  const { user } = useUser();
  const queryClient = useQueryClient();
  const currentUserId = user?.ID;
  const isAuthenticated = !!currentUserId && !!user?.accessToken;
  const isFocused = useIsFocused();
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchInFlightRef = useRef(false);
  const lastInboxRefreshRef = useRef(0);
  const typingTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );
  const [typingByUser, setTypingByUser] = useState<Record<number, boolean>>({});

  // Simple, clean data fetching - no complex logic
  const directMessagesQuery = useAccumulatedConversations({
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const directMessageConversations = directMessagesQuery.conversations || [];

  const refreshInbox = useCallback(
    async (force = false) => {
      if (!currentUserId || !user?.accessToken) return;
      const now = Date.now();
      if (!force && now - lastInboxRefreshRef.current < 12_000) return;
      if (refetchInFlightRef.current) return;
      refetchInFlightRef.current = true;
      lastInboxRefreshRef.current = now;
      try {
        await Promise.all([
          conversations.refetch(),
          directMessagesQuery.refetch(),
        ]);
      } catch {
        // keep cached rows visible
      } finally {
        refetchInFlightRef.current = false;
      }
    },
    [
      currentUserId,
      user?.accessToken,
      conversations.refetch,
      directMessagesQuery.refetch,
    ],
  );

  // Instant load when auth becomes available (login / cold start).
  React.useEffect(() => {
    if (!currentUserId || !user?.accessToken) return;
    messagingWs.connect(user.accessToken);
    void refreshInbox(true);
  }, [currentUserId, user?.accessToken, refreshInbox]);

  React.useEffect(() => {
    const off = onAuthSessionReady((userId) => {
      if (userId !== currentUserId) return;
      void refreshInbox(true);
    });
    return off;
  }, [currentUserId, refreshInbox]);

  React.useEffect(() => {
    const off = onAuthLogout(() => {
      setTypingByUser({});
      setTick(0);
    });
    return off;
  }, []);

  // Refresh on focus — throttled so avatars don't remount/blink every visit
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      void refreshInbox(false);
    }, [refreshInbox, isAuthenticated]),
  );

  // Simple pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (currentUserId && user?.accessToken) {
        await prefetchMessagingInbox(queryClient, {
          ID: currentUserId,
          accessToken: user.accessToken,
        });
      }
      await refreshInbox(true);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId, user?.accessToken, queryClient, refreshInbox]);

  const scheduleRefetch = useCallback(() => {
    if (!isFocused || !isAuthenticated) return;
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(async () => {
      if (refetchInFlightRef.current) return;
      refetchInFlightRef.current = true;
      try {
        await Promise.all([
          conversations.refetch(),
          directMessagesQuery.refetch(),
        ]);
      } finally {
        refetchInFlightRef.current = false;
      }
    }, 350);
  }, [
    isFocused,
    isAuthenticated,
    conversations.refetch,
    directMessagesQuery.refetch,
  ]);

  React.useEffect(() => {
    return () => {
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = null;
      }
    };
  }, []);

  // Unified websocket listener (direct messages + inbox updates)
  React.useEffect(() => {
    if (!user?.accessToken) return;
    messagingWs.connect(user.accessToken);
    const off = messagingWs.on((evt) => {
      const type = evt?.type;
      // Ignore noisy events; refresh list only for meaningful feed updates.
      if (
        type === "dm:new_message" ||
        type === "conv:new_message" ||
        type === "dm:read" ||
        type === "conv:state"
      ) {
        scheduleRefetch();
      }
      if (type === "typing") {
        const payload = evt?.data || {};
        const senderID = Number(payload.senderID || payload.userID || 0);
        const isTyping = payload.isTyping !== false;
        if (!senderID || senderID === Number(currentUserId || 0)) return;

        setTypingByUser((prev) => ({ ...prev, [senderID]: isTyping }));
        const prevTimer = typingTimersRef.current[senderID];
        if (prevTimer) clearTimeout(prevTimer);
        if (isTyping) {
          typingTimersRef.current[senderID] = setTimeout(() => {
            setTypingByUser((prev) => ({ ...prev, [senderID]: false }));
          }, 3500);
        }
      }
    });
    return () => {
      off();
      Object.values(typingTimersRef.current).forEach((t) => clearTimeout(t));
      typingTimersRef.current = {};
    };
  }, [user?.accessToken, scheduleRefetch, currentUserId]);

  // Never show previous session rows after logout
  const safeDirectMessages: ConversationItem[] =
    isAuthenticated && Array.isArray(directMessageConversations)
      ? directMessageConversations
      : [];
  const safeConversations =
    isAuthenticated && Array.isArray(conversations.data)
      ? conversations.data
      : [];
  const safeGroups = isAuthenticated && Array.isArray(groups) ? groups : [];

  const sortedDirectMessages = useMemo(() => {
    const team = safeDirectMessages.filter((c) => isMeskenyTeamConversation(c));
    const rest = safeDirectMessages.filter(
      (c) => !isMeskenyTeamConversation(c),
    );
    return [...team, ...rest];
  }, [safeDirectMessages]);

  // Simple empty state check
  const hasAnyData =
    safeDirectMessages.length > 0 ||
    safeConversations.length > 0 ||
    safeGroups.length > 0;
  const showEmptyState =
    !hasAnyData && !conversations.isLoading && !directMessagesQuery.isLoading;

  // ==========================================================================
  // CONVERSATION ITEM COMPONENTS
  // ==========================================================================

  const ConversationItem = React.memo(({ conv }: { conv: any }) => {
    const convId = conv.ID;
    const title = conv.recipientName || t("messages.conversation");
    const photo = conv.recipientAvatar;
    const last = (conv.messages || [])[0];
    const [unreadCount, setUnreadCount] = useState<number>(
      Number(conv?.unreadCount || 0),
    );

    // Get first letter for avatar fallback
    const firstLetter = title.charAt(0).toUpperCase() || "C";

    const snippet = extractMessageSnippet(last, "");
    const timeStr = last?.CreatedAt
      ? new Date(last.CreatedAt).toLocaleDateString()
      : "";

    React.useEffect(() => {
      let isMounted = true;
      (async () => {
        try {
          const lastRead = await AsyncStorage.getItem(
            `lastRead:conv:${convId}`,
          );
          const lastReadAt = lastRead ? new Date(lastRead).getTime() : 0;

          const count = rentConversationUnread(conv, currentUserId, lastReadAt);

          if (isMounted) setUnreadCount(count);
        } catch {}
      })();
      return () => {
        isMounted = false;
      };
    }, [conv, tick, convId, currentUserId]);

    const handlePressIn = () => {
      prefetchRentConversationThread(queryClient, convId);
    };

    const handlePress = () => {
      const last = (conv.messages || [])[conv.messages.length - 1];
      (navigation as any).navigate("DirectMessage", {
        conversationID: convId,
        recipientName: title,
        seedLastMessage: last ?? undefined,
      });
      setUnreadCount(0);
      const now = new Date().toISOString();
      void AsyncStorage.setItem(`lastRead:conv:${convId}`, now).catch(() => {});
      (global as any).__unread_lastRead_cache =
        (global as any).__unread_lastRead_cache || {};
      (global as any).__unread_lastRead_cache[convId] = now;
    };

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPressIn={handlePressIn}
        onPress={handlePress}
      >
        <View style={styles.avatarContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{firstLetter}</Text>
            </View>
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.recipientName}>{title}</Text>
            <Text style={styles.messageTime}>{timeStr}</Text>
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {last ? snippet : t("messages.noMessagesYet")}
            </Text>
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const GroupItem = React.memo(({ group }: { group: any }) => {
    const groupId = group.id || group.ID;
    const title = group.name || group.Name || t("messages.group");
    const photo = group.photoURL || group.PhotoURL;
    const lastMessage = group.lastMessage;
    const unreadCount = group.unreadCount || 0;
    const lastMsgTime = lastMessage?.createdAt
      ? new Date(lastMessage.createdAt).toLocaleTimeString()
      : "";

    const handlePress = () => {
      (navigation as any).navigate("GroupChat", { groupId, title });
      void markAsRead.mutateAsync(groupId).catch(() => {});
    };

    return (
      <TouchableOpacity style={styles.conversationItem} onPress={handlePress}>
        <View style={styles.avatarContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="group" size={24} color="#999" />
            </View>
          )}
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { position: "absolute", top: -2, right: -2 },
              ]}
            >
              <Text style={styles.unreadCount}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.recipientName}>{title}</Text>
            {lastMsgTime ? (
              <Text style={styles.messageTime}>{lastMsgTime}</Text>
            ) : null}
          </View>
          <View style={styles.messageRow}>
            {lastMessage ? (
              <Text
                style={[
                  styles.lastMessage,
                  unreadCount > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                <Text style={{ fontWeight: "600" }}>
                  {lastMessage.senderName}:{" "}
                </Text>
                {lastMessage.content}
              </Text>
            ) : (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {t("messages.noMessagesYet")}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Direct Messages - Always render if data exists, even during refetch */}
        {sortedDirectMessages.length > 0 &&
          sortedDirectMessages.map((dmConv: ConversationItem) => (
            <DirectMessageListItem
              key={`dm-${dmConv.other_user_id}`}
              dmConv={dmConv}
              currentUserId={currentUserId}
              isTyping={!!typingByUser[Number(dmConv.other_user_id)]}
            />
          ))}

        {/* Property Conversations - Always render if data exists */}
        {safeConversations.length > 0 &&
          safeConversations.map((conv: any) => (
            <ConversationItem key={`conv-${conv.ID}`} conv={conv} />
          ))}

        {/* Group Conversations - Always render if data exists */}
        {safeGroups.length > 0 &&
          safeGroups.map((g: any) => (
            <GroupItem key={`grp-${g.id || g.ID}`} group={g} />
          ))}

        {/* Empty State - Only show when truly empty and not loading */}
        {showEmptyState && (
          <View style={styles.emptyState}>
            <Image
              source={require("../assets/Message.jpg")}
              style={{ width: 50, height: 50 }}
            />
            <Text style={styles.emptyTitle}>{t("messages.noMessages")}</Text>
            <Text style={styles.emptyMessage}>
              {t("messages.emptySubtitle")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666666",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
  },
  messageTime: {
    fontSize: 12,
    color: "#767676",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#767676",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#222222",
  },
  unreadBadge: {
    backgroundColor: "#FF5A5F",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5A5F",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#767676",
    textAlign: "center",
    lineHeight: 24,
  },
});
