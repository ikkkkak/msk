/**
 * Normalize picker / file metadata to a real video/* MIME for chunked upload.
 * expo-image-picker `type` is "video" | "image", not "video/mp4".
 */

export function isImagePickerKind(kind?: string | null): boolean {
  const k = String(kind ?? "")
    .trim()
    .toLowerCase();
  return k === "image" || k.startsWith("image/");
}

export function isVideoPickerKind(kind?: string | null): boolean {
  const k = String(kind ?? "")
    .trim()
    .toLowerCase();
  if (k.startsWith("video/")) return true;
  return k === "video" || k === "pairedvideo" || k === "livephoto";
}

function mimeFromUri(uri?: string | null): string | undefined {
  const u = String(uri ?? "")
    .split("?")[0]
    .toLowerCase();
  if (u.endsWith(".mov")) return "video/quicktime";
  if (u.endsWith(".webm")) return "video/webm";
  if (u.endsWith(".mkv")) return "video/x-matroska";
  if (u.endsWith(".m4v") || u.endsWith(".mp4")) return "video/mp4";
  if (u.endsWith(".3gp")) return "video/3gpp";
  if (u.endsWith(".avi")) return "video/x-msvideo";
  return undefined;
}

/** Resolve upload MIME from expo asset fields + URI extension. */
export function normalizeVideoMimeForUpload(
  mimeOrKind?: string | null,
  uri?: string | null,
): string {
  const raw = String(mimeOrKind ?? "").trim().toLowerCase();
  if (raw.startsWith("video/")) return raw;
  if (isImagePickerKind(raw)) {
    throw new Error("Selected file is a photo, not a video. Remove it and pick a video clip.");
  }
  if (isVideoPickerKind(raw)) {
    return mimeFromUri(uri) ?? "video/mp4";
  }
  const fromUri = mimeFromUri(uri);
  if (fromUri) return fromUri;
  if (!raw || raw === "application/octet-stream") return "video/mp4";
  return "video/mp4";
}
