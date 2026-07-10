import * as FileSystem from "expo-file-system/legacy";
import { API_PATHS, resolveApiUrl } from "../constants/apiPaths";

function guessImageMime(uri: string): string {
  const lower = String(uri || "")
    .toLowerCase()
    .split("?")[0];
  if (/\.png$/i.test(lower)) return "image/png";
  if (/\.webp$/i.test(lower)) return "image/webp";
  if (/\.gif$/i.test(lower)) return "image/gif";
  if (/\.heic$/i.test(lower) || /\.heif$/i.test(lower)) return "image/heic";
  return "image/jpeg";
}

async function dataUriToTempFile(dataUri: string): Promise<string> {
  const comma = dataUri.indexOf(",");
  const base64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
  const ext = dataUri.includes("image/png") ? ".png" : ".jpg";
  const path = `${FileSystem.cacheDirectory}prop_img_${Date.now()}${ext}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

/** Upload a local image file to CDN via authenticated binary endpoint. */
export async function uploadPropertyImageBinary(
  uri: string,
  accessToken: string,
): Promise<string> {
  const uploadUrl = resolveApiUrl(API_PATHS.uploadImageBinary);
  const result = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "image",
    mimeType: guessImageMime(uri),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (result.status < 200 || result.status >= 300) {
    const snippet =
      typeof result.body === "string" ? result.body.slice(0, 200) : "";
    throw new Error(
      `Image upload HTTP ${result.status}${snippet ? `: ${snippet}` : ""}`,
    );
  }
  const data =
    typeof result.body === "string" && result.body.trim().startsWith("{")
      ? (JSON.parse(result.body) as { url?: string; error?: string })
      : {};
  const url = data.url;
  if (!url) {
    throw new Error(data.error || "Image upload failed, no url returned");
  }
  return url;
}

/** Upload data URI, file:// URI, or pass through existing https URL. */
export async function uploadPropertyImageSource(
  source: string,
  accessToken: string,
): Promise<string> {
  const trimmed = (source || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  let localUri = trimmed;
  if (trimmed.startsWith("data:image/")) {
    localUri = await dataUriToTempFile(trimmed);
  }
  return uploadPropertyImageBinary(localUri, accessToken);
}

export async function uploadPropertyImageBatch(
  images: string[],
  accessToken: string,
): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const url = await uploadPropertyImageSource(images[i]!, accessToken);
    if (url) out.push(url);
  }
  return out;
}
