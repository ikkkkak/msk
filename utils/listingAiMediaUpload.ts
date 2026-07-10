import { uploadPropertyImageSource } from "./propertyImageUpload";
import { uploadVideoChunked } from "../services/videoChunkUpload";
import { tokenStorage } from "../services/tokenStorage";
import {
  isLocalMediaUri,
  isUploadedMediaUri,
  resolveUploadedMediaUrl,
} from "./mediaUri";
import { isImagePickerKind, normalizeVideoMimeForUpload } from "./videoMime";

/** Upload local image URIs; returns CDN URLs. */
export async function uploadListingAiImages(
  localImages: string[],
): Promise<string[]> {
  const token = tokenStorage.getAccess();
  if (!token) throw new Error("Not authenticated");
  const tasks = localImages.map(async (img) => {
    if (isUploadedMediaUri(img)) {
      return resolveUploadedMediaUrl(img);
    }
    return uploadPropertyImageSource(img, token);
  });
  return Promise.all(tasks);
}

/** Upload one video; returns URL or undefined. */
export async function uploadListingAiVideo(
  video: { uri: string; mimeType?: string } | null,
): Promise<string | undefined> {
  if (!video?.uri) return undefined;
  if (isUploadedMediaUri(video.uri)) {
    return resolveUploadedMediaUrl(video.uri);
  }
  const token = tokenStorage.getAccess();
  if (!token) throw new Error("Not authenticated");
  if (!isLocalMediaUri(video.uri)) return undefined;
  if (isImagePickerKind(video.mimeType)) {
    throw new Error("Selected media is a photo, not a video.");
  }
  const mime = normalizeVideoMimeForUpload(video.mimeType, video.uri);
  const url = await uploadVideoChunked(video.uri, mime, token);
  return url ? resolveUploadedMediaUrl(url) : undefined;
}
