import i18n from "../i18n";

/** True when text looks like an internal snake_case notification key. */
export function looksLikeRawNotificationKey(text: string | undefined | null): boolean {
  const s = String(text ?? "").trim();
  if (!s) return true;
  if (/\s/.test(s) || s.includes("•") || s.includes("—")) return false;
  if (s.includes("_")) return true;
  return s === s.toLowerCase() && s.length > 3;
}

function tPush(type: string, field: "title" | "body", fallback: string): string {
  const key = `notifications.pushTypes.${type}.${field}`;
  return i18n.t(key, { defaultValue: fallback });
}

const TYPE_LABELS_EN: Record<string, { title: string; body?: string }> = {
  property_status_changed: {
    title: "Property status update",
    body: "Your listing status has changed. Tap to view.",
  },
  host_mode_reminder: {
    title: "List your first property",
    body: "Add your property in under 2 minutes and start getting bookings.",
  },
  rent_suggestion: { title: "Property for rent", body: "A rental match is waiting for you." },
  continue_browsing: {
    title: "Continue where you left off",
    body: "New properties are waiting in your area.",
  },
  trending_properties: {
    title: "Trending near you",
    body: "Popular listings you may want to see.",
  },
  weekly_digest: { title: "Weekly picks", body: "Our best matches for you this week." },
  nearby_property: { title: "Property nearby", body: "A new listing is close to you." },
  new_property: { title: "New property", body: "A new listing matches your interests." },
  price_drop: { title: "Price drop", body: "A property you viewed dropped in price." },
  viewed_property_reminder: {
    title: "Still available",
    body: "The home you viewed is still available.",
  },
  still_available: { title: "Still available", body: "Tap to see the latest details." },
  similar_properties: { title: "Similar homes", body: "We found homes like your favorites." },
  reengage_digest: { title: "New for you", body: "Fresh listings are waiting." },
  meskeny_guide: { title: "Meskeny Guide", body: "New guidance for your listing." },
  notification_digest: { title: "Multiple updates", body: "You have several new updates." },
  suggestion_digest: { title: "Multiple updates", body: "You have several new updates." },
  reservation_request: { title: "New reservation", body: "Someone requested a booking." },
  message_received: { title: "New message", body: "You have a new message." },
  group_join_request: { title: "Join request", body: "Someone wants to join your group." },
};

function normalizeType(type: string): string {
  return String(type || "")
    .trim()
    .toLowerCase()
    .replace(/^smart_/, "");
}

export function resolveNotificationTitle(notification: {
  type?: string;
  title?: string;
}): string {
  const rawTitle = String(notification.title ?? "").trim();
  const type = normalizeType(notification.type ?? "");

  if (rawTitle && !looksLikeRawNotificationKey(rawTitle)) {
    return rawTitle;
  }

  if (type) {
    const translated = tPush(
      type,
      "title",
      TYPE_LABELS_EN[type]?.title ?? type.replace(/_/g, " "),
    );
    if (translated) return translated;
  }

  return rawTitle || i18n.t("notifications.genericTitle", "Notification");
}

export function resolveNotificationMessage(notification: {
  type?: string;
  title?: string;
  message?: string;
}): string {
  const rawMessage = String(notification.message ?? "").trim();
  const type = normalizeType(notification.type ?? "");

  if (rawMessage && !looksLikeRawNotificationKey(rawMessage)) {
    // Digest bodies like "2 notifications: a, b" — still human enough if labels fixed server-side.
    if (!/^\d+\s+notifications?:/i.test(rawMessage)) {
      return rawMessage;
    }
  }

  if (type) {
    const translated = tPush(
      type,
      "body",
      TYPE_LABELS_EN[type]?.body ??
        i18n.t("notifications.genericBody", "Tap to view details."),
    );
    if (translated) return translated;
  }

  return rawMessage || i18n.t("notifications.genericBody", "Tap to view details.");
}
