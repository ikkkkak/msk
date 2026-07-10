/**
 * Broker-friendly video upload (TikTok/Instagram pattern):
 * 1. Compress on device (~180MB → ~10MB for 1 min)
 * 2. Single presigned PUT to CDN when ≤30MB (one request)
 * 3. Multipart only for longer videos (10MB parts, parallel)
 */

import * as FileSystem from "expo-file-system/legacy";
import { AppState, type AppStateStatus } from "react-native";
import axios from "axios";
import { endpoints } from "../constants";
import { API_PATHS, resolveApiUrl } from "../constants/apiPaths";
import { normalizeVideoMimeForUpload } from "../utils/videoMime";
import { refreshSessionTokens } from "./session";
import { tokenStorage } from "./tokenStorage";
import {
  compressVideoForUpload,
  isExpoGo
} from "../utils/videoCompressForUpload";

/** Must be divisible by 3 — expo base64 slice reads align on 3-byte boundaries. */
const CHUNK_SIZE = 9 * 1024 * 1024;
/** Smaller relay chunks stay under typical 60s gateway timeouts on slow networks. */
const RELAY_CHUNK_SIZE = 3 * 1024 * 1024;
const SINGLE_PUT_MAX_BYTES = 30 * 1024 * 1024;
const STREAM_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;
/** Skip single-request stream when proxy often times out at ~60s. */
const STREAM_UPLOAD_SKIP_BYTES = 25 * 1024 * 1024;
const COMPRESS_PROGRESS_WEIGHT = 0.05;
const UPLOAD_PROGRESS_BASE = 0.05;
const UPLOAD_PROGRESS_SCALE = 0.95;

function isUploadAuthError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const code = String(err.response?.data?.code ?? "");
    return err.response?.status === 401 || code === "TOKEN_EXPIRED";
  }
  if (err instanceof Error) {
    return (
      err.message.includes("401") ||
      err.message.includes("TOKEN_EXPIRED") ||
      err.message.includes("access token expired")
    );
  }
  return false;
}

/** Prefer in-memory token; refresh once before long uploads. */
async function resolveUploadAccessToken(fallback: string): Promise<string> {
  const stored = tokenStorage.getAccess();
  if (stored) return stored;
  try {
    const refreshed = await refreshSessionTokens();
    if (refreshed?.accessToken) return refreshed.accessToken;
  } catch {
    /* use fallback */
  }
  return fallback;
}

async function refreshUploadAccessToken(): Promise<string | null> {
  try {
    const refreshed = await refreshSessionTokens();
    return refreshed?.accessToken ?? tokenStorage.getAccess() ?? null;
  } catch {
    return tokenStorage.getAccess() ?? null;
  }
}
const MAX_CHUNK_ATTEMPTS = 3;
const CHUNK_READ_TIMEOUT_MS = 60_000;
const CHUNK_PUT_TIMEOUT_MS = 180_000;

export type ChunkUploadProgress = {
  phase: "compressing" | "init" | "uploading" | "merging" | "done" | "error";
  percent: number;
  uploadedChunks: number;
  totalChunks: number;
  message?: string;
};

type InitResponse = {
  uploadId?: string;
  mode?: "single" | "direct" | "relay";
  putUrl?: string;
  putHeaders?: Record<string, string>;
  partUrls?: string[];
  totalSize?: number;
  totalChunks?: number;
  error?: string;
};

type CompletedPart = { partNumber: number; etag: string };

