/** Host government-ID identity verification (distinct from broker license). */

export type HostIdentityStatus = "approved" | "pending" | "rejected" | "none";

export type HostIdentityUser = {
  isVerified?: boolean | null;
  verificationStatus?: string | null;
  /** Some list/feed payloads use snake_case. */
  is_verified?: boolean | null;
  verification_status?: string | null;
};

export type HostIdentityData = {
  owner?: HostIdentityUser | null;
  organization?: { owner?: HostIdentityUser | null; name?: string | null } | null;
  organization_id?: number | null;
} | null;

function personIdentityStatus(
  person: HostIdentityUser | null | undefined,
): HostIdentityStatus {
  if (!person) return "none";

  const status = String(
    person.verificationStatus ?? person.verification_status ?? "",
  )
    .toLowerCase()
    .trim();

  if (status === "approved" || status === "verified") return "approved";
  if (status === "pending") return "pending";
  if (status === "rejected") return "rejected";

  if (person.isVerified === true || person.is_verified === true) {
    return "approved";
  }

  return "none";
}

/** The user whose government ID backs this listing. */
export function resolveHostIdentityPerson(
  data: HostIdentityData,
): HostIdentityUser | null {
  if (!data) return null;

  const isOrgListing =
    (typeof data.organization_id === "number" && data.organization_id > 0) ||
    !!String(data.organization?.name ?? "").trim();

  if (isOrgListing) {
    // Org listings: only the organization owner's ID counts — never the property owner row.
    return data.organization?.owner ?? null;
  }
  return data.owner ?? data.organization?.owner ?? null;
}

/** Alternate host record when API/cache omits fields on the primary host. */
function resolveHostIdentityFallback(
  data: HostIdentityData,
  primary: HostIdentityUser | null,
): HostIdentityUser | null {
  if (!data) return null;

  const isOrgListing =
    (typeof data.organization_id === "number" && data.organization_id > 0) ||
    !!String(data.organization?.name ?? "").trim();
  if (isOrgListing) return null;

  const owner = data.owner ?? null;
  const orgOwner = data.organization?.owner ?? null;
  if (!owner || !orgOwner || owner === orgOwner) return null;
  if (primary === orgOwner) return owner;
  if (primary === owner) return orgOwner;
  return null;
}

export function hostIdentityStatus(data: HostIdentityData): HostIdentityStatus {
  const primary = resolveHostIdentityPerson(data);
  let status = personIdentityStatus(primary);
  if (status !== "none") return status;

  const fallback = resolveHostIdentityFallback(data, primary);
  return personIdentityStatus(fallback);
}

export function hostIsIdentityVerified(data: HostIdentityData): boolean {
  return hostIdentityStatus(data) === "approved";
}

/** Avoid flashing wrong identity while feed placeholder lacks org owner fields. */
export function hostIdentityDataReady(
  data: HostIdentityData,
  isFetching = false,
): boolean {
  if (!data) return false;
  if (!isFetching) return true;

  const person = resolveHostIdentityPerson(data);
  if (!person) return false;

  return (
    person.isVerified != null ||
    person.is_verified != null ||
    !!(person.verificationStatus ?? person.verification_status)?.trim()
  );
}
