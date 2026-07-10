/**
 * Thumbnail upload helper (small images only — videos use chunked upload).
 */

import * as FileSystem from "expo-file-system/legacy";
import { API_PATHS, resolveApiUrl } from "../constants/apiPaths";

function guessImageMime(uri: string): string {
  const lower = String(uri || "")
    .toLowerCase()
    .split("?")[0];
  if (/\.png$/i.test(lower)) return "image/png";
  return "image/jpeg";
}

export async function uploadThumbnail(
  localUri: string,
  accessToken: string,
): Promise<string> {
  const uploadUrl = resolveApiUrl(API_PATHS.uploadImageBinary);
  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "image",
    mimeType: guessImageMime(localUri),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Thumbnail upload HTTP ${result.status}`);
  }
  const data =
    typeof result.body === "string" && result.body.trim().startsWith("{")
      ? (JSON.parse(result.body) as { url?: string; error?: string })
      : {};
  const url = data.url;
  if (!url) throw new Error(data.error || "Thumbnail upload failed");
  return url;
}
