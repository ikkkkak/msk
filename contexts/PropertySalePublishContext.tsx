import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  enqueueJobImmediate,
  expireStalePublishJobs,
  generateJobId,
  getActiveJobs,
  getNextRetryDelay,
  getQueueSync,
  getQueue,
  getVisibleJobs,
  removeFromQueue,
  runPublishQueueHealthCheck,
  subscribeToQueue,
  updateJob,
  type PublishJob,
} from "../services/publishQueue";
import { navigateToOrganizationsTab } from "../navigation/rootNavigation";
import {
  publishPropertySale,
  type PropertySaleFormPayload,
  type PublishProgressUpdate,
} from "../services/propertySalePublish";
import { recordListingAiPublished } from "../services/listingAiService";
import { clearPropertyUploadSession } from "../services/propertyUploadSessions";
import { seedListingImageUploadCache } from "../services/listingImageUploadCache";
import { schedulePublishWorker } from "../services/publishProcessorLock";
import { tokenStorage } from "../services/tokenStorage";
import i18n from "../i18n";
import { endpoints } from "../constants";
import type { PublishJobMeta } from "../services/publishQueue";
import type { PublishStage } from "../utils/publishProgress";

type StartPublishParams = {
  accessToken: string;
  form: PropertySaleFormPayload;
  images: string[];
  video: { uri: string; mimeType?: string } | null;
  meta: PublishJobMeta;
};

type ContextValue = {
  jobs: PublishJob[];
  activeJobs: PublishJob[];
  startBackgroundPublish: (params: StartPublishParams) => string;
  dismissJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
};

const PropertySalePublishContext = createContext<ContextValue | null>(null);

let processingJobId: string | null = null;

/** Fresh heartbeat means another worker pass is not needed yet. */
const RUNNING_JOB_GRACE_MS = 45_000;

async function runLegacyJob(job: PublishJob): Promise<{ id: number }> {
  if (!job.submitData) throw new Error("Missing legacy submit payload");
  const response = await axios.post(endpoints.propertySalesRoot, job.submitData, {
    headers: { Authorization: `Bearer ${job.accessToken}` },
    timeout: 120_000,
  });
  const id = Number(response.data?.id ?? response.data?.ID ?? 0);
  if (!id) throw new Error("No property id returned");
  return { id };
}

