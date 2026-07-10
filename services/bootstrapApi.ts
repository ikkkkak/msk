import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, publicApi } from "./api";

const BOOTSTRAP_ETAG_KEY = "@habitat/bootstrap-etag/v1";

export type BootstrapPayload = {
  serverTime?: number;
  saleVideoFeed?: {
    videos?: unknown[];
    nextCursor?: string | null;
    hasMore?: boolean;
    source?: string;
  };
  propertySales?: {
    properties?: unknown[];
    data?: unknown[];
    hasMore?: boolean;
    nextCursor?: string | null;
    source?: string;
  };
  user?: Record<string, unknown>;
  unreadMessages?: number;
};

export type BootstrapResult =
  | { notModified: true }
  | { notModified: false; data: BootstrapPayload; etag?: string };

export async function fetchAppBootstrap(opts: {
  useAuth: boolean;
  limit?: number;
  lang?: string;
  deviceId?: string | null;
}): Promise<BootstrapResult> {
  const limit = opts.limit ?? 8;
  const lang = (opts.lang ?? "en").toLowerCase();
  const client = opts.useAuth ? api : publicApi;

  let etag: string | null = null;
  try {
    etag = await AsyncStorage.getItem(BOOTSTRAP_ETAG_KEY);
  } catch {
    etag = null;
  }

  const headers: Record<string, string> = {};
  if (etag) headers["If-None-Match"] = etag;
  if (opts.deviceId) headers["X-Device-ID"] = opts.deviceId;

  const res = await client.get<BootstrapPayload>("/bootstrap", {
    params: { limit, lang },
    headers,
    timeout: 45000,
    validateStatus: (s) => s === 200 || s === 304,
  });

  if (res.status === 304) {
    return { notModified: true };
  }

  const newEtag = res.headers?.etag as string | undefined;
  if (newEtag) {
    void AsyncStorage.setItem(BOOTSTRAP_ETAG_KEY, newEtag).catch(() => {});
  }

  return { notModified: false, data: res.data ?? {}, etag: newEtag };
}

export async function clearBootstrapETag(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BOOTSTRAP_ETAG_KEY);
  } catch {
    /* ignore */
  }
}
