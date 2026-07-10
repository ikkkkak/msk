import * as FileSystem from "expo-file-system/legacy";
import { API_PATHS, resolveApiUrl } from "../constants/apiPaths";
import { api } from "../services/api";
import {
  getReadyImageUrlsForSubmit,
  getReadyVideoUrlsForSubmit,
  isHttpMediaUrl,
  isLocalMediaUri,
  isUploadedMediaUri,
  resolveUploadedMediaUrl
} from "./mediaUri";
import {
  dedupeListingImageUpload,
  lookupListingImageUpload,
  rememberListingImageUpload,
} from "../services/listingImageUploadCache";
import { normalizeVideoMimeForUpload } from "./videoMime";

export {
  getReadyImageUrlsForSubmit,
  getReadyVideoUrlsForSubmit,
  isHttpMediaUrl
};

const MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024;
const IMAGE_UPLOAD_CONCURRENCY = 2;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function guessImageMime(uri: string, explicit?: string): string {
  const m = String(explicit || "").trim().toLowerCase();
  if (m.startsWith("image/")) return m;
  const lower = String(uri || "")
    .toLowerCase()
    .split("?")[0];
  if (/\.png$/i.test(lower)) return "image/png";
  if (/\.webp$/i.test(lower)) return "image/webp";
  if (/\.gif$/i.test(lower)) return "image/gif";
  if (/\.heic$/i.test(lower) || /\.heif$/i.test(lower)) return "image/heic";
  return "image/jpeg";
}

export function assertHttpMediaUrls(urls: string[], label: string): string[] {
  const out = urls.map((u) => String(u || "").trim()).filter(Boolean);
  const bad = out.find((u) => !isHttpMediaUrl(u));
  if (bad) {
    throw new Error(
      `${label} must be uploaded URLs before publishing (got ${bad.slice(0, 32)}…)`
    );
  }
  return out;
}

