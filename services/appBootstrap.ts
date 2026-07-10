import type { QueryClient } from "@tanstack/react-query";
import { fetchAppBootstrap } from "./bootstrapApi";
import { applyBootstrapPayload } from "./bootstrapHydration";
import { getOrCreateDeviceId } from "../utils/deviceId";
import { resolveInitialFeedQuality } from "./networkQuality";

export async function runAppBootstrap(
  queryClient: QueryClient,
  opts: {
    userId?: number;
    useAuth: boolean;
    lang?: string;
  },
): Promise<boolean> {
  try {
    const [deviceId, feedQuality] = await Promise.all([
      getOrCreateDeviceId().catch(() => null),
      resolveInitialFeedQuality(),
    ]);

    const result = await fetchAppBootstrap({
      useAuth: opts.useAuth,
      limit: 8,
      lang: opts.lang ?? "en",
      deviceId,
    });

    if (result.notModified) {
      return true;
    }

    applyBootstrapPayload(queryClient, result.data, {
      userId: opts.userId,
      lang: opts.lang ?? "en",
      feedQuality,
    });
    return true;
  } catch (e) {
    if (__DEV__) {
      console.warn("[AppBootstrap] failed", e);
    }
    return false;
  }
}
