import type { ConversationItem } from "../hooks/queries/useDirectMessageConversations";

/** Tab badge + list row: never badge when the latest message is yours. */
export function directConversationUnread(
  dmConv: ConversationItem,
  currentUserId: number | undefined,
): number {
  const lastMessage = dmConv.last_message;
  const senderId = Number(lastMessage?.sender_id ?? 0);
  if (senderId === Number(currentUserId ?? 0)) {
    return 0;
  }
  return Math.max(0, Number(dmConv.unread_count ?? 0));
}

/** Rent/property thread unread — only derive when we know last-read (avoid counting full history). */
export function rentConversationUnread(
  conv: { messages?: unknown[]; unreadCount?: number },
  currentUserId: number | undefined,
  lastReadAtMs: number | undefined,
): number {
  const backend = Number(conv?.unreadCount ?? 0);
  if (backend > 0) return backend;
  if (lastReadAtMs === undefined) return 0;

  const messages = Array.isArray(conv.messages) ? conv.messages : [];
  return messages.filter((m: any) => {
    const created = new Date(m.CreatedAt || m.createdAt || 0).getTime();
    const senderId =
      m.SenderID ?? m.senderID ?? m.author?.id ?? m.sender?.id ?? m.senderId;
    const isFromOther = currentUserId
      ? String(senderId) !== String(currentUserId)
      : true;
    return isFromOther && created > lastReadAtMs;
  }).length;
}
