/**
 * Video View History & Tracking Service
 *
 * Maintains per-user history of viewed videos with:
 * - Local storage (SQLite via AsyncStorage for mobile)
 * - TTL (time-to-live) - when videos become eligible for re-rotation
 * - Deduplication - prevent double-tracking same view
 * - Rotation eligibility - determine if video can be shown again
 *
 * Inspired by Stack Overflow's approach to preventing repeated items
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ViewedVideoRecord {
  videoId: string | number;
  viewedAt: number; // Unix timestamp in ms
  watchDurationSec?: number;
  completionRate?: number; // 0-1
}

export interface VideoRotationState {
  userId: string | number;
  viewedVideos: ViewedVideoRecord[];
  userPermutationKey: string; // Random key for deterministic permutation
  currentCounter: number; // Counter for permutation cycle
  lastRotationReset: number; // When the cycle was last reset
}

const STORAGE_PREFIX = "@apartments_video_";
const ROTATION_TTL_HOURS = 24; // After 24 hours, video is eligible to show again
const RESET_THRESHOLD_HOURS = 72; // After 72 hours with no new videos, reset the cycle

/**
 * Get unique storage key for a user's video history
 */
function getStorageKey(userId: string | number, suffix: string): string {
  return `${STORAGE_PREFIX}${userId}_${suffix}`;
}

/**
 * Generate a random user permutation key (used for deterministic randomization)
 * Same user always gets same permutation order, but differs across users
 */
function generatePermutationKey(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Initialize or retrieve rotation state for a user
 */
async function getRotationState(
  userId: string | number
): Promise<VideoRotationState> {
  const key = getStorageKey(userId, "rotation_state");

  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const state = JSON.parse(stored);
      console.log(
        `[RotationState] Loaded for user ${userId}: ${state.viewedVideos.length} videos, counter: ${state.currentCounter}`
      );
      return state;
    }
  } catch (error) {
    console.warn(`[RotationState] Failed to load for user ${userId}:`, error);
  }

  // Create new state
  const newState: VideoRotationState = {
    userId,
    viewedVideos: [],
    userPermutationKey: generatePermutationKey(),
    currentCounter: 0,
    lastRotationReset: Date.now()
  };

  console.log(
    `[RotationState] Created new for user ${userId}, key: ${newState.userPermutationKey}`
  );

  return newState;
}

/**
 * Save rotation state to storage
 */
async function saveRotationState(state: VideoRotationState): Promise<void> {
  const key = getStorageKey(state.userId, "rotation_state");

  try {
    await AsyncStorage.setItem(key, JSON.stringify(state));
    console.log(
      `[RotationState] Saved for user ${state.userId}: ${state.viewedVideos.length} videos`
    );
  } catch (error) {
    console.error(
      `[RotationState] Failed to save for user ${state.userId}:`,
      error
    );
  }
}

/**
 * Check if a video has been viewed before
 */
export async function hasViewedVideo(
  userId: string | number,
  videoId: string | number
): Promise<boolean> {
  const state = await getRotationState(userId);
  return state.viewedVideos.some((v) => v.videoId === videoId);
}

/**
 * Get last view time for a video, or null if never viewed
 */
export async function getLastViewTime(
  userId: string | number,
  videoId: string | number
): Promise<number | null> {
  const state = await getRotationState(userId);
  const record = state.viewedVideos.find((v) => v.videoId === videoId);
  return record?.viewedAt ?? null;
}

/**
 * Record a video view with optional metadata
 */
export async function recordVideoView(
  userId: string | number,
  videoId: string | number,
  watchDurationSec?: number,
  completionRate?: number
): Promise<void> {
  const state = await getRotationState(userId);
  const now = Date.now();

  // Check for duplicate view (same video viewed within last 5 minutes)
  const existingIndex = state.viewedVideos.findIndex(
    (v) => v.videoId === videoId && now - v.viewedAt < 5 * 60 * 1000
  );

  if (existingIndex >= 0) {
    // Update existing recent view
    state.viewedVideos[existingIndex] = {
      videoId,
      viewedAt: now,
      watchDurationSec,
      completionRate
    };
    console.log(
      `[recordView] Updated existing view for video ${videoId} (user ${userId})`
    );
  } else {
    // Add new view record
    state.viewedVideos.push({
      videoId,
      viewedAt: now,
      watchDurationSec,
      completionRate
    });
    console.log(
      `[recordView] New view recorded for video ${videoId} (user ${userId}, watch: ${watchDurationSec}s)`
    );
  }

  // Keep history size manageable (remove oldest after 1000 records)
  if (state.viewedVideos.length > 1000) {
    state.viewedVideos = state.viewedVideos.slice(-500);
    console.log(
      `[recordView] Trimmed history for user ${userId}, now: ${state.viewedVideos.length}`
    );
  }

  await saveRotationState(state);
}

/**
 * Check if a video is eligible to show again (TTL expired)
 */
