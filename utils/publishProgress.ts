/**
 * Publish pipeline → overall 0–100%.
 *
 *  0– 3%   health (client)
 *  3–58%   media upload (client, parallel)
 * 58–65%   payload prepare (client)
 * 65–100%  property create (server via GET create-jobs poll)
 */
export type PublishStage =
  | "health"
  | "media"
  | "prepare"
  | "create"
  | "finalize";

const RANGES: Record<PublishStage, { start: number; end: number }> = {
  health: { start: 0, end: 3 },
  media: { start: 3, end: 58 },
  prepare: { start: 58, end: 65 },
  create: { start: 65, end: 100 },
  finalize: { start: 98, end: 100 },
};

export function publishOverallPercent(
  stage: PublishStage,
  stageProgress: number,
): number {
  const { start, end } = RANGES[stage];
  const t = Math.min(1, Math.max(0, stageProgress));
  return Math.min(100, Math.max(0, Math.round(start + (end - start) * t)));
}

export function publishStageLabelKey(stage: PublishStage): string {
  switch (stage) {
    case "health":
      return "organization.publishStage.health";
    case "media":
      return "organization.publishStage.media";
    case "prepare":
      return "organization.publishStage.prepare";
    case "create":
      return "organization.publishStage.create";
    case "finalize":
      return "organization.publishStage.finalize";
    default:
      return "organization.publishStage.default";
  }
}

export function publishServerStepLabelKey(step: string): string {
  const s = String(step || "").trim();
  if (!s) return "organization.publishStage.default";
  return `organization.publishStep.${s}`;
}

export function resolvePublishLabelKey(
  stage: PublishStage,
  step?: string,
): string {
  if (step) {
    const clientKeys = [
      "health",
      "uploading_photos",
      "uploading_video",
      "compressing_video",
      "media_done",
      "prepare",
    ];
    if (clientKeys.includes(step)) {
      return `organization.publishStage.${step}`;
    }
    return publishServerStepLabelKey(step);
  }
  if (stage === "finalize") {
    return publishServerStepLabelKey("complete");
  }
  return publishStageLabelKey(stage);
}

export type PublishProgressUpdate = {
  percent: number;
  stage: PublishStage;
  step?: string;
};