async function runModernJob(
  job: PublishJob,
  onProgress: (p: PublishProgressUpdate) => void,
): Promise<{ id: number }> {
  seedListingImageUploadCache(job.images, job.uploadedImageUrls ?? []);
  return publishPropertySale({
    accessToken: job.accessToken,
    form: job.form,
    images: job.images,
    video: job.video,
    cachedImageUrls: job.uploadedImageUrls,
    cachedVideoUrls: job.uploadedVideoUrls,
    onProgress,
    onImageUploaded: async (_index, _url, urls) => {
      const cleaned = urls.filter((u) => u && /^https?:\/\//i.test(u));
      if (cleaned.length === 0) return;
      await updateJob(job.id, {
        uploadedImageUrls: urls.map((u) =>
          u && /^https?:\/\//i.test(u) ? u : "",
        ),
      });
    },
    onMediaCached: async (images, videos) => {
      await updateJob(job.id, {
        uploadedImageUrls: images.length ? images : undefined,
        uploadedVideoUrls: videos.length ? videos : undefined,
      });
    },
  });
}

export function PropertySalePublishProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const retryTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const invalidateListings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["user-properties"] });
    void queryClient.invalidateQueries({ queryKey: ["organization-properties"] });
    void queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
  }, [queryClient]);

  const processQueue = useCallback(() => {
    schedulePublishWorker(async () => {
      await runPublishQueueHealthCheck();
      const queue = await getQueue();
      const next = queue.find(
        (j) => j.status === "queued" || j.status === "running",
      );
      if (!next) return;

      if (processingJobId === next.id) return;

      if (next.status === "running") {
        const lastAt = next.lastProgressAt ?? next.createdAt;
        if (Date.now() - lastAt < RUNNING_JOB_GRACE_MS) return;
      }

      const accessToken = tokenStorage.getAccess() || next.accessToken;
      if (!accessToken) {
        await updateJob(next.id, {
          status: "failed",
          lastError: i18n.t("organization.sessionExpiredSignIn", {
            defaultValue: "Session expired — sign in again",
          }),
        });
        processQueue();
        return;
      }
      const jobToRun =
        accessToken !== next.accessToken ? { ...next, accessToken } : next;
      if (accessToken !== next.accessToken) {
        await updateJob(next.id, { accessToken });
      }

      processingJobId = jobToRun.id;

      const heartbeat = setInterval(() => {
        void updateJob(jobToRun.id, { lastProgressAt: Date.now() });
      }, 15_000);

      if (jobToRun.status !== "running") {
        await updateJob(jobToRun.id, {
          status: "running",
          percent: 5,
          stage: "health",
          step: "starting",
        });
      }

      let lastPercent = -1;
      let lastStage: PublishStage | undefined;
      const onProgress = ({ percent, stage, step }: PublishProgressUpdate) => {
        if (percent === lastPercent && stage === lastStage) return;
        lastPercent = percent;
        lastStage = stage;
        void updateJob(jobToRun.id, { percent, stage, step });
      };

      try {
        let result: { id: number };
        if (jobToRun.submitData && !jobToRun.form?.title) {
          await updateJob(jobToRun.id, { percent: 70, stage: "create" });
          result = await runLegacyJob(jobToRun);
          await updateJob(jobToRun.id, { percent: 100, stage: "finalize" });
        } else {
          result = await runModernJob(jobToRun, onProgress);
        }

        await updateJob(jobToRun.id, {
          status: "completed",
          percent: 100,
          stage: "finalize",
          step: "complete",
          propertyId: result.id,
        });

        if (jobToRun.source === "ai") {
          void recordListingAiPublished("sale", jobToRun.listingAiJobId);
        }

        if (result.id) {
          void clearPropertyUploadSession(result.id);
        }

        invalidateListings();

        setTimeout(() => {
          void removeFromQueue(jobToRun.id);
        }, 5_000);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err && "message" in err
              ? String((err as { message: unknown }).message)
              : "Publish failed";
        const isAuthError =
          /401|403|unauthorized|not authenticated|session expired/i.test(msg);
        const isRetryable =
          !isAuthError &&
          /network|timeout|timed out|connection|503|502|504/i.test(msg);
        const retryCount = (jobToRun.retryCount || 0) + 1;

        if (isRetryable && retryCount < 4) {
          await updateJob(jobToRun.id, {
            status: "queued",
            retryCount,
            lastError: msg,
            percent: Math.max(jobToRun.percent ?? 5, 5),
            stage: "health",
          });
          const delay = getNextRetryDelay(retryCount);
          const timer = setTimeout(() => {
            retryTimers.current.delete(jobToRun.id);
            processQueue();
          }, delay);
          retryTimers.current.set(jobToRun.id, timer);
        } else {
          await updateJob(jobToRun.id, {
            status: "failed",
            lastError: isAuthError
              ? i18n.t("organization.sessionExpiredRetry", {
                  defaultValue: "Session expired — sign in and tap Retry",
                })
              : msg,
          });
        }
      } finally {
        clearInterval(heartbeat);
        if (processingJobId === jobToRun.id) {
          processingJobId = null;
        }
        const remaining = await getQueue();
        if (getActiveJobs(remaining).length > 0) {
          processQueue();
        }
      }
    });
  }, [invalidateListings]);

  useEffect(() => {
    void getQueue().then(() => {
      processQueue();
    });
  }, [processQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      void runPublishQueueHealthCheck().then(() => {
        if (!processingJobId) processQueue();
      });
    }, 20_000);
    return () => clearInterval(interval);
  }, [processQueue]);

  useEffect(() => {
    return subscribeToQueue(setJobs);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void processQueue();
    });
    return () => {
      sub.remove();
      retryTimers.current.forEach((t) => clearTimeout(t));
      retryTimers.current.clear();
    };
  }, [processQueue]);

  const startBackgroundPublish = useCallback(
    (params: StartPublishParams): string => {
      const titleKey = (
        params.meta.title ||
        params.form.title ||
        "New listing"
      )
        .trim()
        .toLowerCase();
      const active = getActiveJobs(getQueueSync());
      const duplicate = active.find((j) => {
        const sameTitle =
          (j.title || j.form?.title || "").trim().toLowerCase() === titleKey;
        const sameMedia =
          j.images.length === params.images.length &&
          j.images.every((uri, i) => uri === params.images[i]) &&
          (j.video?.uri || "") === (params.video?.uri || "");
        return sameTitle || sameMedia;
      });
      if (duplicate) {
        navigateToOrganizationsTab();
        return duplicate.id;
      }

      const id = generateJobId();
      enqueueJobImmediate({
        id,
        accessToken: params.accessToken,
        form: params.form,
        images: params.images,
        video: params.video,
        title: params.meta.title || params.form.title || "New listing",
        previewUri: params.meta.previewUri,
        price: params.meta.price ?? params.form.price,
        city: params.meta.city ?? params.form.city,
        source: params.meta.source ?? "manual",
        listingAiJobId: params.meta.listingAiJobId,
      });
      navigateToOrganizationsTab();
      void processQueue();
      return id;
    },
    [processQueue],
  );

  const dismissJob = useCallback(async (jobId: string) => {
    const timer = retryTimers.current.get(jobId);
    if (timer) {
      clearTimeout(timer);
      retryTimers.current.delete(jobId);
    }
    await removeFromQueue(jobId);
  }, []);

  const retryJob = useCallback(
    async (jobId: string) => {
      await runPublishQueueHealthCheck();
      await updateJob(jobId, {
        status: "queued",
        percent: 5,
        stage: "health",
        step: "manual_retry",
        lastError: undefined,
        retryCount: 0,
      });
      processQueue();
    },
    [processQueue],
  );

  const value = useMemo<ContextValue>(
    () => ({
      jobs: getVisibleJobs(jobs),
      activeJobs: getActiveJobs(jobs),
      startBackgroundPublish,
      dismissJob,
      retryJob,
    }),
    [jobs, startBackgroundPublish, dismissJob, retryJob],
  );

  return (
    <PropertySalePublishContext.Provider value={value}>
      {children}
    </PropertySalePublishContext.Provider>
  );
}

export function usePropertySalePublish(): ContextValue {
  const ctx = useContext(PropertySalePublishContext);
  if (!ctx) {
    throw new Error(
      "usePropertySalePublish must be used within PropertySalePublishProvider",
    );
  }
  return ctx;
}
