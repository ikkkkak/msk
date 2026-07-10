/**
 * Offline mutation queue — likes, saves, etc. Batched via POST /sync/mutations.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import {
  batchMutationLimit,
  getConnectionQuality,
  shouldQueueMutations,
} from "./connectivityBridge";

const QUEUE_KEY = "@mutationQueue_v1";

export type MutationAction =
  | "sale_video_like"
  | "sale_video_unlike"
  | "sale_video_save"
  | "sale_video_unsave";

export type MutationStatus = "queued" | "inflight" | "done" | "failed";

export type QueuedMutation = {
  id: string;
  action: MutationAction;
  entityId: number;
  accessToken: string;
  priority: 1 | 2 | 3;
  createdAt: number;
  retryCount: number;
  nextRetryAt: number;
  status: MutationStatus;
  lastError?: string;
};

type QueueListener = (jobs: QueuedMutation[]) => void;
const listeners = new Set<QueueListener>();
let memoryCache: QueuedMutation[] | null = null;
let processing = false;

function emit(jobs: QueuedMutation[]) {
  memoryCache = jobs;
  listeners.forEach((fn) => {
    try {
      fn(jobs);
    } catch {
      /* ignore */
    }
  });
}

export function generateMutationId(): string {
  return `cm_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function getMutationQueue(): Promise<QueuedMutation[]> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) {
      emit([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    const jobs = (Array.isArray(parsed) ? parsed : []) as QueuedMutation[];
    emit(jobs);
    return jobs;
  } catch {
    emit([]);
    return [];
  }
}

function persistAsync(queue: QueuedMutation[]): void {
  emit(queue);
  void AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
}

export function enqueueMutationImmediate(
  job: Omit<
    QueuedMutation,
    "createdAt" | "retryCount" | "nextRetryAt" | "status" | "priority"
  > & { priority?: 1 | 2 | 3 },
): QueuedMutation {
  const queue = memoryCache ? [...memoryCache] : [];
  const full: QueuedMutation = {
    priority: 1,
    createdAt: Date.now(),
    retryCount: 0,
    nextRetryAt: Date.now(),
    status: "queued",
    ...job,
  };
  // Coalesce: same action+entity replaces pending row
  const deduped = queue.filter(
    (j) =>
      !(
        j.status === "queued" &&
        j.action === full.action &&
        j.entityId === full.entityId
      ),
  );
  deduped.push(full);
  persistAsync(deduped);
  return full;
}

export async function removeMutation(id: string): Promise<void> {
  const queue = await getMutationQueue();
  persistAsync(queue.filter((j) => j.id !== id));
}

export async function updateMutation(
  id: string,
  patch: Partial<QueuedMutation>,
): Promise<void> {
  const queue = await getMutationQueue();
  const idx = queue.findIndex((j) => j.id === id);
  if (idx < 0) return;
  queue[idx] = { ...queue[idx], ...patch };
  persistAsync(queue);
}

export function mutationBackoffMs(retryCount: number): number {
  return Math.min(60_000, 1_000 * 2 ** Math.max(0, retryCount));
}

function isNetworkError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; response?: unknown };
  if (!e?.response && e?.message) {
    const m = e.message.toLowerCase();
    return (
      m.includes("network") ||
      m.includes("timeout") ||
      e.code === "ERR_NETWORK" ||
      e.code === "ECONNABORTED"
    );
  }
  return false;
}

export async function flushMutationQueue(): Promise<number> {
  if (processing) return 0;
  if (shouldQueueMutations() && getConnectionQuality() === "offline") return 0;

  processing = true;
  let applied = 0;
  try {
    let queue = await getMutationQueue();
    const pending = queue
      .filter((j) => j.status === "queued" && Date.now() >= j.nextRetryAt)
      .sort((a, b) => a.createdAt - b.createdAt);

    const limit = batchMutationLimit();
    const batch = pending.slice(0, limit);
    if (batch.length === 0) return 0;

    for (const job of batch) {
      await updateMutation(job.id, { status: "inflight" });
    }

    const token = batch[0].accessToken;
    try {
      const res = await api.post(
        "/sync/mutations",
        {
          mutations: batch.map((j) => ({
            clientMutationId: j.id,
            action: j.action,
            entityId: j.entityId,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30_000,
        },
      );

      const results = (res.data?.results ?? []) as Array<{
        clientMutationId: string;
        status: string;
      }>;
      for (const job of batch) {
        const r = results.find((x) => x.clientMutationId === job.id);
        if (r && (r.status === "applied" || r.status === "duplicate")) {
          await removeMutation(job.id);
          applied++;
        } else {
          await updateMutation(job.id, {
            status: "queued",
            retryCount: job.retryCount + 1,
            nextRetryAt: Date.now() + mutationBackoffMs(job.retryCount + 1),
            lastError: r?.status ?? "rejected",
          });
        }
      }
    } catch (err) {
      const retryable = isNetworkError(err);
      for (const job of batch) {
        if (retryable && job.retryCount < 8) {
          await updateMutation(job.id, {
            status: "queued",
            retryCount: job.retryCount + 1,
            nextRetryAt: Date.now() + mutationBackoffMs(job.retryCount + 1),
            lastError: String((err as Error)?.message ?? err),
          });
        } else {
          await updateMutation(job.id, {
            status: "failed",
            lastError: String((err as Error)?.message ?? err),
          });
        }
      }
    }
  } finally {
    processing = false;
  }
  return applied;
}

export type SaleVideoMutationResult = {
  videoID: number;
  likesCount?: number;
  savesCount?: number;
  liked?: boolean;
  saved?: boolean;
  queued?: boolean;
};

/** Execute immediately or enqueue for weak/offline networks. */
export async function executeSaleVideoMutation(opts: {
  action: MutationAction;
  videoID: number;
  accessToken: string;
}): Promise<SaleVideoMutationResult> {
  const { action, videoID, accessToken } = opts;

  if (shouldQueueMutations()) {
    enqueueMutationImmediate({
      id: generateMutationId(),
      action,
      entityId: videoID,
      accessToken,
    });
    void flushMutationQueue();
    return {
      videoID,
      queued: true,
      liked: action === "sale_video_like" ? true : action === "sale_video_unlike" ? false : undefined,
      saved: action === "sale_video_save" ? true : action === "sale_video_unsave" ? false : undefined,
    };
  }

  const path =
    action === "sale_video_like"
      ? `/property-sale-videos/${videoID}/like`
      : action === "sale_video_unlike"
        ? `/property-sale-videos/${videoID}/unlike`
        : action === "sale_video_save"
          ? `/property-sale-videos/${videoID}/save`
          : `/property-sale-videos/${videoID}/unsave`;

  const mutationId = generateMutationId();
  try {
    const res = await api.post(path, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Client-Mutation-Id": mutationId,
      },
      timeout: 12_000,
    });
    const d = res.data ?? {};
    return {
      videoID,
      likesCount: d.likesCount ?? d.likeCount,
      savesCount: d.savesCount ?? d.saveCount,
      liked: d.liked ?? d.isLikedByUser,
      saved: d.saved ?? d.isSavedByUser,
      queued: false,
    };
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueMutationImmediate({
        id: mutationId,
        action,
        entityId: videoID,
        accessToken,
      });
      void flushMutationQueue();
      return {
        videoID,
        queued: true,
        liked: action === "sale_video_like" ? true : action === "sale_video_unlike" ? false : undefined,
        saved: action === "sale_video_save" ? true : action === "sale_video_unsave" ? false : undefined,
      };
    }
    throw err;
  }
}

export async function clearMutationQueue(): Promise<void> {
  persistAsync([]);
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {
    /* ignore */
  }
}

export function subscribeMutationQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  void getMutationQueue().then(listener);
  return () => listeners.delete(listener);
}
