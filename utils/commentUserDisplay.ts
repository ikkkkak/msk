type CommentUserLike = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatarURL?: string;
  avatarUrl?: string;
  avatar?: string;
  AvatarURL?: string;
} | null | undefined;

export function getCommentUserAvatar(user: CommentUserLike): string | null {
  if (!user) return null;
  const url =
    user.avatarURL ||
    user.avatarUrl ||
    user.avatar ||
    user.AvatarURL ||
    "";
  const trimmed = String(url).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getCommentUserName(
  user: CommentUserLike,
  fallback = "User",
): string {
  if (!user) return fallback;
  if (user.name && String(user.name).trim()) {
    return String(user.name).trim();
  }
  const first = String(user.firstName || "").trim();
  const last = String(user.lastName || "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (user.email) {
    const email = String(user.email);
    return email.includes("@") ? email.split("@")[0] : email;
  }
  return fallback;
}

export function getCommentUserInitial(name: string): string {
  const letter = name.trim().charAt(0).toUpperCase();
  return letter || "U";
}

export function formatCommentTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
