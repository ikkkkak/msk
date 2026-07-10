import { MMKV } from "react-native-mmkv";

/** Release builds use MMKV (Metro resolves this file over mmkvStorage.ts). */
export const USE_MMKV_CACHE = true;

const mmkv = new MMKV({ id: "meskeny-cache" });

export async function cacheGetString(key: string): Promise<string | null> {
  return mmkv.getString(key) ?? null;
}

export async function cacheSetString(key: string, value: string): Promise<void> {
  mmkv.set(key, value);
}

export async function cacheRemove(key: string): Promise<void> {
  mmkv.delete(key);
}

export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  const raw = await cacheGetString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJSON(key: string, value: unknown): Promise<void> {
  await cacheSetString(key, JSON.stringify(value));
}
