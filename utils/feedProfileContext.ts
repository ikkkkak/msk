import type {
  FeedProfileContext,
  FeedTab,
  FeedVideo,
} from "../hooks/Videofeedtypes";

function firstHttpUrl(
  ...candidates: (string | undefined | null)[]
): string | undefined {
  for (const c of candidates) {
    const u = String(c ?? "").trim();
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
  }
  return undefined;
}

function firstImageFromList(images?: string[]): string | undefined {
  if (!Array.isArray(images)) return undefined;
  return firstHttpUrl(...images);
}

function personName(
  first?: string,
  last?: string,
  fallback?: string,
): string {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full || String(fallback ?? "").trim();
}

/** Best avatar + profile id for a feed clip (org → user → property image → thumbnail). */
export function resolveFeedProfileContext(
  item: FeedVideo,
  tab: FeedTab,
): FeedProfileContext | null {
  const raw = item as Record<string, unknown>;
  const org = item.organization as
    | { id?: number; name?: string; logoURL?: string; logo?: string }
    | undefined;
  const ps = item.propertySale as Record<string, unknown> | undefined;
  const psOrg = ps?.organization as
    | { id?: number; name?: string; logoURL?: string; logo?: string }
    | undefined;
  const lm = item.landmark as Record<string, unknown> | undefined;
  const lmOrgNested = lm?.organization as
    | { id?: number; name?: string; logoURL?: string; logo?: string }
    | undefined;
  const lmOrgFromModel = lm?.Organization as
    | { id?: number; name?: string; logo?: string; OwnerID?: number }
    | undefined;
  const lmOrg = item.organization as
    | { id?: number; name?: string; logoURL?: string; logo?: string }
    | undefined;
  const hostUser =
    (raw.User as Record<string, unknown> | undefined) ??
    (raw.user as Record<string, unknown> | undefined);
  const psOwner = ps?.owner as
    | {
        id?: number;
        ID?: number;
        firstName?: string;
        lastName?: string;
        avatarURL?: string;
        avatarUrl?: string;
      }
    | undefined;
  const lmOwner = lm?.owner as
    | {
        id?: number;
        ID?: number;
        firstName?: string;
        lastName?: string;
        avatarURL?: string;
        avatarUrl?: string;
      }
    | undefined;

  const orgId =
    org?.id ??
    psOrg?.id ??
    lmOrgFromModel?.id ??
    lmOrgNested?.id ??
    (tab === "landmarks" ? lmOrg?.id : undefined);
  const orgName =
    org?.name ??
    psOrg?.name ??
    lmOrgFromModel?.name ??
    lmOrgNested?.name ??
    (tab === "landmarks" ? lmOrg?.name : undefined);

  const landmarkHasAgency = Boolean(
    (lm as { organization_id?: number; OrganizationID?: number } | undefined)
      ?.organization_id ||
      (lm as { organization_id?: number; OrganizationID?: number } | undefined)
        ?.OrganizationID ||
      lmOrgFromModel?.id ||
      lmOrgNested?.id,
  );

  let profileUserId =
    raw.userID ??
    raw.userId ??
    hostUser?.ID ??
    hostUser?.id ??
    psOwner?.ID ??
    psOwner?.id ??
    lmOwner?.ID ??
    lmOwner?.id ??
    ps?.owner_id ??
    ps?.ownerId;

  if (tab === "landmarks" && lm) {
    if (landmarkHasAgency && orgId) {
      profileUserId = orgId;
    } else if (!landmarkHasAgency) {
      profileUserId =
        lmOwner?.ID ??
        lmOwner?.id ??
        (lm as { owner_id?: number }).owner_id ??
        profileUserId;
    }
  }

  if (
    profileUserId &&
    orgId &&
    Number(profileUserId) === Number(orgId) &&
    tab !== "landmarks"
  ) {
    profileUserId = undefined;
  }

  if (!profileUserId && orgId && tab !== "landmarks") {
    profileUserId = raw.userID ?? raw.userId;
  }
  if (!profileUserId && tab === "landmarks") {
    profileUserId =
      raw.userID ??
      raw.userId ??
      lmOwner?.ID ??
      lmOwner?.id ??
      (typeof lmOrg?.id === "number" ? lmOrg.id : undefined);
  }

  const avatarUrl =
    firstHttpUrl(
      org?.logoURL,
      org?.logo,
      psOrg?.logoURL,
      psOrg?.logo,
      lmOrgFromModel?.logo,
      lmOrgNested?.logoURL,
      lmOrgNested?.logo,
      lmOrg?.logoURL,
      lmOrg?.logo,
      hostUser?.avatarURL as string | undefined,
      hostUser?.avatarUrl as string | undefined,
      psOwner?.avatarURL,
      psOwner?.avatarUrl,
      lmOwner?.avatarURL,
      lmOwner?.avatarUrl,
    ) ??
    firstImageFromList(item.property?.images) ??
    firstImageFromList(ps?.images as string[] | undefined) ??
    firstImageFromList(lm?.images as string[] | undefined) ??
    firstHttpUrl(
      item.thumbnailURL,
      item.thumbnail_url,
      raw.thumbnailURL as string | undefined,
      raw.ThumbnailURL as string | undefined,
    );

  const hostName = personName(
    hostUser?.firstName as string | undefined,
    hostUser?.lastName as string | undefined,
  );
  const ownerName =
    personName(psOwner?.firstName, psOwner?.lastName) ||
    personName(lmOwner?.firstName, lmOwner?.lastName);

  const displayName =
    orgName ||
    hostName ||
    ownerName ||
    item.property?.title ||
    (ps?.title as string | undefined) ||
    (lm?.title as string | undefined) ||
    (lm?.name as string | undefined) ||
    item.title ||
    "Host";

  const initial = displayName.charAt(0).toUpperCase() || "H";
  const isOrganization = Boolean(
    orgId && orgName && (tab !== "landmarks" || landmarkHasAgency),
  );

  if (!profileUserId && !avatarUrl) return null;

  const sheetId =
    isOrganization && orgId
      ? orgId
      : Number(profileUserId) || 0;

  if (!sheetId) return null;

  return {
    profileUserId: sheetId,
    avatarUrl,
    displayName,
    initial,
    isOrganization,
    organizationId: orgId,
  };
}
