import AsyncStorage from "@react-native-async-storage/async-storage";

/** Max age before we stop polling upload status for a listing card. */
export const UPLOAD_SESSION_MAX_AGE_MS = 30 * 60 * 1000;

const UPLOAD_ID_RE = /^([a-f0-9]{16}|[0-9a-f-]{36})$/i;

export function isValidUploadSessionId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  const t = id.trim();
  return t.length > 0 && UPLOAD_ID_RE.test(t);
}

export async function clearPropertyUploadSession(propertyId: number): Promise<void> {
  if (!propertyId) return;
  await AsyncStorage.removeItem(`property_${propertyId}_uploads`).catch(() => {});
}

/** Load one active upload id per property (newest valid session only). */
export async function loadPropertyUploadSessions(
  propertyIds: number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  const now = Date.now();

  for (const propertyId of propertyIds) {
    if (!propertyId) continue;
    const key = `property_${propertyId}_uploads`;
    const stored = await AsyncStorage.getItem(key);
    if (!stored) continue;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        await AsyncStorage.removeItem(key);
        continue;
      }

      const uploadIds: string[] = Array.isArray(parsed?.uploadIds)
        ? parsed.uploadIds.filter(isValidUploadSessionId)
        : [];
      const timestamp = Number(parsed?.timestamp) || 0;

      if (!uploadIds.length) {
        await AsyncStorage.removeItem(key);
        continue;
      }
      if (timestamp && now - timestamp > UPLOAD_SESSION_MAX_AGE_MS) {
        await AsyncStorage.removeItem(key);
        continue;
      }

      out.set(propertyId, uploadIds[uploadIds.length - 1]!);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  }

  return out;
}
