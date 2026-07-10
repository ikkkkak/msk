import React, { memo, useCallback } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  MeskenyTeamAvatar,
  MeskenyTeamNameRow,
} from "./MeskenyTeamAvatar";
import { ConversationItem } from "../hooks/queries/useDirectMessageConversations";
import { isMeskenyTeamConversation } from "../utils/meskenyTeamMessaging";
import { directConversationUnread } from "../utils/messagingUnread";
import { prefetchDirectMessageThread } from "../services/messagingThreadPrefetch";
import { markDirectThreadRead } from "../services/markDirectThreadRead";

function extractMessageSnippet(lastMessage: any, fallback = ""): string {
  if (!lastMessage) return fallback;
  const type = String(lastMessage?.type || lastMessage?.Type || "").toLowerCase();
  const refType = String(lastMessage?.ref_type || lastMessage?.refType || "").toLowerCase();
  const raw = String(
    lastMessage?.content || lastMessage?.text || lastMessage?.PreviewTitle || "",
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

type Props = {
  dmConv: ConversationItem;
  currentUserId?: number;
  isTyping?: boolean;
};

export const DirectMessageListItem = memo(function DirectMessageListItem({
  dmConv,
  currentUserId,
  isTyping = false,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const otherUserId = dmConv.other_user_id;
  const isMeskenyTeam = isMeskenyTeamConversation(dmConv);
  const recipientName = isMeskenyTeam
    ? t("messages.meskenyTeam", "Meskeny Team")
    : dmConv.other_user_name || "User";
  const photo = isMeskenyTeam ? undefined : dmConv.other_user_avatar;
  const lastMessage = dmConv.last_message;
  const unreadCount = directConversationUnread(dmConv, currentUserId);

  const snippet = isTyping
    ? t("messages.typing", "Typing...")
    : extractMessageSnippet(lastMessage, "");
  const timeStr = lastMessage?.created_at
    ? new Date(lastMessage.created_at).toLocaleDateString()
    : "";
  const firstLetter = recipientName.charAt(0).toUpperCase() || "U";

  const handlePressIn = useCallback(() => {
    prefetchDirectMessageThread(queryClient, otherUserId);
  }, [queryClient, otherUserId]);

  const handlePress = useCallback(() => {
    (navigation as any).navigate("DirectMessage", {
      conversationID: null,
      recipientName,
      otherUserId,
      isMeskenyTeam,
      seedLastMessage: lastMessage ?? undefined,
    });
    void markDirectThreadRead(otherUserId).catch(() => {});
    if (currentUserId) {
      queryClient.invalidateQueries({
        queryKey: ["directMessageConversations", currentUserId],
      });
    }
  }, [
    navigation,
    recipientName,
    otherUserId,
    isMeskenyTeam,
    lastMessage,
    currentUserId,
    queryClient,
  ]);

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPressIn={handlePressIn}
      onPress={handlePress}
    >
      <View style={styles.avatarContainer}>
        {isMeskenyTeam ? (
          <MeskenyTeamAvatar size={50} showBadge />
        ) : photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{firstLetter}</Text>
          </View>
        )}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          {isMeskenyTeam ? (
            <MeskenyTeamNameRow />
          ) : (
            <Text style={styles.recipientName}>{recipientName}</Text>
          )}
          <Text style={styles.messageTime}>{timeStr}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text
            style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {snippet || t("messages.noMessagesYet")}
          </Text>
          {unreadCount > 0 && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8E4DC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: "#666",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF385C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  unreadCount: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#717171",
    flex: 1,
  },
  unreadMessage: {
    color: "#1A1A1A",
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF385C",
    marginLeft: 8,
  },
});
