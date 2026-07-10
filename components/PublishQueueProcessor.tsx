/**
 * Processes persisted publish jobs in the background.
 * Resumes on app launch and when app returns to foreground.
 */

import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  getQueue,
  removeFromQueue,
  updateJob,
  getNextRetryDelay,
  PublishJob,
} from "../services/publishQueue";
import { endpoints } from "../constants";

let processingRef = false;

const processQueue = async (onSuccess?: () => void) => {
  if (processingRef) return;
  processingRef = true;

  try {
    const queue = await getQueue();
    for (const job of queue) {
      try {
        const response = await axios.post(endpoints.propertySalesRoot, job.submitData, {
          headers: { Authorization: `Bearer ${job.accessToken}` },
          timeout: 60000,
        });

        if (response.data) {
          await removeFromQueue(job.id);
          onSuccess?.();
        }
      } catch (err: any) {
        const isRetryable =
          !err?.response || (err.response?.status >= 500) || err?.message?.includes("Network");
        const retryCount = (job.retryCount || 0) + 1;

        if (isRetryable && retryCount < 5) {
          await updateJob(job.id, {
            retryCount,
            lastError: err?.response?.data?.error || err?.message,
          });
          const delay = getNextRetryDelay(retryCount);
          setTimeout(() => processQueue(onSuccess), delay);
        } else {
          await removeFromQueue(job.id);
          // Job failed permanently - could notify user
        }
      }
    }
  } finally {
    processingRef = false;
  }
};

export const PublishQueueProcessor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const queryClient = useQueryClient();

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["organization-properties"] });
    queryClient.invalidateQueries({ queryKey: ["publicPropertySales"] });
  };

  useEffect(() => {
    processQueue(onSuccess);

    const sub = AppState.addEventListener("change", (nextState) => {
      if (appState.current === "background" && nextState === "active") {
        processQueue(onSuccess);
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, [queryClient]);

  return <>{children}</>;
};
