/** Shared broker host types and display rules for listing screens. */

export type BrokerHostUser = {
  firstName?: string | null;
  lastName?: string | null;
  avatarURL?: string | null;
  isVerified?: boolean | null;
  verificationStatus?: string | null;
  true_broker?: boolean;
  broker_id?: string;
  broker_status?: string;
  broker_show_profile_on_listings?: boolean;
  broker_profile_visible?: boolean;
  broker_spoken_languages?: string[];
};

export type BrokerHostData = {
  owner?: BrokerHostUser | null;
  organization?: {
    name?: string | null;
    banner_image?: string | null;
    owner?: BrokerHostUser | null;
  } | null;
} | null;

export function isVerifiedBrokerUser(
  user: BrokerHostUser | null | undefined,
): boolean {
  if (!user) return false;
  if (user.broker_status === "approved" && user.broker_id?.trim()) return true;
  return !!user.true_broker;
}

export function brokerIdFromHost(data: BrokerHostData): string | undefined {
  if (!data) return undefined;
  const orgOwner = data.organization?.owner;
  if (isVerifiedBrokerUser(orgOwner) && orgOwner?.broker_id) {
    return orgOwner.broker_id.trim();
  }
  const owner = data.owner;
  if (isVerifiedBrokerUser(owner) && owner?.broker_id) {
    return owner.broker_id.trim();
  }
  if (isVerifiedBrokerUser(orgOwner)) return orgOwner?.broker_id?.trim();
  if (isVerifiedBrokerUser(owner)) return owner?.broker_id?.trim();
  return undefined;
}

export function hostIsVerifiedBroker(data: BrokerHostData): boolean {
  return (
    isVerifiedBrokerUser(data?.organization?.owner ?? null) ||
    isVerifiedBrokerUser(data?.owner ?? null)
  );
}

/** Verified broker whose name/photo may appear on listings (default on). */
export function brokerProfileVisible(user: BrokerHostUser | null | undefined): boolean {
  if (!user || !isVerifiedBrokerUser(user)) return false;
  if (user.broker_profile_visible === false) return false;
  if (user.broker_show_profile_on_listings === false) return false;
  return true;
}

export function resolveBrokerPerson(data: BrokerHostData): BrokerHostUser | null {
  if (!data) return null;
  if (data.organization?.owner && isVerifiedBrokerUser(data.organization.owner)) {
    return data.organization.owner;
  }
  if (data.owner && isVerifiedBrokerUser(data.owner)) {
    return data.owner;
  }
  return data.owner ?? data.organization?.owner ?? null;
}

export function brokerDisplayName(
  user: BrokerHostUser | null | undefined,
  fallback: string,
): string {
  if (!user || !brokerProfileVisible(user)) return fallback;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || fallback;
}

export function brokerAvatarUri(
  user: BrokerHostUser | null | undefined,
): string | undefined {
  if (!user || !brokerProfileVisible(user)) return undefined;
  const uri = user.avatarURL?.trim();
  return uri || undefined;
}
