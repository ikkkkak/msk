/**
 * In-app API call ring buffer — answers "why was the server called?" and
 * "was it up when we called?". Dev: log to console. Prod: inspect via
 * global.__MESKENY_API_DIAG__.getReport() in a debug build.
 */

export type ApiCallRecord = {
  id: string;
  at: number;
  method: string;
  url: string;
  path: string;
  status?: number;
  durationMs: number;
  ok: boolean;
  source: "axios" | "fetch" | "react-query";
  caller?: string;
  queryKey?: string;
  error?: string;
};

const MAX_RECORDS = 200;
const records: ApiCallRecord[] = [];
let seq = 0;

function trimPath(url: string): string {
  try {
    const u = url.startsWith("http") ? new URL(url) : new URL(url, "http://local");
    return u.pathname + (u.search ? u.search.slice(0, 80) : "");
  } catch {
    return url.slice(0, 120);
  }
}

/** Best-effort caller from stack (dev only). */
export function captureApiCaller(): string | undefined {
  if (!__DEV__) return undefined;
  const stack = new Error().stack?.split("\n") ?? [];
  for (const line of stack.slice(4, 14)) {
    if (
      line.includes("node_modules") ||
      line.includes("apiDiagnostics") ||
      line.includes("api.ts") ||
      line.includes("axios")
    ) {
      continue;
    }
    const m = line.match(/at ([^(]+)/);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

export function recordApiCall(
  partial: Omit<ApiCallRecord, "id" | "at" | "path"> & { url: string },
): void {
  const rec: ApiCallRecord = {
    id: `api_${++seq}`,
    at: Date.now(),
    path: trimPath(partial.url),
    ...partial,
  };
  records.unshift(rec);
  if (records.length > MAX_RECORDS) records.pop();

  if (__DEV__ && (!rec.ok || rec.durationMs >= 3000)) {
    console.log(
      `[API-DIAG] ${rec.method} ${rec.path} → ${rec.status ?? "ERR"} ${rec.durationMs}ms` +
        (rec.caller ? ` ← ${rec.caller}` : "") +
        (rec.queryKey ? ` [RQ:${rec.queryKey}]` : "") +
        (rec.error ? ` (${rec.error})` : ""),
    );
  }
}

export function recordReactQueryFetch(queryKey: unknown, meta?: { stale?: boolean }) {
  const key = Array.isArray(queryKey)
    ? queryKey.slice(0, 3).join("/")
    : String(queryKey);
  recordApiCall({
    method: "QUERY",
    url: `react-query://${key}`,
    durationMs: 0,
    ok: true,
    source: "react-query",
    queryKey: key,
    caller: meta?.stale ? "stale-refetch" : "query-fetch",
  });
}

export type ApiDiagnosticsReport = {
  generatedAt: string;
  total: number;
  last5Min: number;
  failures: number;
  slow: number;
  byPath: Array<{ path: string; count: number; failures: number; avgMs: number }>;
  bySource: Record<string, number>;
  recentFailures: ApiCallRecord[];
  topCallers: Array<{ caller: string; count: number }>;
  reactQueryFetches: Array<{ queryKey: string; count: number }>;
};

export function getApiDiagnosticsReport(): ApiDiagnosticsReport {
  const cutoff = Date.now() - 5 * 60 * 1000;
  const recent = records.filter((r) => r.at >= cutoff);

  const byPath = new Map<string, { count: number; failures: number; totalMs: number }>();
  const bySource: Record<string, number> = {};
  const byCaller = new Map<string, number>();
  const byQuery = new Map<string, number>();

  for (const r of recent) {
    const p = byPath.get(r.path) ?? { count: 0, failures: 0, totalMs: 0 };
    p.count++;
    if (!r.ok) p.failures++;
    p.totalMs += r.durationMs;
    byPath.set(r.path, p);

    bySource[r.source] = (bySource[r.source] ?? 0) + 1;

    if (r.caller) {
      byCaller.set(r.caller, (byCaller.get(r.caller) ?? 0) + 1);
    }
    if (r.source === "react-query" && r.queryKey) {
      byQuery.set(r.queryKey, (byQuery.get(r.queryKey) ?? 0) + 1);
    }
  }

  const failures = recent.filter((r) => !r.ok);
  const slow = recent.filter((r) => r.durationMs >= 3000);

  return {
    generatedAt: new Date().toISOString(),
    total: records.length,
    last5Min: recent.length,
    failures: failures.length,
    slow: slow.length,
    byPath: [...byPath.entries()]
      .map(([path, v]) => ({
        path,
        count: v.count,
        failures: v.failures,
        avgMs: v.count ? Math.round(v.totalMs / v.count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25),
    bySource,
    recentFailures: failures.slice(0, 15),
    topCallers: [...byCaller.entries()]
      .map(([caller, count]) => ({ caller, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    reactQueryFetches: [...byQuery.entries()]
      .map(([queryKey, count]) => ({ queryKey, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  };
}

export function clearApiDiagnostics(): void {
  records.length = 0;
}

declare global {
  // eslint-disable-next-line no-var
  var __MESKENY_API_DIAG__: {
    getReport: () => ApiDiagnosticsReport;
    getRecords: () => ApiCallRecord[];
    clear: () => void;
  };
}

if (__DEV__) {
  global.__MESKENY_API_DIAG__ = {
    getReport: getApiDiagnosticsReport,
    getRecords: () => [...records],
    clear: clearApiDiagnostics,
  };
}