export async function isEligibleForRotation(
  userId: string | number,
  videoId: string | number,
  ttlHours: number = ROTATION_TTL_HOURS
): Promise<boolean> {
  const lastViewTime = await getLastViewTime(userId, videoId);

  if (lastViewTime === null) {
    return true; // Never viewed = eligible
  }

  const now = Date.now();
  const ageMs = now - lastViewTime;
  const ageHours = ageMs / (1000 * 60 * 60);

  const eligible = ageHours >= ttlHours;

  if (!eligible) {
    console.log(
      `[rotationEligible] Video ${videoId} NOT eligible (${ageHours.toFixed(1)}h < ${ttlHours}h TTL)`
    );
  } else {
    console.log(
      `[rotationEligible] Video ${videoId} eligible for re-rotation (${ageHours.toFixed(1)}h >= ${ttlHours}h)`
    );
  }

  return eligible;
}

/**
 * Get all viewed videos in order (oldest first)
 */
export async function getViewHistory(
  userId: string | number,
  limit?: number
): Promise<ViewedVideoRecord[]> {
  const state = await getRotationState(userId);
  let history = state.viewedVideos.sort((a, b) => a.viewedAt - b.viewedAt);

  if (limit) {
    history = history.slice(-limit);
  }

  console.log(
    `[getViewHistory] User ${userId}: ${history.length} videos${
      limit ? ` (last ${limit})` : ""
    }`
  );

  return history;
}

/**
 * Clear all view history for a user (for testing or manual reset)
 */
export async function clearViewHistory(userId: string | number): Promise<void> {
  const key = getStorageKey(userId, "rotation_state");

  try {
    await AsyncStorage.removeItem(key);
    console.log(`[clearViewHistory] Cleared all history for user ${userId}`);
  } catch (error) {
    console.error(
      `[clearViewHistory] Failed to clear for user ${userId}:`,
      error
    );
  }
}

/**
 * Determine if rotation cycle should be reset
 * Reset when: user has seen all videos + 72 hours passed
 */
export async function shouldResetRotationCycle(
  userId: string | number,
  totalVideoCount: number
): Promise<boolean> {
  const state = await getRotationState(userId);
  const now = Date.now();
  const timeSinceReset = (now - state.lastRotationReset) / (1000 * 60 * 60);

  // Reset if:
  // 1. User has seen >90% of available videos AND
  // 2. 72+ hours have passed since last reset
  const seenPercentage =
    state.viewedVideos.length / Math.max(totalVideoCount, 1);
  const shouldReset =
    seenPercentage > 0.9 && timeSinceReset >= RESET_THRESHOLD_HOURS;

  console.log(
    `[shouldReset] User ${userId}: seen ${(seenPercentage * 100).toFixed(1)}%, ${timeSinceReset.toFixed(1)}h since reset = ${shouldReset}`
  );

  return shouldReset;
}

/**
 * Reset the rotation cycle (clear history, new permutation key)
 */
export async function resetRotationCycle(
  userId: string | number
): Promise<void> {
  const state = await getRotationState(userId);

  state.viewedVideos = [];
  state.userPermutationKey = generatePermutationKey();
  state.currentCounter = 0;
  state.lastRotationReset = Date.now();

  await saveRotationState(state);

  console.log(
    `[resetCycle] Reset rotation for user ${userId}, new key: ${state.userPermutationKey}`
  );
}

/**
 * Increment rotation counter (used with permutation key to generate sequence)
 */
export async function incrementRotationCounter(
  userId: string | number
): Promise<number> {
  const state = await getRotationState(userId);
  state.currentCounter++;
  await saveRotationState(state);
  return state.currentCounter;
}

/**
 * Deterministic permutation function using user's key and counter
 * Ensures same user always sees videos in same order, but different across users
 *
 * Implementation uses linear congruential generator (LCG) style hashing
 * to create a pseudo-random but deterministic sequence
 */
export async function getPermutationIndex(
  userId: string | number,
  totalItems: number,
  counterOverride?: number
): Promise<number> {
  const state = await getRotationState(userId);
  const counter = counterOverride ?? state.currentCounter;

  // Hash function: combine user key and counter into deterministic index
  // Uses simple hash: (a * counter) % totalItems
  const seed = state.userPermutationKey
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // LCG-style permutation
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296;
  const hash = ((a * (seed + counter) + c) % m) >>> 0;

  const index = hash % totalItems;

  console.log(
    `[permutationIndex] User ${userId}, counter: ${counter}, index: ${index}/${totalItems}`
  );

  return index;
}

/**
 * Build a complete view history map for scoring
 */
export async function buildViewHistoryMap(
  userId: string | number
): Promise<Map<string | number, number>> {
  const history = await getViewHistory(userId);
  const map = new Map<string | number, number>();

  for (const record of history) {
    map.set(record.videoId, record.viewedAt);
  }

  console.log(
    `[buildViewHistoryMap] Built map with ${map.size} entries for user ${userId}`
  );

  return map;
}

export default {
  hasViewedVideo,
  getLastViewTime,
  recordVideoView,
  isEligibleForRotation,
  getViewHistory,
  clearViewHistory,
  shouldResetRotationCycle,
  resetRotationCycle,
  incrementRotationCounter,
  getPermutationIndex,
  buildViewHistoryMap
};
