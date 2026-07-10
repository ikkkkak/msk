import { assertServerReachable } from "../utils/serverHealth";

import {
  publishOverallPercent,
  type PublishProgressUpdate,
  type PublishStage,
} from "../utils/publishProgress";

import {
  assertHttpMediaUrls,
  getReadyImageUrlsForSubmit,
  getReadyVideoUrlsForSubmit,
  prepareImagesForListingSubmit,
  prepareVideoForListingSubmit,
} from "../utils/listingSubmitMedia";

import {
  createPropertySaleSync,
  pollPropertySaleCreateJob,
  startPropertySaleCreateJob,
} from "./propertySaleCreateJob";

export type { PublishProgressUpdate };

export type PropertySaleFormPayload = {
  title: string;
  description: string;
  property_type: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  year_built: number;
  country_id: number | null;
  city_id: number | null;
  zone_id: number | null;
  quartier_id: number | null;
  latitude: number;
  longitude: number;
  indoor_features: string[];
  outdoor_features: string[];
  amenity_ids: number[];
  paper_types: string[];
  address: string;
  city: string;
  state: string;
  country: string;
  host_private_note?: string;
};

export type PublishPropertySaleParams = {
  accessToken: string;
  form: PropertySaleFormPayload;
  images: string[];
  video: { uri: string; mimeType?: string } | null;
  cachedImageUrls?: string[];
  cachedVideoUrls?: string[];
  onProgress?: (p: PublishProgressUpdate) => void;
  onMediaCached?: (imageUrls: string[], videoUrls: string[]) => void | Promise<void>;
  onImageUploaded?: (
    index: number,
    url: string,
    urls: string[],
  ) => void | Promise<void>;
};

function isValidVideoUri(uri: unknown): boolean {
  return typeof uri === "string" && uri.trim().length > 0;
}

function emit(
  onProgress: PublishPropertySaleParams["onProgress"],
  stage: PublishStage,
  stageProgress: number,
  step?: string,
) {
  onProgress?.({
    stage,
    percent: publishOverallPercent(stage, stageProgress),
    step,
  });
}

/** Images ~25%, video ~75% of the media band (video dominates upload time). */
function combineMediaProgress(
  hasImages: boolean,
  hasVideo: boolean,
  imageRatio: number,
  videoRatio: number,
): number {
  if (hasImages && hasVideo) {
    return Math.min(1, imageRatio * 0.25 + videoRatio * 0.75);
  }
  if (hasVideo) return Math.min(1, videoRatio);
  return Math.min(1, imageRatio);
}

/**
 * Publish: media in parallel (0–58%), then server create (58–100%).
 */
export async function publishPropertySale(
  params: PublishPropertySaleParams,
): Promise<{ id: number; message: string }> {
  const {
    accessToken,
    form,
    images,
    video,
    cachedImageUrls,
    cachedVideoUrls,
    onProgress,
    onMediaCached,
    onImageUploaded,
  } = params;

  emit(onProgress, "health", 0, "health");
  await assertServerReachable(2500);
  emit(onProgress, "health", 1, "health");

  const hasImages = images.length > 0;
  const hasVideo = Boolean(video?.uri && isValidVideoUri(video.uri));
  if (!hasImages && !hasVideo) {
    throw new Error("At least one photo or video is required");
  }

  const readyImagesFromPicker = getReadyImageUrlsForSubmit(images);
  const mergedImageSlots: (string | null)[] = images.map((img, i) => {
    const cached = cachedImageUrls?.[i];
    if (cached && /^https?:\/\//i.test(cached)) return cached;
    if (readyImagesFromPicker) return readyImagesFromPicker[i] ?? null;
    return null;
  });
  const allImagesReady =
    hasImages && mergedImageSlots.every((u) => u && /^https?:\/\//i.test(u));
  const readyImages = allImagesReady
    ? assertHttpMediaUrls(mergedImageSlots as string[], "Images")
    : readyImagesFromPicker;
  const readyVideos =
    cachedVideoUrls?.length
      ? assertHttpMediaUrls(cachedVideoUrls, "Video")
      : getReadyVideoUrlsForSubmit(video);

  let imageRatio = readyImages !== null ? 1 : 0;
  let videoRatio = readyVideos !== null ? 1 : 0;
  const reportMedia = (step?: string) => {
    emit(
      onProgress,
      "media",
      combineMediaProgress(hasImages, hasVideo, imageRatio, videoRatio),
      step,
    );
  };

  if (readyImages !== null && readyVideos !== null) {
    reportMedia("media_done");
  } else {
    reportMedia(hasVideo ? "uploading_video" : "uploading_photos");
  }

  const imageTask =
    hasImages && readyImages === null
      ? prepareImagesForListingSubmit(
          images,
          accessToken,
          (ratio) => {
            imageRatio = ratio;
            reportMedia("uploading_photos");
          },
          {
            existingUrls: mergedImageSlots,
            onImageUploaded,
          },
        ).then((urls) => assertHttpMediaUrls(urls, "Images"))
      : Promise.resolve(readyImages ?? []);

  const videoTask =
    hasVideo && video && readyVideos === null
      ? prepareVideoForListingSubmit(video, accessToken, undefined, undefined, {
          onRatio: (ratio) => {
            videoRatio = ratio;
            reportMedia("uploading_video");
          },
          onPhase: (phase) => {
            const step =
              phase === "compressing"
                ? "compressing_video"
                : "uploading_video";
            reportMedia(step);
          },
        }).then((urls) => assertHttpMediaUrls(urls, "Video"))
      : Promise.resolve(readyVideos ?? []);

  const [imageUrls, videoUrls] = await Promise.all([imageTask, videoTask]);
  imageRatio = 1;
  videoRatio = 1;
  reportMedia("media_done");
  await onMediaCached?.(imageUrls, videoUrls);

  emit(onProgress, "prepare", 0, "prepare");
  const payload: Record<string, unknown> = {
    ...form,
    title: form.title.trim().slice(0, 200),
    description: form.description.trim().slice(0, 12000),
    images: imageUrls,
    videos: videoUrls,
    state: form.state || "-",
    country: form.country || "Mauritania",
  };
  emit(onProgress, "prepare", 1, "prepare");

  try {
    const jobId = await startPropertySaleCreateJob(payload, accessToken);
    const result = await pollPropertySaleCreateJob(
      jobId,
      accessToken,
      ({ percent, step }) => {
        onProgress?.({ stage: "create", percent, step });
      },
    );
    emit(onProgress, "finalize", 1, "complete");
    return result;
  } catch (e) {
    if (__DEV__) {
      console.warn("[publishPropertySale] create-jobs failed, sync fallback", e);
    }
    const result = await createPropertySaleSync(payload, accessToken, (pct) => {
      onProgress?.({
        stage: "create",
        percent: pct,
        step: pct >= 100 ? "complete" : "inserting",
      });
    });
    emit(onProgress, "finalize", 1, "complete");
    return result;
  }
}
