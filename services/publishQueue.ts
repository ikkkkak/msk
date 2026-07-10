/**
 * Background property-sale publish queue — persists jobs, tracks % progress,
 * resumes after app restart.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import type { PropertySaleFormPayload } from "./propertySalePublish";
import type { PublishStage } from "../utils/publishProgress";

const QUEUE_KEY = "@publishQueue_jobs_v2";

export type PublishJobStatus = "queued" | "running" | "completed" | "failed";

export interface PublishJob {
  id: string;
  accessToken: string;
  form: PropertySaleFormPayload;
  images: string[];
  video: { uri: string; mimeType?: string } | null;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  title: string;
  previewUri?: string;
  price?: number;
  city?: string;
  percent: number;
  stage: PublishStage;
  step?: string;
  status: PublishJobStatus;
  propertyId?: number;
  source: "manual" | "ai";
  listingAiJobId?: string;
  lastProgressAt?: number;
  /** Cached CDN URLs — skip re-upload on retry */
  uploadedImageUrls?: string[];
  uploadedVideoUrls?: string[];
  /** @deprecated legacy jobs only */
  submitData?: Record<string, unknown>;
}

export type PublishJobMeta = {
  title: string;
  previewUri?: string;
  price?: number;
  city?: string;
  source?: "manual" | "ai";
  listingAiJobId?: string;
};

type QueueListener = (jobs: PublishJob[]) => void;
const listeners = new Set<QueueListener>();
let memoryCache: PublishJob[] | null = null;

function emit(jobs: PublishJob[]) {
  memoryCache = jobs;
  listeners.forEach((fn) => {
    try {
      fn(jobs);
    } catch {
      /* ignore listener errors */
    }
  });
}

