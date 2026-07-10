import { API_PATHS } from "../constants/apiPaths";
import type {
  ListingAiDraft,
  ListingAiGenerateInput,
  ListingAiJob,
} from "../types/listingAi";
import { api } from "./api";
import { tokenStorage } from "./tokenStorage";

const authHeaders = () => {
  const token = tokenStorage.getAccess();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Enqueue async listing AI job; returns job id. */
export async function startListingAiJob(
  input: ListingAiGenerateInput,
): Promise<string> {
  const res = await api.post(API_PATHS.listingAiJobs, input, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    timeout: 45_000,
  });
  const id = res.data?.data?.job_id;
  if (!id) throw new Error("No job id returned");
  return String(id);
}

/** Poll job until completed, failed, or timeout. */
export async function pollListingAiJob(
  jobId: string,
  onProgress?: (progress: string) => void,
  maxMs = 180_000,
  signal?: AbortSignal,
): Promise<ListingAiDraft> {
  const started = Date.now();
  let polls = 0;
  while (Date.now() - started < maxMs) {
    if (signal?.aborted) {
      throw new Error("AI generation cancelled");
    }
    const res = await api.get(API_PATHS.listingAiJob(jobId), {
      headers: authHeaders(),
      timeout: 20_000,
      signal,
    });
    const job = res.data?.data as ListingAiJob;
    if (job?.progress && onProgress) onProgress(job.progress);

    if (job?.status === "completed" && job.result) {
      return job.result;
    }
    if (job?.status === "failed") {
      throw new Error(job.error || "AI generation failed");
    }
    polls += 1;
    const delay = polls < 6 ? 900 : polls < 15 ? 1200 : 1500;
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error(
    "AI generation timed out — check your connection and try again. If this keeps happening, restart the API server.",
  );
}

/** Report that the user published or applied an AI draft (rent/land manual submit or sale publish). */
export async function recordListingAiPublished(
  kind: ListingAiGenerateInput["kind"],
  jobId?: string,
): Promise<void> {
  try {
    await api.post(
      API_PATHS.listingAiEvents,
      { kind, event: "published", job_id: jobId ?? "" },
      {
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        timeout: 15_000,
      },
    );
  } catch {
    /* analytics must not block listing flow */
  }
}
