/**
 * Resolve publisher contact for a landmark (organization, API `host`, or individual owner).
 */

export type LandmarkHostContact = {
  displayName: string;
  phone: string;
  email: string;
  website: string;
};

function str(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

export function getLandmarkHostContact(landmark: unknown): LandmarkHostContact {
  if (!landmark || typeof landmark !== "object") {
    return { displayName: "", phone: "", email: "", website: "" };
  }
  const lm = landmark as Record<string, unknown>;
  const pcRaw = lm.publisherContact ?? lm.publisher_contact;
  if (pcRaw && typeof pcRaw === "object") {
    const pc = pcRaw as Record<string, unknown>;
    return {
      displayName: str(pc.name),
      phone: str(pc.phone),
      email: str(pc.email),
      website: str(pc.website),
    };
  }
  const host = lm.host as Record<string, unknown> | undefined;
  const org = lm.organization as Record<string, unknown> | undefined;
  const owner = lm.owner as Record<string, unknown> | undefined;

  let displayName = str(host?.name);
  if (!displayName) displayName = str(org?.name);
  if (!displayName && owner) {
    const fn = str(owner.firstName ?? owner.FirstName);
    const ln = str(owner.lastName ?? owner.LastName);
    displayName = `${fn} ${ln}`.trim();
    if (!displayName) displayName = str(owner.email ?? owner.Email);
  }

  let phone = str(host?.phone);
  if (!phone) phone = str(org?.phone);
  if (!phone) {
    const pn = owner?.phoneNumber ?? owner?.PhoneNumber;
    if (pn != null) phone = str(pn);
  }

  let email = str(host?.email);
  if (!email) email = str(org?.email ?? org?.Email);
  if (!email) email = str(owner?.email ?? owner?.Email);

  const website = str(org?.website ?? org?.Website);

  return { displayName, phone, email, website };
}

export function hasLandmarkHostContact(c: LandmarkHostContact): boolean {
  return Boolean(c.phone || c.email || c.website);
}
