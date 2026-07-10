import { API_PATHS, resolveApiUrl } from "../constants/apiPaths";
import { endpoints } from "../constants";

export type PropertySaleCreateJobResponse = {
  id: string;
  status: string;
  percent: number;
  step?: string;
  property_id?: number;
  message?: string;
  error?: string;
};

type JsonRecord = Record<string, unknown>;

async function publishFetch(
  path: string,
  accessToken: string,
  payload: JsonRecord,
  timeoutMs: number,
): Promise<{ status: number; data: unknown }> {
  const url = resolveApiUrl(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (__DEV__) {
    const kb = Math.round(JSON.stringify(payload).length / 1024);
    console.log(`[publish-fetch] POST ${url} ~${kb}KB timeout=${timeoutMs}ms`);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Connection: "close",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let data: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (__DEV__) {
      console.log(`[publish-fetch] POST ${url} → ${res.status}`);
    }

    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/** Direct sync create — uses fetch (own connection) to avoid axios queue stalls. */
export async function createPropertySaleSync(
  payload: JsonRecord,
  accessToken: string,
  onPercent?: (percent: number) => void,
): Promise<{ id: number; message: string }> {
  onPercent?.(66);
  const { status, data } = await publishFetch(
    API_PATHS.propertySalesCreate,
    accessToken,
    payload,
    120000,
  );
  onPercent?.(92);

  const body = data as {
    id?: number;
    ID?: number;
    error?: string;
    details?: string;
    message?: string;
  };

  if (status === 401) {
    throw new Error("Session expired — please sign in again");
  }
  if (status < 200 || status >= 300) {
    throw new Error(
      body?.error || body?.details || `Create failed (HTTP ${status})`,
    );
  }

  const id = Number(body?.id ?? body?.ID ?? 0);
  if (!id) {
    throw new Error(body?.message || "No property id returned");
  }
  onPercent?.(100);
  return {
    id,
    message: String(body?.message || "Property created successfully"),
  };
}

/** Quick probe — is create-jobs route alive? Cached after first success. */
let createJobsRouteCached: boolean | null = null;

export async function probeCreateJobsRoute(
  accessToken: string,
): Promise<boolean> {
  if (createJobsRouteCached === true) return true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(resolveApiUrl(API_PATHS.propertySalesCreateJobsPing), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Connection: "close",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    createJobsRouteCached = res.status === 204;
    return createJobsRouteCached;
  } catch {
    return false;
  }
}

export async function startPropertySaleCreateJob(
  payload: JsonRecord,
  accessToken: string,
): Promise<string> {
  const { status, data } = await publishFetch(
    API_PATHS.propertySalesCreateJobs,
    accessToken,
    payload,
    15000,
  );
  const body = data as { data?: { job_id?: string } };
  if (status === 404 || status === 405) {
    throw new Error("create-jobs route not found — restart API server");
  }
  if (status < 200 || status >= 300) {
    throw new Error(`create-jobs failed (HTTP ${status})`);
  }
  const jobId = body?.data?.job_id;
  if (!jobId) throw new Error("No create job id returned");
  return String(jobId);
}

export async function pollPropertySaleCreateJob(
  jobId: string,
  accessToken: string,
  onProgress: (update: { percent: number; step?: string }) => void,
  maxMs = 120000,
): Promise<{ id: number; message: string }> {
  const base = endpoints.baseURL.replace(/\/+$/, "");
  const started = Date.now();

  while (Date.now() - started < maxMs) {
    const url = `${base}/property-sales/create-jobs/${jobId}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Connection: "close",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const json = (await res.json()) as { data?: PropertySaleCreateJobResponse };
    const job = json?.data;
    if (job?.percent != null) {
      onProgress({
        percent: Math.min(100, Math.max(0, Math.round(job.percent))),
        step: job.step,
      });
    }

    if (job?.status === "completed") {
      const id = Number(job.property_id ?? 0);
      if (!id) throw new Error("Property created but no id returned");
      onProgress({ percent: 100, step: "complete" });
      return {
        id,
        message: String(job.message || "Property created successfully"),
      };
    }
    if (job?.status === "failed") {
      throw new Error(job.error || "Failed to create property");
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  throw new Error("Property create timed out — check server logs for create-job");
}
