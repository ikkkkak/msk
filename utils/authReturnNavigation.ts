/**
 * When opening UnifiedAuth from a deep screen (e.g. PropertyDetails → contact host),
 * we stash the property id here so useAuth can reset the stack to Root + PropertyDetails
 * after a successful login/register.
 */
let pendingPropertyId: number | null = null;

export function setPostAuthReturnToPropertyDetails(propertyID: number) {
  pendingPropertyId = propertyID;
}

export function consumePostAuthPropertyDetailsRoute():
  | { name: "PropertyDetails"; params: { propertyID: number } }
  | null {
  if (pendingPropertyId == null) return null;
  const id = pendingPropertyId;
  pendingPropertyId = null;
  return { name: "PropertyDetails", params: { propertyID: id } };
}

/** Call when leaving auth without completing login (e.g. back), so a later login is not mis-routed. */
export function abandonPostAuthReturn(returnToPropertyId?: number) {
  if (pendingPropertyId === null) return;
  if (
    returnToPropertyId === undefined ||
    pendingPropertyId === returnToPropertyId
  ) {
    pendingPropertyId = null;
  }
}
