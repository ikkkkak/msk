import { directMessageEndpoints } from "../constants";
import { api } from "./api";

/** Mark all unread DMs from a user as read (fixes stale per-message counts). */
export async function markDirectThreadRead(otherUserId: number): Promise<void> {
  if (!otherUserId) return;
  await api.post(directMessageEndpoints.markThreadRead(otherUserId), {});
}
