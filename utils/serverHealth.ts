import axios from "axios";
import { API_PATHS, LISTING_FLOW_URLS, resolveApiUrl } from "../constants/apiPaths";
import { serverUrl } from "../constants";
import { recordApiCall } from "../services/apiDiagnostics";

export type ServerHealthResult = {
  ok: boolean;
  healthUrl: string;
  serverUrl: string;
  latencyMs: number;
  message?: string;
  ready?: boolean;
  deep?: Record<string, unknown>;
};

/**
 * Quick check that the API process is up before a heavy publish.
 * Uses /health (outside /api) — same host as serverUrl.
 */
export async function checkServerHealth(
  timeoutMs = 8000,
): Promise<ServerHealthResult> {
  const healthUrl = API_PATHS.health;
  const started = Date.now();
  try {
    const res = await axios.get(healthUrl, { timeout: timeoutMs });
    const latencyMs = Date.now() - started;
    const ok =
      res.status === 200 &&
      (res.data?.status === "ok" || res.data?.message != null);
    recordApiCall({
      method: "GET",
      url: healthUrl,
      status: res.status,
      durationMs: latencyMs,
      ok,
      source: "axios",
      caller: "checkServerHealth",
    });
    return {
      ok,
      healthUrl,
      serverUrl,
      latencyMs,
      message: ok ? "Server is running" : "Unexpected health response",
    };
  } catch (e: unknown) {
    const latencyMs = Date.now() - started;
    const msg =
      e instanceof Error
        ? e.message
        : "Cannot reach server — check Wi‑Fi, IP in constants.ts, and that go run . is active";
    recordApiCall({
      method: "GET",
      url: healthUrl,
      durationMs: latencyMs,
      ok: false,
      source: "axios",
      caller: "checkServerHealth",
      error: msg,
    });
    return {
      ok: false,
      healthUrl,
      serverUrl,
      latencyMs,
      message: msg,
    };
  }
}

/** Readiness — process up AND database responds (catches pool exhaustion). */
export async function checkServerReady(
  timeoutMs = 10_000,
): Promise<ServerHealthResult> {
  const base = serverUrl.replace(/\/+$/, "");
  const healthUrl = `${base}/api/health/ready`;
  const started = Date.now();
  try {
    const res = await axios.get(healthUrl, { timeout: timeoutMs });
    const latencyMs = Date.now() - started;
    const ok = res.status === 200 && res.data?.ok === true;
    recordApiCall({
      method: "GET",
      url: healthUrl,
      status: res.status,
      durationMs: latencyMs,
      ok,
      source: "axios",
      caller: "checkServerReady",
    });
    return {
      ok,
      ready: ok,
      healthUrl,
      serverUrl,
      latencyMs,
      message: ok
        ? "Server ready"
        : String(res.data?.db?.detail ?? "Server not ready"),
      deep: res.data,
    };
  } catch (e: unknown) {
    const latencyMs = Date.now() - started;
    const msg = e instanceof Error ? e.message : "Ready check failed";
    recordApiCall({
      method: "GET",
      url: healthUrl,
      durationMs: latencyMs,
      ok: false,
      source: "axios",
      caller: "checkServerReady",
      error: msg,
    });
    return { ok: false, ready: false, healthUrl, serverUrl, latencyMs, message: msg };
  }
}

/** Deep diagnostics — pool stats, in-flight requests, redis, hints. */
export async function checkServerDeep(
  timeoutMs = 12_000,
): Promise<ServerHealthResult> {
  const base = serverUrl.replace(/\/+$/, "");
  const healthUrl = `${base}/api/health/deep`;
  const started = Date.now();
  try {
    const res = await axios.get(healthUrl, { timeout: timeoutMs });
    const latencyMs = Date.now() - started;
    const ok = res.status === 200 && res.data?.ok === true;
    return {
      ok,
      healthUrl,
      serverUrl,
      latencyMs,
      message: Array.isArray(res.data?.hints)
        ? (res.data.hints as string[]).join(" | ")
        : res.data?.status,
      deep: res.data,
    };
  } catch (e: unknown) {
    return {
      ok: false,
      healthUrl,
      serverUrl,
      latencyMs: Date.now() - started,
      message: e instanceof Error ? e.message : "Deep health failed",
    };
  }
}

/** Throws with a clear message if the server is not reachable. */
export async function assertServerReachable(timeoutMs = 8000): Promise<void> {
  const result = await checkServerHealth(timeoutMs);
  if (__DEV__) {
    console.log(
      `[server] health ${result.ok ? "OK" : "FAIL"} ${result.healthUrl} (${result.latencyMs}ms)`,
    );
    console.log("[server] listing flow URLs:", LISTING_FLOW_URLS);
  }
  if (!result.ok) {
    throw new Error(
      `Cannot reach API at ${result.healthUrl}. ${result.message ?? ""} ` +
        `Expected serverUrl=${serverUrl}. Update LOCAL_DEV_SERVER_URL in constants.ts to your PC LAN IP.`,
    );
  }
}

export function logListingApiEndpoints(): void {
  if (!__DEV__) return;
  console.log("[API] serverUrl:", serverUrl);
  console.log("[API] publish create:", resolveApiUrl(API_PATHS.propertySalesCreate));
  console.log("[API] upload image:", resolveApiUrl(API_PATHS.uploadImage));
  console.log("[API] listing AI jobs:", resolveApiUrl(API_PATHS.listingAiJobs));
}