type UploadStatusResponse = {
  mode?: "direct" | "relay";
  parts?: CompletedPart[];
  received?: number[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logUpload(message: string): void {
  console.log(`[videoChunkUpload] ${message}`);
}

function chunkLength(totalSize: number, index: number, chunkSize = CHUNK_SIZE): number {
  return Math.min(chunkSize, totalSize - index * chunkSize);
}

function effectiveChunkSize(preferRelay: boolean): number {
  return preferRelay ? RELAY_CHUNK_SIZE : CHUNK_SIZE;
}

function uploadConcurrency(totalSize: number, preferRelay: boolean): number {
  if (preferRelay) return 1;
  const mb = totalSize / (1024 * 1024);
  if (mb <= 30) return 2;
  if (mb <= 60) return 3;
  return 4;
}

function mapUploadProgress(percent: number): number {
  return Math.round(
    UPLOAD_PROGRESS_BASE + percent * UPLOAD_PROGRESS_SCALE
  );
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

async function activateUploadKeepAwake(): Promise<() => void> {
  try {
    const { activateKeepAwakeAsync, deactivateKeepAwake } =
      await import("expo-keep-awake");
    await activateKeepAwakeAsync("videoChunkUpload");
    return () => {
      try {
        deactivateKeepAwake("videoChunkUpload");
      } catch {
        /* ignore */
      }
    };
  } catch {
    return () => {};
  }
}

function isRelayChunkUrl(url: string): boolean {
  return /\/upload\/video\/[^/?]+\/chunk(?:\?|$)/i.test(url);
}

function parseEtag(headers: unknown): string {
  let h: Record<string, string> = {};
  if (typeof headers === "string") {
    try {
      h = JSON.parse(headers) as Record<string, string>;
    } catch {
      h = {};
    }
  } else if (headers) {
    h = headers as Record<string, string>;
  }
  const raw = h.etag || h.ETag || h.Etag;
  if (!raw) throw new Error("CDN did not return ETag");
  return String(raw);
}

function assertUploadCompleteUrl(
  data: { url?: string; error?: string; bytes?: number } | undefined,
  label: string
): string {
  const url = String(data?.url || "").trim();
  if (!url) {
    throw new Error(data?.error || `${label} finalize failed`);
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`${label} returned invalid URL`);
  }
  return url;
}

function assertRelayChunkOk(
  status: number,
  body: string | undefined,
  label: string
): void {
  if (status < 200 || status >= 300) {
    const snippet =
      typeof body === "string" && body.trim()
        ? `: ${body.trim().slice(0, 400)}`
        : "";
    throw new Error(`${label} HTTP ${status}${snippet}`);
  }
  if (typeof body === "string" && body.trim().startsWith("{")) {
    try {
      const json = JSON.parse(body) as { success?: boolean; error?: string };
      if (json.success === false) {
        throw new Error(json.error || `${label} rejected by server`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("rejected")) throw e;
      /* non-JSON or parse noise — 2xx is enough */
    }
  }
}

/** PUT file to CDN (needs ETag) or API relay chunk endpoint (2xx only). */
async function uploadFilePut(
  url: string,
  filePath: string,
  headers: Record<string, string>,
  label: string,
  options?: { expectEtag?: boolean }
): Promise<string | void> {
  const expectEtag = options?.expectEtag ?? !isRelayChunkUrl(url);
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_CHUNK_ATTEMPTS; attempt++) {
    try {
      const result = await withTimeout(
        FileSystem.uploadAsync(url, filePath, {
          httpMethod: "PUT",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers
        }),
        CHUNK_PUT_TIMEOUT_MS,
        label
      );
      if (expectEtag) {
        if (result.status < 200 || result.status >= 300) {
          const body =
            typeof result.body === "string" && result.body.trim()
              ? `: ${result.body.trim().slice(0, 400)}`
              : "";
          throw new Error(`${label} HTTP ${result.status}${body}`);
        }
        return parseEtag(result.headers);
      }
      assertRelayChunkOk(
        result.status,
        typeof result.body === "string" ? result.body : undefined,
        label
      );
      return;
    } catch (e) {
      lastErr = e;
      logUpload(
        `${label} attempt ${attempt + 1} failed: ${e instanceof Error ? e.message : String(e)}`
      );
      if (attempt < MAX_CHUNK_ATTEMPTS - 1) await sleep(200 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} failed`);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

type InitSession = {
  uploadId: string;
  mode?: "single" | "direct" | "relay";
  putUrl?: string;
  putHeaders?: Record<string, string>;
  partUrls?: string[];
  totalChunks?: number;
};

async function initVideoUpload(
  mime: string,
  totalSize: number,
  totalChunks: number,
  chunkSize: number,
  accessToken: string,
  preferRelay: boolean
): Promise<InitSession> {
  const initRes = await axios.post<InitResponse>(
    `${endpoints.baseURL}/upload/video/init`,
    {
      mime,
      totalSize,
      totalChunks,
      chunkSize,
      filename: "video.mp4",
      preferRelay
    },
    { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 20_000 }
  );
  const uploadId = initRes.data?.uploadId;
  if (!uploadId) {
    throw new Error(initRes.data?.error || "Failed to start upload");
  }
  return {
    uploadId,
    mode: initRes.data?.mode,
    putUrl: initRes.data?.putUrl,
    putHeaders: initRes.data?.putHeaders,
    partUrls: initRes.data?.partUrls,
    totalChunks: initRes.data?.totalChunks ?? totalChunks
  };
}

async function uploadVideoStream(
  stagedUri: string,
  mime: string,
  accessToken: string,
  fileSize: number,
  onProgress?: (p: ChunkUploadProgress) => void
): Promise<string> {
  const uploadUrl = resolveApiUrl(API_PATHS.uploadVideoStream);
  const options = {
    httpMethod: "POST" as const,
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "video",
    mimeType: mime,
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  const reportBytes = (sent: number, total: number) => {
    const t = total > 0 ? total : fileSize;
    const ratio = t > 0 ? Math.min(1, sent / t) : 0;
    onProgress?.({
      phase: "uploading",
      percent: Math.min(98, Math.max(3, Math.round(ratio * 100))),
      uploadedChunks: sent > 0 ? 1 : 0,
      totalChunks: 1,
      message: "Uploading video…",
    });
  };

  onProgress?.({
    phase: "uploading",
    percent: 3,
    uploadedChunks: 0,
    totalChunks: 1,
    message: "Uploading video…",
  });

  let result: FileSystem.FileSystemUploadResult;

  if (typeof FileSystem.createUploadTask === "function") {
    const task = FileSystem.createUploadTask(
      uploadUrl,
      stagedUri,
      options,
      (data) => {
        reportBytes(
          data.totalBytesSent ?? 0,
          data.totalBytesExpectedToSend ?? fileSize,
        );
      },
    );
    result = await task.uploadAsync();
  } else {
    const started = Date.now();
    const estMs = Math.max(20_000, (fileSize / (400 * 1024)) * 1000);
    const timer = setInterval(() => {
      const ratio = Math.min(0.9, (Date.now() - started) / estMs);
      onProgress?.({
        phase: "uploading",
        percent: Math.round(ratio * 100),
        uploadedChunks: 0,
        totalChunks: 1,
        message: "Uploading video…",
      });
    }, 400);
    try {
      result = await FileSystem.uploadAsync(uploadUrl, stagedUri, options);
    } finally {
      clearInterval(timer);
    }
  }

  if (result.status < 200 || result.status >= 300) {
    const snippet =
      typeof result.body === "string" ? result.body.slice(0, 200) : "";
    throw new Error(
      `Stream upload HTTP ${result.status}${snippet ? `: ${snippet}` : ""}`,
    );
  }
  const data =
    typeof result.body === "string" && result.body.trim().startsWith("{")
      ? (JSON.parse(result.body) as { url?: string; error?: string })
      : {};
  const url = assertUploadCompleteUrl(data, "Video stream upload");
  onProgress?.({
    phase: "done",
    percent: 100,
    uploadedChunks: 1,
    totalChunks: 1,
    message: "Upload complete",
  });
  logUpload(`stream OK → ${url}`);
  return url;
}

async function materializeChunkFile(
  fileUri: string,
  uploadId: string,
  index: number,
  offset: number,
  length: number
): Promise<string> {
  const chunkPath = `${FileSystem.cacheDirectory}vchunk_${uploadId}_${index}.part`;

  // Expo base64 reads require 3-byte alignment — read padded region then trim.
  const alignDown = offset - (offset % 3);
  const skipBytes = offset - alignDown;
  const needBytes = skipBytes + length;
  const paddedRead = needBytes + ((3 - (needBytes % 3)) % 3);

  const chunkB64 = await withTimeout(
    FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: alignDown,
      length: paddedRead
    }),
    CHUNK_READ_TIMEOUT_MS,
    `Read chunk ${index + 1}`
  );

  const allBytes = base64ToBytes(chunkB64);
  if (allBytes.length < skipBytes + length) {
    throw new Error(
      `Chunk ${index + 1} read mismatch: expected ${length} bytes, got ${Math.max(0, allBytes.length - skipBytes)}`
    );
  }
  const chunkBytes = allBytes.slice(skipBytes, skipBytes + length);

  await FileSystem.writeAsStringAsync(chunkPath, bytesToBase64(chunkBytes), {
    encoding: FileSystem.EncodingType.Base64
  });

  const info = await FileSystem.getInfoAsync(chunkPath);
  const written = info.exists && "size" in info && info.size ? info.size : 0;
  if (written !== length) {
    throw new Error(
      `Chunk ${index + 1} file mismatch: expected ${length} bytes, wrote ${written}`
    );
  }

  return chunkPath;
}

async function fetchUploadStatus(
  uploadId: string,
  accessToken: string
): Promise<UploadStatusResponse> {
  const res = await axios.get<UploadStatusResponse>(
    `${endpoints.baseURL}/upload/video/${uploadId}/status`,
    { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15_000 }
  );
  return res.data ?? {};
}

async function uploadSinglePut(
  stagedUri: string,
  mime: string,
  totalSize: number,
  accessToken: string,
  onProgress?: (p: ChunkUploadProgress) => void,
  existing?: InitSession
): Promise<string> {
  onProgress?.({
    phase: "init",
    percent: 5,
    uploadedChunks: 0,
    totalChunks: 1,
    message: "Starting upload…"
  });

  const preferRelay = isExpoGo();
  const session =
    existing ??
    (await initVideoUpload(
      mime,
      totalSize,
      1,
      totalSize,
      accessToken,
      preferRelay
    ));

  const uploadId = session.uploadId;
  const putUrl = session.putUrl;
  const mode = session.mode;
  if (!uploadId) {
    throw new Error("Single upload init failed");
  }

  // Expo Go / preferRelay: one chunk through API (no presigned PUT).
  if (mode === "relay") {
    logUpload(`mode=relay (single-size) uploadId=${uploadId}`);
    onProgress?.({
      phase: "uploading",
      percent: 15,
      uploadedChunks: 0,
      totalChunks: 1,
      message: "Uploading video…"
    });
    const relayUrl = `${endpoints.baseURL}/upload/video/${uploadId}/chunk?index=0`;
    await uploadFilePut(
      relayUrl,
      stagedUri,
      {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream"
      },
      "Video upload"
    );
    onProgress?.({
      phase: "merging",
      percent: 92,
      uploadedChunks: 1,
      totalChunks: 1,
      message: "Finalizing…"
    });
    const completeRes = await axios.post(
      `${endpoints.baseURL}/upload/video/${uploadId}/complete`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 120_000 }
    );
    const url = assertUploadCompleteUrl(completeRes.data, "Video upload");
    logUpload(`complete OK (relay single) → ${url}`);
    return url;
  }

  if (!putUrl || mode !== "single") {
    throw new Error("Single upload init failed");
  }

  const putHeaders = session.putHeaders ?? { "Content-Type": mime };

  logUpload(
    `mode=single uploadId=${uploadId} size=${(totalSize / (1024 * 1024)).toFixed(1)}MB`
  );

  onProgress?.({
    phase: "uploading",
    percent: 15,
    uploadedChunks: 0,
    totalChunks: 1,
    message: "Uploading video…"
  });

  await uploadFilePut(putUrl, stagedUri, putHeaders, "Video upload", {
    expectEtag: true
  });

  onProgress?.({
    phase: "merging",
    percent: 92,
    uploadedChunks: 1,
    totalChunks: 1,
    message: "Finalizing…"
  });

  const completeRes = await axios.post(
    `${endpoints.baseURL}/upload/video/${uploadId}/complete`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30_000 }
  );
  const url = assertUploadCompleteUrl(completeRes.data, "Video upload");
  logUpload(`complete OK (single) → ${url}`);
  return url;
}

async function uploadMultipart(
  stagedUri: string,
  mime: string,
  totalSize: number,
  accessToken: string,
  onProgress?: (p: ChunkUploadProgress) => void,
  existing?: InitSession
): Promise<string> {
  const preferRelay = isExpoGo();
  const chunkSize = effectiveChunkSize(preferRelay);
  const totalChunks = Math.max(1, Math.ceil(totalSize / chunkSize));
  const concurrency = uploadConcurrency(totalSize, preferRelay);

  onProgress?.({
    phase: "init",
    percent: 5,
    uploadedChunks: 0,
    totalChunks,
    message: "Starting upload…"
  });

  logUpload(
    `${totalChunks} parts × ${(chunkSize / (1024 * 1024)).toFixed(0)}MB, ${(totalSize / (1024 * 1024)).toFixed(1)}MB total, concurrency=${concurrency}`
  );

  const session =
    existing ??
    (await initVideoUpload(
      mime,
      totalSize,
      totalChunks,
      chunkSize,
      accessToken,
      preferRelay
    ));

  const uploadId = session.uploadId;
  if (!uploadId) throw new Error("Failed to start upload");

  const mode = session.mode === "direct" ? "direct" : "relay";
  const partUrls = session.partUrls ?? [];
  if (mode === "direct" && partUrls.length > 0 && partUrls.length < totalChunks) {
    throw new Error(
      `Upload init returned ${partUrls.length} part URLs, expected ${totalChunks}`
    );
  }
  logUpload(
    `mode=${mode} uploadId=${uploadId}${preferRelay ? " (Expo Go relay)" : ""}`
  );

  let existingParts = new Map<number, string>();
  const existingRelayIndices = new Set<number>();
  try {
    const status = await fetchUploadStatus(uploadId, accessToken);
    if (mode === "direct") {
      for (const p of status.parts ?? []) {
        if (p.partNumber > 0 && p.etag) existingParts.set(p.partNumber, p.etag);
      }
    } else {
      for (const i of status.received ?? []) {
        if (Number.isInteger(i) && i >= 0) existingRelayIndices.add(i);
      }
    }
  } catch {
    /* fresh upload */
  }

  let done = mode === "direct" ? existingParts.size : existingRelayIndices.size;
  const report = () => {
    onProgress?.({
      phase: "uploading",
      percent: 10 + Math.round((done / totalChunks) * 80),
      uploadedChunks: done,
      totalChunks,
      message: `Uploading ${done}/${totalChunks}…`
    });
  };
  if (done > 0) report();

  const parts: CompletedPart[] = [];
  for (const [n, etag] of existingParts) {
    parts.push({ partNumber: n, etag });
  }

  const indices = Array.from({ length: totalChunks }, (_, i) => i).filter(
    (i) =>
      mode === "direct"
        ? !existingParts.has(i + 1)
        : !existingRelayIndices.has(i)
  );

  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, indices.length || 1) },
    async () => {
      while (cursor < indices.length) {
        const index = indices[cursor++];
        const partNumber = index + 1;
        const length = chunkLength(totalSize, index, chunkSize);
        const chunkPath = await materializeChunkFile(
          stagedUri,
          uploadId,
          index,
          index * chunkSize,
          length
        );
        try {
          const url =
            mode === "direct"
              ? partUrls[index]
              : `${endpoints.baseURL}/upload/video/${uploadId}/chunk?index=${index}`;
          const headers: Record<string, string> =
            mode === "direct"
              ? {}
              : {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/octet-stream"
                };
          const etag = await uploadFilePut(
            url,
            chunkPath,
            headers,
            `Chunk ${partNumber}/${totalChunks}`,
            { expectEtag: mode === "direct" }
          );
          if (mode === "direct" && etag) {
            parts.push({ partNumber, etag: String(etag) });
          }
          done += 1;
          report();
          logUpload(`chunk ${partNumber}/${totalChunks} ok`);
        } finally {
          await FileSystem.deleteAsync(chunkPath, { idempotent: true });
        }
      }
    }
  );
  await Promise.all(workers);

  onProgress?.({
    phase: "merging",
    percent: 94,
    uploadedChunks: totalChunks,
    totalChunks,
    message: "Finalizing…"
  });

  parts.sort((a, b) => a.partNumber - b.partNumber);
  const completeRes = await axios.post(
    `${endpoints.baseURL}/upload/video/${uploadId}/complete`,
    mode === "direct" ? { parts } : {},
    { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 120_000 }
  );
  const url = assertUploadCompleteUrl(completeRes.data, "Video upload");
  logUpload(`complete OK (${mode}) → ${url}`);
  return url;
}

export async function uploadVideoChunked(
  localUri: string,
  mime: string,
  accessToken: string,
  onProgress?: (p: ChunkUploadProgress) => void,
  returnUploadIdOnly?: boolean,
  propertyId?: string
): Promise<string> {
  const releaseKeepAwake = await activateUploadKeepAwake();
  const appStateSub = AppState.addEventListener(
    "change",
    (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        logUpload("keep app open during upload");
      }
    }
  );

  let compressCleanup: (() => Promise<void>) | undefined;
  let activeToken = await resolveUploadAccessToken(accessToken);
  try {
    const { uri: compressedUri, cleanup: cc } = await compressVideoForUpload(
      localUri,
      (cp) => {
        onProgress?.({
          phase: "compressing",
          percent: Math.round(cp.percent * COMPRESS_PROGRESS_WEIGHT * 100),
          uploadedChunks: 0,
          totalChunks: 0,
          message: cp.message ?? "Preparing upload…"
        });
      }
    );
    compressCleanup = cc;

    const contentMime = normalizeVideoMimeForUpload(mime, compressedUri);
    const info = await FileSystem.getInfoAsync(compressedUri);
    if (!info.exists || !("size" in info) || !info.size) {
      throw new Error("Video file not found");
    }
    const totalSize = info.size;
    if (totalSize < 1024) {
      throw new Error("Video file too small — may be corrupt");
    }

    // If returnUploadIdOnly is true, init once and upload in background with same session
    if (returnUploadIdOnly) {
      const preferRelay = isExpoGo();
      const chunkSize = effectiveChunkSize(preferRelay);
      const totalChunks = Math.max(1, Math.ceil(totalSize / chunkSize));
      const session = await initVideoUpload(
        contentMime,
        totalSize,
        totalChunks,
        totalSize <= SINGLE_PUT_MAX_BYTES && totalChunks === 1
          ? totalSize
          : chunkSize,
        activeToken,
        preferRelay
      );
      const uploadId = session.uploadId;

      logUpload(`Got uploadId for property ${propertyId}: ${uploadId}`);

      if (propertyId) {
        try {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const key = `property_${propertyId}_uploads`;
          const stored = await AsyncStorage.getItem(key);

          let uploadIds: string[] = [];
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                uploadIds = parsed;
              } else if (parsed.uploadIds && Array.isArray(parsed.uploadIds)) {
                uploadIds = parsed.uploadIds;
              }
            } catch {
              /* ignore */
            }
          }

          uploadIds.push(uploadId);
          await AsyncStorage.setItem(
            key,
            JSON.stringify({
              uploadIds,
              timestamp: Date.now()
            })
          );
          logUpload(
            `Stored uploadId ${uploadId} for property ${propertyId} in AsyncStorage`
          );
        } catch (e) {
          logUpload(
            `Failed to store uploadId in AsyncStorage: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      const runBackground = async () => {
        try {
          if (totalSize <= SINGLE_PUT_MAX_BYTES && session.mode !== "direct") {
            await uploadSinglePut(
              compressedUri,
              contentMime,
              totalSize,
              activeToken,
              (p) => {
                onProgress?.({
                  ...p,
                  percent: mapUploadProgress(p.percent)
                });
              },
              session
            );
          } else {
            await uploadMultipart(
              compressedUri,
              contentMime,
              totalSize,
              activeToken,
              (p) => {
                onProgress?.({
                  ...p,
                  percent: mapUploadProgress(p.percent)
                });
              },
              session
            );
          }
        } catch (e) {
          logUpload(
            `Background upload failed: ${e instanceof Error ? e.message : String(e)}`
          );
        } finally {
          await compressCleanup?.();
        }
      };
      compressCleanup = undefined;
      void runBackground();

      return uploadId;
    }

    let url: string;
    const skipStream =
      isExpoGo() || totalSize > STREAM_UPLOAD_SKIP_BYTES;
    if (skipStream) {
      logUpload(
        `stream skipped (${isExpoGo() ? "Expo Go" : `>${STREAM_UPLOAD_SKIP_BYTES / (1024 * 1024)}MB`}), using chunked path`
      );
    } else if (totalSize <= STREAM_UPLOAD_MAX_BYTES) {
      try {
        url = await uploadVideoStream(
          compressedUri,
          contentMime,
          activeToken,
          totalSize,
          (p) => {
            onProgress?.({
              ...p,
              percent: mapUploadProgress(p.percent),
            });
          },
        );
        onProgress?.({
          phase: "done",
          percent: 100,
          uploadedChunks: 1,
          totalChunks: 1,
          message: "Upload complete"
        });
        return url;
      } catch (e) {
        if (isUploadAuthError(e)) {
          const fresh = await refreshUploadAccessToken();
          if (fresh) activeToken = fresh;
        }
        logUpload(
          `stream upload failed, using chunked path: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    if (totalSize <= SINGLE_PUT_MAX_BYTES) {
      url = await uploadSinglePut(
        compressedUri,
        contentMime,
        totalSize,
        activeToken,
        (p) => {
          onProgress?.({
            ...p,
            percent: mapUploadProgress(p.percent)
          });
        }
      );
    } else {
      url = await uploadMultipart(
        compressedUri,
        contentMime,
        totalSize,
        activeToken,
        (p) => {
          onProgress?.({
            ...p,
            percent: mapUploadProgress(p.percent)
          });
        }
      );
    }

    onProgress?.({
      phase: "done",
      percent: 100,
      uploadedChunks: 1,
      totalChunks: 1,
      message: "Upload complete"
    });
    return url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isUploadAuthError(e)) {
      logUpload(`FAILED (auth): ${msg} — sign in again if this persists`);
    } else {
      logUpload(`FAILED: ${msg}`);
    }
    onProgress?.({
      phase: "error",
      percent: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      message: msg
    });
    throw e;
  } finally {
    appStateSub.remove();
    releaseKeepAwake();
    await compressCleanup?.();
  }
}
