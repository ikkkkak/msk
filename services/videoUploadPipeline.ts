/**
 * Rent video upload: chunked CDN upload → create record → realtime processing wait.
 */

import axios from "axios";
import { videoEndpoints } from "../constants";
import type { CreateVideoInput } from "../types/video";
import { uploadVideoChunked } from "./videoChunkUpload";
import { waitForVideoProcessing } from "./videoProcessingRealtime";
import { uploadThumbnail } from "./videoUploadLegacy";

export type VideoUploadProgress = {
  phase:
    | "idle"
    | "uploading"
    | "creating"
    | "processing"
    | "done"
    | "error";
  percent: number;
  message?: string;
  uploadedChunks?: number;
  totalChunks?: number;
};

export type VideoUploadResult = {
  video: {
    ID: number;
    videoURL: string;
    hlsURL?: string;
    processingStatus?: string;
    spriteSheetURL?: string;
  };
};

type UploadCallbacks = {
  onProgress?: (p: VideoUploadProgress) => void;
  accessToken: string;
};

export async function uploadRentVideoPipeline(
  params: {
    localVideoUri: string;
    mime: string;
    propertyID: number;
    durationSec?: number;
    thumbnailUri?: string;
    caption?: string;
    /** When false (default), host is not blocked on HLS — processing continues in background. */
    waitForHls?: boolean;
    /** Chunked resumable upload (default true) */
    useChunkedUpload?: boolean;
  },
  callbacks: UploadCallbacks,
): Promise<VideoUploadResult> {
  const { onProgress, accessToken } = callbacks;
  const report = (p: VideoUploadProgress) => onProgress?.(p);

  if (params.useChunkedUpload === false) {
    throw new Error(
      "Base64 video upload is disabled — use chunked upload for reliability",
    );
  }

  const videoURL = await uploadVideoChunked(
    params.localVideoUri,
    params.mime,
    accessToken,
    (cp) => {
      report({
        phase: cp.phase === "merging" ? "uploading" : cp.phase,
        percent: Math.min(cp.percent, 55),
        uploadedChunks: cp.uploadedChunks,
        totalChunks: cp.totalChunks,
      });
    },
  );

  let thumbnailURL: string | undefined;
  if (params.thumbnailUri) {
    thumbnailURL = await uploadThumbnail(
      params.thumbnailUri,
      accessToken,
    ).catch(() => undefined);
  }

  report({ phase: "creating", percent: 58 });
  const payload: CreateVideoInput = {
    propertyID: params.propertyID,
    videoURL,
    thumbnailURL,
    durationSec: params.durationSec,
    caption: params.caption,
  };
  const createRes = await axios.post(videoEndpoints.create, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const video = createRes.data?.video;
  if (!video?.ID) {
    throw new Error("Failed to register video");
  }

  if (params.waitForHls === true) {
    report({
      phase: "processing",
      percent: 65,
      message: "Optimizing for feed…",
    });
    const update = await waitForVideoProcessing({
      accessToken,
      videoId: video.ID,
    });
    report({ phase: "done", percent: 100 });
    return {
      video: {
        ...video,
        hlsURL: update.hlsURL || video.hlsURL,
        processingStatus: "ready",
        spriteSheetURL: update.spriteSheetURL,
      },
    };
  }

  report({ phase: "done", percent: 100 });
  return { video };
}
