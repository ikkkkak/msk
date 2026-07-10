import AsyncStorage from "@react-native-async-storage/async-storage";

/** Dev builds use AsyncStorage only (see mmkvStorage.prod.ts for release). */
export const USE_MMKV_CACHE = false;

export async function cacheGetString(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function cacheSetString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function cacheRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
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
