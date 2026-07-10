import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import axios from "axios";
import { endpoints } from "../constants";
import { isValidUploadSessionId } from "../services/propertyUploadSessions";

interface UploadProgress {
  uploadId: string;
  status: "uploading" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface UseUploadProgressOptions {
  enabled?: boolean;
  pollInterval?: number;
  onComplete?: (data: UploadProgress) => void;
  onError?: (error: string) => void;
  maxRetries?: number;
}

/** CDN chunk uploads use 16-char hex IDs; HLS pipeline uses UUIDs. */
function isChunkUploadId(id: string): boolean {
  return /^[a-f0-9]{16}$/i.test(String(id || "").trim());
}

export const useUploadProgress = (
  uploadId: string | null,
  options: UseUploadProgressOptions = {},
) => {
  const {
    enabled = true,
    pollInterval = 5000,
    onComplete,
    onError,
    maxRetries = 4,
  } = options;

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notFoundCountRef = useRef(0);
  const pollDelayRef = useRef(pollInterval);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const scheduleNextPoll = useCallback(
    (delayMs: number) => {
      stopPolling();
      pollingRef.current = setTimeout(() => {
        void fetchProgressRef.current?.();
      }, delayMs);
    },
    [stopPolling],
  );

  const fetchProgressRef = useRef<(() => Promise<void>) | null>(null);

  const fetchProgress = useCallback(async () => {
    const id = uploadId?.trim() ?? "";
    if (!id || !enabled || !isValidUploadSessionId(id)) {
      stopPolling();
      return;
    }
    if (appStateRef.current !== "active") {
      scheduleNextPoll(Math.max(pollInterval, 8000));
      return;
    }

    try {
      setIsLoading(true);
      const url = isChunkUploadId(id)
        ? `${endpoints.baseURL}/upload/video/${id}/status`
        : `${endpoints.baseURL}/api/v1/media/status/${id}`;

      const response = await axios.get(url, { timeout: 8000 });
      const raw = response.data ?? {};

      let normalized: UploadProgress;
      if (isChunkUploadId(id)) {
        const total = Number(raw.totalChunks ?? raw.total ?? 1) || 1;
        const uploaded = Number(raw.uploaded ?? raw.received?.length ?? 0);
        const pct = Math.min(99, Math.round((uploaded / total) * 100));
        normalized = {
          uploadId: id,
          status: uploaded >= total ? "completed" : "uploading",
          progress: pct,
        };
      } else {
        normalized = raw as UploadProgress;
      }

      notFoundCountRef.current = 0;
      pollDelayRef.current = pollInterval;
      setProgress(normalized);

      if (normalized.status === "completed") {
        onCompleteRef.current?.(normalized);
        stopPolling();
        return;
      }
      if (normalized.status === "failed") {
        onErrorRef.current?.(normalized.error || "Upload failed");
        stopPolling();
        return;
      }

      scheduleNextPoll(pollDelayRef.current);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        notFoundCountRef.current += 1;
        if (notFoundCountRef.current >= maxRetries) {
          onErrorRef.current?.(
            "Upload session not found — upload may have expired or failed",
          );
          stopPolling();
          return;
        }
        pollDelayRef.current = Math.min(pollDelayRef.current * 1.5, 15_000);
      } else {
        pollDelayRef.current = Math.min(pollDelayRef.current * 1.25, 20_000);
      }
      scheduleNextPoll(pollDelayRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [
    uploadId,
    enabled,
    maxRetries,
    pollInterval,
    scheduleNextPoll,
    stopPolling,
  ]);

  fetchProgressRef.current = fetchProgress;

  const startPolling = useCallback(() => {
    stopPolling();
    notFoundCountRef.current = 0;
    pollDelayRef.current = pollInterval;
    void fetchProgress();
  }, [fetchProgress, pollInterval, stopPolling]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
      if (next === "active" && uploadId && enabled) {
        startPolling();
      }
    });
    return () => sub.remove();
  }, [uploadId, enabled, startPolling]);

  useEffect(() => {
    if (uploadId && enabled && isValidUploadSessionId(uploadId)) {
      startPolling();
    } else {
      stopPolling();
      setProgress(null);
    }
    return () => stopPolling();
  }, [uploadId, enabled, startPolling, stopPolling]);

  return {
    progress,
    isLoading,
    startPolling,
    stopPolling,
  };
};