async function dataUrlToTempFile(dataUrl: string): Promise<string> {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid image data URL");
  }
  const mime = match[1].toLowerCase();
  const ext = mime.includes("png")
    ? ".png"
    : mime.includes("webp")
      ? ".webp"
      : mime.includes("gif")
        ? ".gif"
        : ".jpg";
  const path = `${FileSystem.cacheDirectory}listing_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  await FileSystem.writeAsStringAsync(path, match[2], {
    encoding: FileSystem.EncodingType.Base64,
  });
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists || !("size" in info) || !info.size) {
    throw new Error("Failed to prepare image for upload");
  }
  return path;
}

async function readImageAsDataUrl(uri: string): Promise<string> {
  if (/^data:image\//i.test(uri)) return uri;
  if (!isLocalMediaUri(uri)) {
    throw new Error("Cannot read remote image as local file");
  }
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || !("size" in info) || !info.size) {
    throw new Error("Image file not found or empty");
  }
  if (info.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(
      `Image too large (${Math.round(info.size / (1024 * 1024))}MB). Max ${Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024))}MB.`
    );
  }
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64
  });
  if (!b64 || b64.length < 32) {
    throw new Error("Image read failed — file may be corrupt");
  }
  const decodedApprox = Math.floor((b64.length * 3) / 4);
  if (decodedApprox < 100) {
    throw new Error("Image file too small to be valid");
  }
  const mime = guessImageMime(uri);
  return `data:${mime};base64,${b64}`;
}

async function uploadImageBinary(
  uri: string,
  accessToken: string,
  mimeHint?: string
): Promise<string> {
  const mime = guessImageMime(uri, mimeHint);
  const uploadUrl = resolveApiUrl(API_PATHS.uploadImageBinary);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "image",
        mimeType: mime,
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (result.status < 200 || result.status >= 300) {
        const snippet =
          typeof result.body === "string" ? result.body.slice(0, 200) : "";
        const err = new Error(
          `Image upload HTTP ${result.status}${snippet ? `: ${snippet}` : ""}`
        );
        // Do not retry client/gateway rejections — they often already stored the file.
        if (result.status >= 400 && result.status < 500) throw err;
        lastErr = err;
        continue;
      }
      const data =
        typeof result.body === "string" && result.body.trim().startsWith("{")
          ? (JSON.parse(result.body) as { url?: string; error?: string })
          : {};
      const url = data.url;
      if (!url)
        throw new Error(data.error || "Image upload failed, no url returned");
      const resolved = resolveUploadedMediaUrl(String(url));
      if (!isHttpMediaUrl(resolved)) {
        throw new Error("Image upload returned invalid URL");
      }
      return resolved;
    } catch (e) {
      lastErr = e;
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Image upload failed");
}

async function uploadImageLocal(
  uri: string,
  accessToken: string,
  mimeHint?: string
): Promise<string> {
  let uploadUri = uri;
  let tempPath: string | null = null;

  if (/^data:image\//i.test(uri)) {
    tempPath = await dataUrlToTempFile(uri);
    uploadUri = tempPath;
  }

  try {
    if (isLocalMediaUri(uploadUri)) {
      return await uploadImageBinary(uploadUri, accessToken, mimeHint);
    }

    const dataUrl = await readImageAsDataUrl(uri);
    return uploadImageDataUrl(dataUrl, accessToken);
  } finally {
    if (tempPath) {
      await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(
        () => undefined
      );
    }
  }
}

async function uploadImageDataUrl(
  dataUrl: string,
  accessToken: string
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await api.post(
        API_PATHS.uploadImage,
        { data: dataUrl },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 60_000
        }
      );
      const url = resp.data?.url;
      if (!url) throw new Error("Image upload failed, no url returned");
      const resolved = resolveUploadedMediaUrl(String(url));
      if (!isHttpMediaUrl(resolved)) {
        throw new Error("Image upload returned invalid URL");
      }
      return resolved;
    } catch (e) {
      lastErr = e;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Image upload failed");
}

/**
 * Ensures every image is an https URL before property create.
 * Already-uploaded paths/URLs are normalized; local/data URIs upload in parallel.
 */
export async function prepareImagesForListingSubmit(
  images: Array<string | { uri: string; mimeType?: string }>,
  accessToken: string,
  onProgress?: (ratio: number) => void,
  options?: {
    /** Per-index CDN URL — skip upload for slots already on CDN */
    existingUrls?: (string | null | undefined)[];
    onImageUploaded?: (
      index: number,
      url: string,
      urls: string[],
    ) => void | Promise<void>;
  },
): Promise<string[]> {
  if (!images.length) return [];
  let done = 0;
  const bump = () => {
    done += 1;
    onProgress?.(done / images.length);
  };

  const resolved: string[] = new Array(images.length);

  const resolveSlot = async (
    value: string | { uri: string; mimeType?: string },
    index: number,
  ): Promise<string> => {
    const existing = options?.existingUrls?.[index];
    if (existing && isHttpMediaUrl(existing)) {
      return existing;
    }

    const uri = typeof value === "string" ? value : value.uri;
    const mimeHint = typeof value === "object" ? value.mimeType : undefined;

    if (isUploadedMediaUri(uri)) {
      const normalized = resolveUploadedMediaUrl(uri);
      if (!isHttpMediaUrl(normalized)) {
        throw new Error("Uploaded image URL is invalid");
      }
      return normalized;
    }

    const cached = lookupListingImageUpload(uri);
    if (cached) return cached;

    return dedupeListingImageUpload(uri, () =>
      uploadImageLocal(uri, accessToken, mimeHint),
    );
  };

  await mapWithConcurrency(
    images,
    IMAGE_UPLOAD_CONCURRENCY,
    async (value, index) => {
      try {
        const url = await resolveSlot(value, index);
        resolved[index] = url;
        rememberListingImageUpload(
          typeof value === "string" ? value : value.uri,
          url,
        );
        const filled = resolved.map((u, i) =>
          u ?? (options?.existingUrls?.[i] && isHttpMediaUrl(String(options.existingUrls[i]))
            ? String(options.existingUrls[i])
            : ""),
        );
        await options?.onImageUploaded?.(index, url, filled);
      } finally {
        bump();
      }
    },
  );

  return assertHttpMediaUrls(resolved, "Images");
}

export async function prepareVideoForListingSubmit(
  video: { uri: string; mimeType?: string } | null,
  accessToken: string,
  returnUploadIdOnly?: boolean,
  propertyId?: string | number,
  progress?: {
    onRatio?: (ratio: number) => void;
    onPhase?: (phase: string) => void;
  }
): Promise<string[]> {
  if (!video?.uri) return [];
  const uri = video.uri;
  if (isUploadedMediaUri(uri)) {
    const resolved = resolveUploadedMediaUrl(uri);
    return assertHttpMediaUrls([resolved], "Video");
  }
  if (!isLocalMediaUri(uri)) return [];

  const mime = normalizeVideoMimeForUpload(video.mimeType, uri);
  const { uploadVideoChunked } = await import("../services/videoChunkUpload");
  const result = await uploadVideoChunked(
    uri,
    mime,
    accessToken,
    (p) => {
      progress?.onPhase?.(p.phase);
      const ratio =
        p.phase === "compressing"
          ? (p.percent / 100) * 0.05
          : p.phase === "uploading"
            ? 0.05 + (p.percent / 100) * 0.95
            : p.phase === "done"
              ? 1
              : p.percent / 100;
      progress?.onRatio?.(Math.min(1, ratio));
    },
    returnUploadIdOnly,
    propertyId ? String(propertyId) : undefined
  );
  if (!result) throw new Error("Video upload failed");

  if (returnUploadIdOnly) {
    return [result]; // Return uploadId instead of URL
  }

  return assertHttpMediaUrls([resolveUploadedMediaUrl(result)], "Video");
}

/** Upload nested classified room photos before property update. */
export async function prepareClassifiedPhotosForSubmit(
  classified: Array<{ room_type: string; photos: string[] }> | undefined,
  accessToken: string,
  onProgress?: (ratio: number) => void
): Promise<Array<{ room_type: string; photos: string[] }>> {
  if (!classified?.length) return [];
  const withPhotos = classified.filter((cp) => (cp.photos?.length ?? 0) > 0);
  if (!withPhotos.length) return classified;
  let done = 0;
  const total = withPhotos.length;
  const bump = () => {
    done += 1;
    onProgress?.(done / total);
  };
  const resolved = await Promise.all(
    classified.map(async (cp) => {
      if (!cp.photos?.length) return cp;
      try {
        const photos = await prepareImagesForListingSubmit(
          cp.photos,
          accessToken
        );
        return { ...cp, photos };
      } finally {
        bump();
      }
    })
  );
  return resolved;
}
