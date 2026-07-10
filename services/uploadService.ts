import axios, { AxiosProgressEvent } from "axios";
import * as FileSystem from "expo-file-system";
import { useCallback, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.meskeny.mr";

interface UploadProgress {
  phase:
    | "idle"
    | "picking"
    | "compressing"
    | "uploading"
    | "processing"
    | "done"
    | "error";
  progress: number; // 0-100
  message?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
}

/**
 * uploadVideoChunked - Resume-able chunked video upload
 *
 * Strategy:
 * 1. Client compresses video to H.264 720p, 2Mbps
 * 2. POST /api/v1/media/upload/video/init → get uploadId
 * 3. PUT /api/v1/media/upload/video/{uploadId}/chunk/{i} → stream each chunk
 * 4. POST /api/v1/media/upload/video/{uploadId}/complete → assemble and enqueue HLS
 * 5. Poll GET /api/v1/media/status/{uploadId} until "ready" or "failed"
 */
export async function uploadVideoChunked(
  videoUri: string,
  totalSize: number,
  propertyId: string,
  onProgress: (percent: number) => void,
  onError: (error: string) => void
): Promise<{ hlsUrl: string; thumbnailUrl: string }> {
  try {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    // Step 1: Initiate chunked upload
    const initRes = await axios.post(
      `${API_BASE}/api/v1/media/upload/video/init`,
      {
        totalChunks,
        totalSize,
        propertyId,
        mime: "video/mp4"
      }
    );

    const uploadId: string = initRes.data.uploadId;
    console.log("[uploadVideoChunked] Started upload:", uploadId);

    // Step 2: Upload each chunk
    let uploadedBytes = 0;
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);

      // Read chunk from file
      const chunkData = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: start,
        length: end - start
      });

      // Convert base64 back to binary for streaming
      // (Expo doesn't support direct binary streaming, so we send as data URI)
      const chunkBlob = await fetch(
        `data:application/octet-stream;base64,${chunkData}`
      ).then((r) => r.blob());

      // Upload chunk
      await axios.put(
        `${API_BASE}/api/v1/media/upload/video/${uploadId}/chunk/${i}`,
        chunkBlob,
        {
          headers: { "Content-Type": "application/octet-stream" },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const chunkProgress = progressEvent.loaded || 0;
            uploadedBytes = start + chunkProgress;
            const overallPercent = Math.round(
              (uploadedBytes / totalSize) * 100
            );
            onProgress(overallPercent);
          }
        }
      );

      uploadedBytes = end;
      onProgress(Math.round((uploadedBytes / totalSize) * 100));
      console.log(
        `[uploadVideoChunked] Chunk ${i + 1}/${totalChunks} uploaded`
      );
    }

    // Step 3: Complete multipart upload
    const completeRes = await axios.post(
      `${API_BASE}/api/v1/media/upload/video/${uploadId}/complete`,
      {
        totalChunks,
        videoTitle: "Property Video",
        propertyId,
        propertyType: "sale"
      }
    );

    const videoId: string = completeRes.data.videoId;
    console.log("[uploadVideoChunked] Assembly complete, videoId:", videoId);

    // Step 4: Poll for HLS transcoding completion
    return pollUntilReady(videoId, onProgress, onError);
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.error || err.message || "Upload failed";
    onError(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Poll transcoding status until ready or failed
 */
async function pollUntilReady(
  videoId: string,
  onProgress: (percent: number) => void,
  onError: (error: string) => void
): Promise<{ hlsUrl: string; thumbnailUrl: string }> {
  const MAX_POLLS = 120; // 2 hours with 60s interval
  let pollCount = 0;

  while (pollCount < MAX_POLLS) {
    try {
      const statusRes = await axios.get(
        `${API_BASE}/api/v1/media/status/${videoId}`
      );

      const status = statusRes.data.status;
      const progress = statusRes.data.progress ?? 0;

      console.log(`[pollUntilReady] Status: ${status}, Progress: ${progress}%`);
      onProgress(Math.min(99, progress)); // Cap at 99 until complete

      if (status === "completed") {
        return {
          hlsUrl: statusRes.data.hlsUrl,
          thumbnailUrl: statusRes.data.thumbnailUrl || ""
        };
      }

      if (status === "failed") {
        throw new Error(statusRes.data.error || "Transcoding failed");
      }

      // Wait 5-60 seconds based on progress
      const delay = progress < 50 ? 5000 : progress < 90 ? 10000 : 60000;
      await new Promise((r) => setTimeout(r, delay));
      pollCount++;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Poll failed";
      onError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  throw new Error("Transcoding timeout (>2 hours)");
}

/**
 * uploadImageBinary - Upload single image
 *
 * Returns URLs for all variants: original, display, card, thumb
 */
export async function uploadImageBinary(
  imageUri: string,
  propertyId: string,
  onProgress: (percent: number) => void
): Promise<{ [key: string]: string }> {
  try {
    // Read image file as blob
    const imageBlob = await fetch(imageUri).then((r) => r.blob());

    const formData = new FormData();
    formData.append("image", imageBlob, "photo.jpg");

    const response = await axios.post(
      `${API_BASE}/api/v1/media/upload/image/binary?propertyId=${propertyId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded / (progressEvent.total || 1)) * 100
          );
          onProgress(percent);
        }
      }
    );

    console.log("[uploadImageBinary] Success:", response.data.urls);
    return response.data.urls; // { original, display, card, thumb }
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.error || err.message || "Image upload failed";
    throw new Error(errorMsg);
  }
}

/**
 * useVideoUpload - React hook for video upload with state management
 */
export function useVideoUpload() {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    phase: "idle",
    progress: 0
  });

  const uploadVideo = useCallback(
    async (videoUri: string, totalSize: number, propertyId: string) => {
      try {
        setUploadState({ phase: "uploading", progress: 0 });

        const { hlsUrl, thumbnailUrl } = await uploadVideoChunked(
          videoUri,
          totalSize,
          propertyId,
          (percent) => {
            setUploadState({ phase: "uploading", progress: percent });
          },
          (error) => {
            setUploadState({
              phase: "error",
              progress: 0,
              message: error
            });
          }
        );

        setUploadState({
          phase: "done",
          progress: 100,
          hlsUrl,
          thumbnailUrl
        });

        return { hlsUrl, thumbnailUrl };
      } catch (err: any) {
        setUploadState({
          phase: "error",
          progress: 0,
          message: err.message
        });
        throw err;
      }
    },
    []
  );

  const resetUpload = useCallback(() => {
    setUploadState({ phase: "idle", progress: 0 });
  }, []);

  return { uploadState, uploadVideo, resetUpload };
}

/**
 * useImageUpload - React hook for image upload
 */
export function useImageUpload() {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    phase: "idle",
    progress: 0
  });

  const uploadImage = useCallback(
    async (imageUri: string, propertyId: string) => {
      try {
        setUploadState({ phase: "uploading", progress: 0 });

        const urls = await uploadImageBinary(
          imageUri,
          propertyId,
          (percent) => {
            setUploadState({ phase: "uploading", progress: percent });
          }
        );

        setUploadState({
          phase: "done",
          progress: 100
        });

        return urls;
      } catch (err: any) {
        setUploadState({
          phase: "error",
          progress: 0,
          message: err.message
        });
        throw err;
      }
    },
    []
  );

  const resetUpload = useCallback(() => {
    setUploadState({ phase: "idle", progress: 0 });
  }, []);

  return { uploadState, uploadImage, resetUpload };
}
