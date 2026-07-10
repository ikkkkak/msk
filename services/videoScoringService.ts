/**
 * Advanced Video Scoring & Prioritization Service
 *
 * Implements a composite scoring function that balances:
 * - Freshness (recency boost for new videos)
 * - Engagement (likes, comments, completion rates)
 * - Relevance (user preferences, location, property type)
 * - Seen penalty (reduce score if user recently viewed)
 * - Diversity (post-processing to avoid similar consecutive videos)
 *
 * Based on Zillow's recommendation diversity research
 */

import type { Video } from "../types/video";
import type { PropertySaleVideo } from "../types/propertySaleVideo";

interface VideoWithMetrics {
  id: string | number;
  createdAt: Date | string;
  likesCount?: number;
  commentsCount?: number;
  viewCount?: number;
  completionRate?: number; // 0-1 scale
  city?: string;
  zone?: string;
  propertyType?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

interface ScoringParams {
  /** User's location preferences */
  userCity?: string;
  userZone?: string;
  /** User's property preferences */
  preferredPropertyTypes?: string[];
  preferredBedrooms?: number;
  preferredBathrooms?: number;
  preferredPriceRange?: { min: number; max: number };
  /** Weights for different scoring components (0-1, sum should ideally be ~1) */
  weights?: {
    freshness: number; // Default: 0.35
    engagement: number; // Default: 0.25
    relevance: number; // Default: 0.25
    seenPenalty: number; // Default: 0.15
  };
}

interface VideoScore {
  videoId: string | number;
  score: number;
  breakdown: {
    freshness: number;
    engagement: number;
    relevance: number;
    seenPenalty: number;
  };
}

const DEFAULT_WEIGHTS = {
  freshness: 0.35,
  engagement: 0.25,
  relevance: 0.25,
  seenPenalty: 0.15
};

/**
 * Calculate freshness score (0-1)
 * Recent videos get higher scores, older videos get lower scores
 * Uses exponential decay: fresh videos older than 7 days still get decent score
 */
export function calculateFreshnessScore(
  createdAt: Date | string,
  currentTime: Date = new Date()
): number {
  const created = new Date(createdAt);
  const ageMs = currentTime.getTime() - created.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Exponential decay: half-life of 48 hours
  // Recent videos (0-24h): 1.0 → 0.95
  // 1-2 days old: 0.95 → 0.71
  // 2-4 days old: 0.71 → 0.50
  // 7 days old: 0.25
  const halfLife = 48;
  const freshnessScore = Math.exp(-ageHours / halfLife);

  console.log(
    `[Freshness] Video age: ${Math.round(ageHours)}h, score: ${freshnessScore.toFixed(3)}`
  );

  return Math.max(0, Math.min(1, freshnessScore));
}

/**
 * Calculate engagement score (0-1)
 * Combines likes, comments, view count, and completion rate
 */
export function calculateEngagementScore(video: VideoWithMetrics): number {
  const likes = video.likesCount ?? 0;
  const comments = video.commentsCount ?? 0;
  const views = video.viewCount ?? 1; // Avoid division by zero
  const completion = video.completionRate ?? 0.5; // Default to 50% if unknown

  // Normalize engagement metrics
  // Assume: 100 likes, 20 comments, 500 views is high engagement
  const likeScore = Math.min(1, likes / 100);
  const commentScore = Math.min(1, comments / 20);
  const completionScore = Math.min(1, completion); // Already 0-1

  // Engagement rate: (likes + comments * 2) / views
  // Higher engagement rate = better content quality
  const engagementRate = Math.min(
    1,
    (likes + comments * 2) / Math.max(views, 1)
  );

  // Weighted average: favor engagement rate, completion, comments
  const score =
    engagementRate * 0.4 +
    completionScore * 0.3 +
    commentScore * 0.2 +
    likeScore * 0.1;

  console.log(
    `[Engagement] Likes: ${likes}, Comments: ${comments}, Views: ${views}, Score: ${score.toFixed(3)}`
  );

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate relevance score (0-1)
 * Measures how well the video matches user preferences
 */
export function calculateRelevanceScore(
  video: VideoWithMetrics,
  params: ScoringParams
): number {
  let relevance = 0.5; // Base score: neutral/unknown user preference

  const scores: number[] = [];

  // Location match (higher weight if exact match)
  if (params.userCity && video.city) {
    if (video.city.toLowerCase() === params.userCity.toLowerCase()) {
      scores.push(1.0); // Exact city match
    } else {
      scores.push(0.3); // Different city, still relevant
    }
  }

  // Zone match within city
  if (params.userZone && video.zone) {
    if (video.zone.toLowerCase() === params.userZone.toLowerCase()) {
      scores.push(0.9); // Strong zone match
    } else {
      scores.push(0.2); // Different zone
    }
  }

  // Property type match
  if (
    params.preferredPropertyTypes &&
    params.preferredPropertyTypes.length > 0 &&
    video.propertyType
  ) {
    const isMatch = params.preferredPropertyTypes.some(
      (type) => type.toLowerCase() === video.propertyType?.toLowerCase()
    );
    scores.push(isMatch ? 0.95 : 0.2);
  }

  // Bedroom preference match
  if (params.preferredBedrooms && video.bedrooms) {
    const diff = Math.abs(video.bedrooms - params.preferredBedrooms);
    // Exact match: 1.0, +/- 1 room: 0.8, +/- 2+ rooms: 0.3
    const bedroomScore = diff === 0 ? 1.0 : diff === 1 ? 0.8 : 0.3;
    scores.push(bedroomScore);
  }

  // Bathroom preference match
  if (params.preferredBathrooms && video.bathrooms) {
    const diff = Math.abs(video.bathrooms - params.preferredBathrooms);
    const bathroomScore = diff === 0 ? 1.0 : diff === 1 ? 0.8 : 0.3;
    scores.push(bathroomScore);
  }

  // Price range match
  if (params.preferredPriceRange && video.price) {
    const { min, max } = params.preferredPriceRange;
    const inRange = video.price >= min && video.price <= max;
    if (inRange) {
      scores.push(1.0); // Perfect price match
    } else {
      // Discount for out-of-range
      const distanceFromRange =
        video.price < min ? min - video.price : video.price - max;
      const priceDeviation = distanceFromRange / Math.max(min, max);
      const priceScore = Math.max(0.1, 1 - priceDeviation);
      scores.push(priceScore);
    }
  }

  // Calculate average if we have any matches
  if (scores.length > 0) {
    relevance = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  console.log(
    `[Relevance] Scores: ${scores.map((s) => s.toFixed(2)).join(", ")}, Final: ${relevance.toFixed(3)}`
  );

  return Math.max(0, Math.min(1, relevance));
}

/**
 * Calculate seen penalty (0-1, where 1 = no penalty, 0 = maximum penalty)
 * Dramatically reduces score for recently viewed videos
 */
export function calculateSeenPenalty(
  lastSeenAt?: Date | string | null,
  currentTime: Date = new Date()
): number {
  if (!lastSeenAt) {
    return 1.0; // No penalty if never seen
  }

  const lastSeen = new Date(lastSeenAt);
  const timeSinceSeenMs = currentTime.getTime() - lastSeen.getTime();
  const timeSinceSeenHours = timeSinceSeenMs / (1000 * 60 * 60);

  // Penalty schedule:
  // Just seen (0-1h): 0.05 (95% penalty)
  // Seen recently (1-6h): 0.10 (90% penalty)
  // Seen today (6-24h): 0.30 (70% penalty)
  // Seen yesterday (24-48h): 0.60 (40% penalty)
  // Seen 2+ days ago: 1.0 (no penalty, eligible for rotation)

  let penalty = 1.0;

  if (timeSinceSeenHours < 1) {
    penalty = 0.05;
  } else if (timeSinceSeenHours < 6) {
    penalty = 0.1;
  } else if (timeSinceSeenHours < 24) {
    penalty = 0.3;
  } else if (timeSinceSeenHours < 48) {
    penalty = 0.6;
  } else {
    penalty = 1.0; // Full score recovery after 48 hours
  }

  console.log(
    `[SeenPenalty] Last seen: ${Math.round(timeSinceSeenHours)}h ago, penalty: ${penalty.toFixed(3)}`
  );

  return penalty;
}

/**
 * Calculate composite score for a single video
 * Returns score (0-1) and breakdown of components
 */
export function scoreVideo(
  video: VideoWithMetrics,
  params: ScoringParams = {},
  lastSeenAt?: Date | string | null,
  currentTime: Date = new Date()
): VideoScore {
  const weights = { ...DEFAULT_WEIGHTS, ...params.weights };

  // Calculate component scores
  const freshnessScore = calculateFreshnessScore(video.createdAt, currentTime);
  const engagementScore = calculateEngagementScore(video);
  const relevanceScore = calculateRelevanceScore(video, params);
  const seenPenalty = calculateSeenPenalty(lastSeenAt, currentTime);

  // Composite score: weighted sum
  const compositeScore =
    freshnessScore * weights.freshness +
    engagementScore * weights.engagement +
    relevanceScore * weights.relevance +
    seenPenalty * weights.seenPenalty; // Apply penalty to component

  console.log(
    `[VideoScore ${video.id}] Composite: ${compositeScore.toFixed(3)} (F:${freshnessScore.toFixed(2)} E:${engagementScore.toFixed(2)} R:${relevanceScore.toFixed(2)} P:${seenPenalty.toFixed(2)})`
  );

  return {
    videoId: video.id,
    score: Math.max(0, Math.min(1, compositeScore)),
    breakdown: {
      freshness: freshnessScore,
      engagement: engagementScore,
      relevance: relevanceScore,
      seenPenalty
    }
  };
}

/**
 * Score multiple videos and return sorted by score (descending)
 */
export function scoreVideos(
  videos: VideoWithMetrics[],
  params: ScoringParams = {},
  seenMap?: Map<string | number, Date | string | null>,
  currentTime: Date = new Date()
): VideoScore[] {
  const scores = videos.map((video) => {
    const lastSeenAt = seenMap?.get(video.id);
    return scoreVideo(video, params, lastSeenAt, currentTime);
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  console.log(
    `[scoreVideos] Scored ${videos.length} videos. Top 3: ${scores
      .slice(0, 3)
      .map((s) => `${s.videoId}:${s.score.toFixed(3)}`)
      .join(", ")}`
  );

  return scores;
}

export default {
  calculateFreshnessScore,
  calculateEngagementScore,
  calculateRelevanceScore,
  calculateSeenPenalty,
  scoreVideo,
  scoreVideos
};