export const generateJobId = () =>
  `publish_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function normalizeJob(raw: Partial<PublishJob>): PublishJob | null {
  if (!raw?.id || !raw.accessToken) return null;
  return {
    id: String(raw.id),
    accessToken: String(raw.accessToken),
    form: (raw.form ?? {}) as PropertySaleFormPayload,
    images: Array.isArray(raw.images) ? raw.images : [],
    video: raw.video ?? null,
    createdAt: Number(raw.createdAt) || Date.now(),
    retryCount: Number(raw.retryCount) || 0,
    lastError: raw.lastError,
    title: String(raw.title || "New listing"),
    previewUri: raw.previewUri,
    price: raw.price,
    city: raw.city,
    percent: Math.min(100, Math.max(0, Number(raw.percent) || 0)),
    stage: (raw.stage as PublishStage) || "health",
    step: raw.step,
    status: (raw.status as PublishJobStatus) || "queued",
    propertyId: raw.propertyId,
    source: raw.source === "ai" ? "ai" : "manual",
    listingAiJobId: raw.listingAiJobId,
    lastProgressAt: Number(raw.lastProgressAt) || Number(raw.createdAt) || Date.now(),
    uploadedImageUrls: Array.isArray(raw.uploadedImageUrls)
      ? raw.uploadedImageUrls.filter(Boolean).map(String)
      : undefined,
    uploadedVideoUrls: Array.isArray(raw.uploadedVideoUrls)
      ? raw.uploadedVideoUrls.filter(Boolean).map(String)
      : undefined,
    submitData: raw.submitData,
  };
}

export function getQueueSync(): PublishJob[] {
  return memoryCache ?? [];
}

export const getQueue = async (): Promise<PublishJob[]> => {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) {
      emit([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    const jobs = (Array.isArray(parsed) ? parsed : [])
      .map((j) => normalizeJob(j))
      .filter(Boolean) as PublishJob[];
    emit(jobs);
    return jobs;
  } catch {
    emit([]);
    return [];
  }
};

function persistQueueAsync(queue: PublishJob[]): void {
  emit(queue);
  void AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {
    /* persistence is best-effort; UI already updated */
  });
}

async function persistQueue(queue: PublishJob[]): Promise<void> {
  persistQueueAsync(queue);
}

export const subscribeToQueue = (listener: QueueListener): (() => void) => {
  listeners.add(listener);
  if (memoryCache) {
    listener(memoryCache);
  } else {
    void getQueue().then((jobs) => listener(jobs));
  }
  return () => listeners.delete(listener);
};

/** Synchronous enqueue — listeners fire before AsyncStorage write (instant UI). */
export function enqueueJobImmediate(
  job: Omit<
    PublishJob,
    "createdAt" | "retryCount" | "percent" | "stage" | "status"
  > &
    Partial<
      Pick<
        PublishJob,
        "createdAt" | "retryCount" | "percent" | "stage" | "status" | "step"
      >
    >,
): PublishJob {
  const queue = memoryCache ? [...memoryCache] : [];
  const full: PublishJob = {
    retryCount: 0,
    percent: 5,
    stage: "health",
    status: "queued",
    step: "queued",
    createdAt: Date.now(),
    lastProgressAt: Date.now(),
    source: "manual",
    ...job,
  };
  queue.push(full);
  persistQueueAsync(queue);
  return full;
}

export const addToQueue = async (
  job: Omit<
    PublishJob,
    "createdAt" | "retryCount" | "percent" | "stage" | "status"
  > &
    Partial<Pick<PublishJob, "createdAt" | "retryCount" | "percent" | "stage" | "status">>,
): Promise<PublishJob> => {
  return enqueueJobImmediate(job);
};

export const removeFromQueue = async (jobId: string): Promise<void> => {
  const queue = await getQueue();
  await persistQueue(queue.filter((j) => j.id !== jobId));
};

export const updateJob = async (
  jobId: string,
  updates: Partial<PublishJob>,
): Promise<void> => {
  const queue = await getQueue();
  const idx = queue.findIndex((j) => j.id === jobId);
  if (idx < 0) return;
  const touchProgress =
    updates.percent !== undefined ||
    updates.stage !== undefined ||
    updates.step !== undefined ||
    updates.status !== undefined;
  queue[idx] = {
    ...queue[idx],
    ...updates,
    ...(touchProgress ||
    updates.uploadedImageUrls !== undefined ||
    updates.uploadedVideoUrls !== undefined
      ? { lastProgressAt: Date.now() }
      : null),
  };
  await persistQueue(queue);
};

export const getActiveJobs = (jobs: PublishJob[]): PublishJob[] =>
  jobs.filter((j) => j.status === "queued" || j.status === "running");

export const getVisibleJobs = (jobs: PublishJob[]): PublishJob[] =>
  jobs.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "running" ||
      j.status === "failed" ||
      (j.status === "completed" && Date.now() - j.createdAt < 8_000),
  );

export const getNextRetryDelay = (retryCount: number): number => {
  const base = 2000;
  const max = 60000;
  return Math.min(base * 2 ** retryCount, max);
};

const STALE_PUBLISH_JOB_MS = 30 * 60 * 1000;
const HEALTH_STUCK_MS = 3 * 60 * 1000;
const PROCESSOR_STALL_MS = 3 * 60 * 1000;

/** Jobs waiting to publish (queued, running, or failed — user must retry/dismiss). */
export const getPendingPublishJobs = (jobs: PublishJob[]): PublishJob[] =>
  jobs.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "running" ||
      j.status === "failed",
  );

/** Re-queue jobs stuck in `running` with no progress (app crash / lost processor). */
export async function recoverStuckPublishJobs(): Promise<boolean> {
  const queue = await getQueue();
  const now = Date.now();
  let changed = false;
  const next = queue.map((j) => {
    if (j.status !== "running") return j;
    const lastAt = j.lastProgressAt ?? j.createdAt;
    if (now - lastAt < PROCESSOR_STALL_MS) return j;
    changed = true;
    return {
      ...j,
      status: "queued" as PublishJobStatus,
      lastError: undefined,
      step: "resumed",
    };
  });
  if (changed) await persistQueue(next);
  return changed;
}

/** Full queue health pass — call on app focus and on a timer. */
export async function runPublishQueueHealthCheck(): Promise<void> {
  await expireStalePublishJobs();
  await recoverStuckPublishJobs();
}

/** Fail jobs stuck in queued/running too long (or frozen at health 0%). */
export async function expireStalePublishJobs(): Promise<void> {
  const queue = await getQueue();
  const now = Date.now();
  let changed = false;
  const next = queue.map((j) => {
    const age = now - j.createdAt;
    const frozenAtHealth =
      j.status === "running" &&
      j.stage === "health" &&
      (j.percent ?? 0) <= 5 &&
      age > HEALTH_STUCK_MS;
    if (
      ((j.status === "queued" || j.status === "running") &&
        age > STALE_PUBLISH_JOB_MS) ||
      frozenAtHealth
    ) {
      changed = true;
      return {
        ...j,
        status: "failed" as PublishJobStatus,
        lastError:
          j.lastError ||
          (frozenAtHealth
            ? i18n.t("organization.publishStalled", {
                defaultValue:
                  "Publish stalled — sign in and tap Retry, or dismiss",
              })
            : i18n.t("organization.publishTimedOut", {
                defaultValue:
                  "Publish timed out — tap Retry or dismiss to clear this card",
              })),
      };
    }
    return j;
  });
  if (changed) await persistQueue(next);
}
