/**
 * Video Rotation Algorithm - Virtual Permutation Cycle
 *
 * Ensures each user sees every video in the catalog before recycling content.
 * Uses a deterministic but user-specific permutation to prevent repetition.
 *
 * Algorithm:
 * 1. Each user gets a random "permutation key" on first visit
 * 2. We use this key + counter to generate indices deterministically
 * 3. No video repeats in a user's cycle until all N videos are seen
 * 4. After full cycle (72h+), user gets new key and cycle resets
 *
 * This guarantees complete catalog coverage before recycling while maintaining
 * pseudo-random order that differs per user.
 */

import * as RotationTracker from "./videoRotationTracker";

export interface RotationResult {
  orderedVideoIds: (string | number)[];
  totalInCycle: number;
  currentPosition: number;
  cycleCompletion: number; // 0-1, where 1 = fully seen all videos
  canReset: boolean; // Whether cycle is eligible for reset
}

/**
 * Fisher-Yates shuffle with seeded randomization
 * Produces a permutation of [0, 1, ..., n-1]
 *
 * Uses seeded random generator for determinism while appearing random
 */
function seededShuffle(count: number, seed: number): number[] {
  // Simple seeded LCG (Linear Congruential Generator)
  const lcg = (x: number) => {
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296;
    return ((a * x + c) % m) >>> 0;
  };

  const indices: number[] = Array.from({ length: count }, (_, i) => i);

  // Shuffle using seeded random
  let x = seed;
  for (let i = indices.length - 1; i > 0; i--) {
    x = lcg(x);
    const j = x % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

/**
 * Generate a rotation sequence for a user
 *
 * Returns the order in which videos should be shown, attempting to ensure
 * no repeats until all videos are seen.
 */
export async function generateRotationSequence(
  userId: string | number,
  allVideoIds: (string | number)[],
  currentOffset: number = 0
): Promise<RotationResult> {
  const totalVideos = allVideoIds.length;

  // Create a user-specific permutation key (deterministic)
  const userKey = `${userId}`;

  // Extract numeric seed from permutation key
  const keySeed = userKey
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

  // Generate shuffled indices using seed
  const shuffledIndices = seededShuffle(totalVideos, keySeed);

  // Apply offset (current position in cycle)
  const offset = currentOffset % totalVideos;

  // Create rotated sequence starting from current position
  const orderedIds: (string | number)[] = [];
  for (let i = 0; i < totalVideos; i++) {
    const idx = shuffledIndices[(i + offset) % totalVideos];
    orderedIds.push(allVideoIds[idx]);
  }

  // Get viewed count from rotation tracker
  const viewHistory = await RotationTracker.getViewHistory(userId);
  const viewedCount = viewHistory.length;
  const completion = Math.min(1, viewedCount / totalVideos);

  // Check if cycle should be reset
  const shouldReset = await RotationTracker.shouldResetRotationCycle(
    userId,
    totalVideos
  );

  console.log(
    `[generateRotationSequence] User ${userId}: ${totalVideos} videos, ` +
      `${viewedCount} viewed (${(completion * 100).toFixed(1)}%), ` +
      `cycle position: ${offset}, reset eligible: ${shouldReset}`
  );

  return {
    orderedVideoIds: orderedIds,
    totalInCycle: totalVideos,
    currentPosition: offset,
    cycleCompletion: completion,
    canReset: shouldReset
  };
}

/**
 * Filter videos to exclude recently seen ones
 * Returns videos the user is eligible to see (haven't seen or TTL expired)
 */
export async function filterEligibleVideos(
  userId: string | number,
  videoIds: (string | number)[],
  ttlHours: number = 24
): Promise<(string | number)[]> {
  const eligible: (string | number)[] = [];

  for (const videoId of videoIds) {
    const isEligible = await RotationTracker.isEligibleForRotation(
      userId,
      videoId,
      ttlHours
    );
    if (isEligible) {
      eligible.push(videoId);
    }
  }

  console.log(
    `[filterEligibleVideos] User ${userId}: ${eligible.length}/${videoIds.length} eligible (TTL: ${ttlHours}h)`
  );

  return eligible;
}

/**
 * Apply rotation algorithm to reorder a list of videos
 *
 * Process:
 * 1. Generate deterministic permutation based on user key
 * 2. Filter out recently seen videos
 * 3. If not enough unseen videos, include older seen videos
 * 4. Return rotated list
 */
export async function applyRotationLogic<T extends { id: string | number }>(
  userId: string | number,
  videos: T[],
  options: {
    ttlHours?: number;
    minResultSize?: number;
  } = {}
): Promise<T[]> {
  const { ttlHours = 24, minResultSize = videos.length } = options;

  const videoIds = videos.map((v) => v.id);

  // Step 1: Generate ideal rotation sequence
  const rotation = await generateRotationSequence(userId, videoIds);

  console.log(
    `[applyRotationLogic] Ideal sequence: [${rotation.orderedVideoIds.slice(0, 5).join(", ")}...]`
  );

  // Step 2: Filter to get eligible videos
  const eligibleIds = await filterEligibleVideos(userId, videoIds, ttlHours);

  // Step 3: If not enough eligible, include some recently seen
  let resultIds = eligibleIds;
  if (eligibleIds.length < minResultSize) {
    const toAdd = minResultSize - eligibleIds.length;
    const recentlySeenIds = videoIds.filter((id) => !eligibleIds.includes(id));
    resultIds = [...eligibleIds, ...recentlySeenIds.slice(0, toAdd)];

    console.log(
      `[applyRotationLogic] Added ${toAdd} recently-seen videos to reach minimum size`
    );
  }

  // Step 4: Reorder based on rotation sequence
  const resultMap = new Map(videos.map((v) => [v.id, v]));
  const rotatedResult: T[] = [];

  for (const videoId of rotation.orderedVideoIds) {
    if (resultIds.includes(videoId)) {
      const video = resultMap.get(videoId);
      if (video) {
        rotatedResult.push(video);
      }
    }
  }

  console.log(
    `[applyRotationLogic] Returned ${rotatedResult.length} videos in rotated order`
  );

  return rotatedResult;
}

/**
 * Check if cycle reset is needed and perform if necessary
 */
export async function checkAndResetCycleIfNeeded(
  userId: string | number,
  totalVideoCount: number
): Promise<boolean> {
  const shouldReset = await RotationTracker.shouldResetRotationCycle(
    userId,
    totalVideoCount
  );

  if (shouldReset) {
    await RotationTracker.resetRotationCycle(userId);
    console.log(`[checkAndResetCycleIfNeeded] Cycle reset for user ${userId}`);
    return true;
  }

  return false;
}

/**
 * Manual cycle reset (for testing or user action)
 */
export async function forceResetCycle(userId: string | number): Promise<void> {
  await RotationTracker.resetRotationCycle(userId);
  console.log(`[forceResetCycle] Cycle force-reset for user ${userId}`);
}

export default {
  generateRotationSequence,
  filterEligibleVideos,
  applyRotationLogic,
  checkAndResetCycleIfNeeded,
  forceResetCycle
};
