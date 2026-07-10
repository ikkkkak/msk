/**
 * Realtime transcoding status via WebSocket (primary) + SSE fallback.
 */

import { videoEndpoints } from "../constants";
import { messagingWs } from "./messagingWs";

export type VideoProcessingUpdate = {
  videoID: number;
  processingStatus: string;
  progress: number;
  ready: boolean;
  hlsURL?: string;
  mobileVideoURL?: string;
  processingError?: string;
  spriteSheetURL?: string;
  previewBlurURL?: string;
};

type WaitOpts = {
  accessToken: string;
  videoId: number;
  timeoutMs?: number;
};

/** Wait until HLS ready using WS events; falls back to SSE then polling. */
export function waitForVideoProcessing(
  opts: WaitOpts,
): Promise<VideoProcessingUpdate> {
  const { accessToken, videoId, timeoutMs = 10 * 60 * 1000 } = opts;

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (u: VideoProcessingUpdate) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(u);
    };
    const fail = (e: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e);
    };

    const timer = setTimeout(
      () => fail(new Error("Video processing timed out")),
      timeoutMs,
    );

    const onWs = (msg: any) => {
      if (msg?.type !== "video:processing") return;
      const d = msg?.data;
      if (!d || Number(d.videoID) !== videoId) return;
      if (d.ready || d.processingStatus === "ready") {
        finish(normalize(d));
      } else if (d.processingStatus === "failed") {
        fail(new Error(d.processingError || "Processing failed"));
      }
    };

    messagingWs.connect(accessToken);
    const offWs = messagingWs.on(onWs);

    let es: EventSource | null = null;
    try {
      const sseUrl = `${videoEndpoints.streamingEvents(videoId)}?token=${encodeURIComponent(accessToken)}`;
      // @ts-expect-error RN may polyfill EventSource
      es = new EventSource(sseUrl);
      es.addEventListener("progress", (ev: MessageEvent) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.ready || d.processingStatus === "ready") finish(normalize(d));
          if (d.processingStatus === "failed") {
            fail(new Error(d.processingError || "Processing failed"));
          }
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* SSE unavailable — WS + poll only */
    }

    const poll = setInterval(async () => {
      try {
        const res = await fetch(videoEndpoints.streamingStatus(videoId), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const d = await res.json();
        if (d.ready || d.processingStatus === "ready") finish(normalize(d));
        if (d.processingStatus === "failed") {
          fail(new Error(d.processingError || "Processing failed"));
        }
      } catch {
        /* ignore */
      }
    }, 8000);

    function cleanup() {
      clearTimeout(timer);
      clearInterval(poll);
      offWs();
      try {
        es?.close();
      } catch {
        /* ignore */
      }
    }
  });
}

function normalize(d: any): VideoProcessingUpdate {
  return {
    videoID: Number(d.videoID),
    processingStatus: d.processingStatus,
    progress: Number(d.progress ?? 0),
    ready: !!d.ready,
    hlsURL: d.hlsURL,
    mobileVideoURL: d.mobileVideoURL,
    processingError: d.processingError,
    spriteSheetURL: d.spriteSheetURL,
    previewBlurURL: d.previewBlurURL ?? d.preview_blur_url,
  };
}
