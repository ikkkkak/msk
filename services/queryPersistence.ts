import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import {
  USE_MMKV_CACHE,
  cacheGetString,
  cacheRemove,
  cacheSetString,
} from "./mmkvStorage";

const STORAGE_KEY = "@habitat/react-query-cache/v1";
const LEGACY_ASYNC_KEY = STORAGE_KEY;
const MAX_PERSIST_BYTES = 900_000;

const PERSIST_PREFIXES = [
  "cursorVideoFeed",
  "publicPropertySales",
  "user",
  "bootstrapUnreadMessages",
  "savedPropertySales",
  "savedProperties",
];

function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const head = queryKey[0];
  if (typeof head !== "string") return false;
  return PERSIST_PREFIXES.some((p) => head === p || head.startsWith(p));
}

async function readCachedPayload(): Promise<string | null> {
  const cached = await cacheGetString(STORAGE_KEY);
  if (cached) return cached;

  // One-time migration: prod MMKV reads legacy AsyncStorage entry on first launch.
  if (!USE_MMKV_CACHE) return null;

  try {
    const legacy = await AsyncStorage.getItem(LEGACY_ASYNC_KEY);
    if (legacy) {
      await cacheSetString(STORAGE_KEY, legacy);
      await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
      return legacy;
    }
  } catch {
    // ignore migration errors
  }
  return null;
}

export async function restoreQueryCache(queryClient: QueryClient) {
  try {
    const raw = await readCachedPayload();
    if (!raw) return;
    const dehydratedState = JSON.parse(raw);
    hydrate(queryClient, dehydratedState);
  } catch {
    try {
      await cacheRemove(STORAGE_KEY);
      if (USE_MMKV_CACHE) {
        await AsyncStorage.removeItem(LEGACY_ASYNC_KEY);
      }
    } catch {}
  }
}

export async function persistQueryCache(queryClient: QueryClient) {
  try {
    const dehydratedState = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => {
        if (query.state.status !== "success") return false;
        return shouldPersistQuery(query.queryKey);
      },
    });
    let serialized = JSON.stringify(dehydratedState);
    if (serialized.length > MAX_PERSIST_BYTES) {
      const q = dehydratedState.queries as Array<{
        queryKey: unknown[];
        state: unknown;
      }>;
      while (serialized.length > MAX_PERSIST_BYTES && q.length > 1) {
        q.pop();
        serialized = JSON.stringify({ ...dehydratedState, queries: q });
      }
    }
    await cacheSetString(STORAGE_KEY, serialized);
  } catch {
    // Best-effort; never crash the app for cache persistence.
  }
}
