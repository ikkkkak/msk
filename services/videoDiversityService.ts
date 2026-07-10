/**
 * Video Diversity & Re-ranking Service
 *
 * Post-processes sorted video lists to ensure diversity:
 * - Avoids showing similar videos consecutively
 * - Mixes content types, locations, property types
 * - Implements submodular optimization for variety
 * - Used after scoring to finalize feed order
 *
 * Based on Zillow's recommendation diversity research
 */

export interface VideoMetadata {
  id: string | number;
  score: number;
  city?: string;
  zone?: string;
  propertyType?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  hostUserId?: string | number; // Same host twice in a row = bad diversity
}

interface DiversityConfig {
  /** Reduce score for consecutive similar items (0-1) */
  similarityPenalty: number; // Default: 0.7
  /** Minimum items to process before diversity kicks in */
  minItemsThreshold: number; // Default: 3
  /** Maximum consecutive items from same city */
  maxSameCityConsecutive: number; // Default: 2
  /** Maximum consecutive items from same host */
  maxSameHostConsecutive: number; // Default: 1
  /** Similarity threshold (0-1) for detecting similar videos */
  similarityThreshold: number; // Default: 0.6
}

const DEFAULT_CONFIG: DiversityConfig = {
  similarityPenalty: 0.7,
  minItemsThreshold: 3,
  maxSameCityConsecutive: 2,
  maxSameHostConsecutive: 1,
  similarityThreshold: 0.6
};

/**
 * Calculate similarity between two videos (0-1 scale, 1 = identical)
 * Considers: location, property type, price range, size
 */
function calculateSimilarity(v1: VideoMetadata, v2: VideoMetadata): number {
  let similarity = 0;
  let dimensions = 0;

  // Location similarity (highest weight)
  if (v1.city && v2.city) {
    const cityMatch =
      v1.city.toLowerCase() === v2.city.toLowerCase() ? 1.0 : 0.0;
    const zoneMatch =
      v1.zone && v2.zone && v1.zone.toLowerCase() === v2.zone.toLowerCase()
        ? 1.0
        : 0.0;

    // Favor zone match over just city match
    similarity += cityMatch * 0.4 + zoneMatch * 0.5;
    dimensions += 0.9;
  }

  // Property type similarity
  if (v1.propertyType && v2.propertyType) {
    const typeMatch =
      v1.propertyType.toLowerCase() === v2.propertyType.toLowerCase()
        ? 1.0
        : 0.0;
    similarity += typeMatch * 0.25;
    dimensions += 0.25;
  }

  // Price range similarity (normalize to 0-1)
  if (v1.price && v2.price) {
    const maxPrice = Math.max(v1.price, v2.price);
    const priceDiff = Math.abs(v1.price - v2.price);
    const priceMatch = Math.max(0, 1 - priceDiff / maxPrice);

    // Only penalize if prices very similar (within 20%)
    const priceSimilarity = priceMatch > 0.8 ? 1.0 : 0.0;
    similarity += priceSimilarity * 0.15;
    dimensions += 0.15;
  }

  // Bedroom similarity
  if (v1.bedrooms && v2.bedrooms) {
    const bedroomDiff = Math.abs(v1.bedrooms - v2.bedrooms);
    const bedroomMatch =
      bedroomDiff === 0 ? 1.0 : bedroomDiff === 1 ? 0.5 : 0.0;
    similarity += bedroomMatch * 0.1;
    dimensions += 0.1;
  }

  // Normalize to 0-1
  const normalizedSimilarity = dimensions > 0 ? similarity / dimensions : 0.5;

  console.log(
    `[Similarity] Videos ${v1.id} & ${v2.id}: ${normalizedSimilarity.toFixed(3)} ` +
      `(city: ${v1.city ?? "?"} vs ${v2.city ?? "?"}, type: ${v1.propertyType ?? "?"} vs ${v2.propertyType ?? "?"})`
  );

  return normalizedSimilarity;
}

/**
 * Apply diversity penalty to reduce score of similar subsequent videos
 * Returns adjusted scores based on position and surrounding videos
 */
export function applyDiversityPenalties(
  videos: VideoMetadata[],
  config: DiversityConfig = DEFAULT_CONFIG
): VideoMetadata[] {
  if (videos.length < config.minItemsThreshold) {
    console.log(
      `[applyDiversityPenalties] Skipping (${videos.length} < ${config.minItemsThreshold})`
    );
    return videos;
  }

  const result = [...videos];
  const penalizedIndices: Set<number> = new Set();

  // Track consecutive same cities and hosts
  let consecutiveCity: { city?: string; count: number } = { count: 0 };
  let consecutiveHost: { hostId?: string | number; count: number } = {
    count: 0
  };

  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    const previous = i > 0 ? result[i - 1] : null;

    let penaltyFactor = 1.0;

    // Check similarity to previous item
    if (previous) {
      const similarity = calculateSimilarity(previous, current);

      if (similarity > config.similarityThreshold) {
        penaltyFactor *= config.similarityPenalty;
        console.log(
          `[Penalty] Video ${current.id} similar to ${previous.id} (${similarity.toFixed(3)}), penalty: ${penaltyFactor.toFixed(3)}`
        );
        penalizedIndices.add(i);
      }
    }

    // Check consecutive cities
    if (current.city) {
      if (current.city === consecutiveCity.city) {
        consecutiveCity.count++;
      } else {
        consecutiveCity = { city: current.city, count: 1 };
      }

      if (consecutiveCity.count > config.maxSameCityConsecutive) {
        penaltyFactor *= 0.5; // Heavy penalty for too many same city
        console.log(
          `[Penalty] Video ${current.id} - too many from city ${current.city}, penalty: ${penaltyFactor.toFixed(3)}`
        );
        penalizedIndices.add(i);
      }
    }

    // Check consecutive hosts (same person listing multiple videos)
    if (current.hostUserId) {
      if (current.hostUserId === consecutiveHost.hostId) {
        consecutiveHost.count++;
      } else {
        consecutiveHost = { hostId: current.hostUserId, count: 1 };
      }

      if (consecutiveHost.count > config.maxSameHostConsecutive) {
        penaltyFactor *= 0.3; // Very heavy penalty for same host twice
        console.log(
          `[Penalty] Video ${current.id} - consecutive from same host, penalty: ${penaltyFactor.toFixed(3)}`
        );
        penalizedIndices.add(i);
      }
    }

    // Apply penalty factor to score
    if (penaltyFactor < 1.0) {
      result[i] = {
        ...current,
        score: current.score * penaltyFactor
      };
    }
  }

  console.log(
    `[applyDiversityPenalties] Penalized ${penalizedIndices.size}/${videos.length} videos for diversity`
  );

  // Re-sort after penalties
  result.sort((a, b) => b.score - a.score);

  return result;
}

/**
 * Re-ranking algorithm: greedy selection for maximum diversity
 *
 * Algorithm:
 * 1. Start with highest-scoring video
 * 2. For each subsequent position, pick video with:
 *    - Highest score
 *    - But different from most recent N videos
 * 3. Results in balanced feed: good scores + good diversity
 */
export function rerankForDiversity(
  videos: VideoMetadata[],
  lookbackWindow: number = 3,
  config: DiversityConfig = DEFAULT_CONFIG
): VideoMetadata[] {
  if (videos.length <= config.minItemsThreshold) {
    return videos;
  }

  const reranked: VideoMetadata[] = [];
  const available = [...videos];

  // Start with highest scored
  const first = available.shift();
  if (first) {
    reranked.push(first);
    console.log(
      `[rerankForDiversity] Starting with video ${first.id} (score: ${first.score.toFixed(3)})`
    );
  }

  // Greedy selection for remaining items
  while (available.length > 0) {
    // Get recent videos to avoid (lookback window)
    const recentVideos = reranked.slice(
      Math.max(0, reranked.length - lookbackWindow)
    );

    // Find best video that's different from recent ones
    let bestScore = -1;
    let bestIndex = 0;
    let bestDiversity = 0;

    for (let i = 0; i < available.length; i++) {
      const candidate = available[i];

      // Calculate average dissimilarity to recent videos
      const similarities = recentVideos.map((recent) =>
        calculateSimilarity(recent, candidate)
      );
      const avgSimilarity =
        similarities.length > 0
          ? similarities.reduce((a, b) => a + b, 0) / similarities.length
          : 0.5;

      // Diversity score: prefer diverse (low similarity)
      const diversity = 1 - avgSimilarity;

      // Weighted: prioritize score but boost diversity
      const compositeScore = candidate.score * 0.7 + diversity * 0.3;

      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestIndex = i;
        bestDiversity = diversity;
      }
    }

    // Add best candidate
    const selected = available.splice(bestIndex, 1)[0];
    reranked.push(selected);

    console.log(
      `[rerankForDiversity] Selected video ${selected.id} (score: ${selected.score.toFixed(3)}, diversity: ${bestDiversity.toFixed(3)})`
    );
  }

  console.log(
    `[rerankForDiversity] Reranked ${videos.length} videos for diversity`
  );

  return reranked;
}

/**
 * Diversify a list using both penalties + re-ranking
 * This is the main export function
 */
export function diversifyVideoList(
  videos: VideoMetadata[],
  method: "penalties" | "rerank" | "both" = "both",
  config: DiversityConfig = DEFAULT_CONFIG
): VideoMetadata[] {
  console.log(
    `[diversifyVideoList] Diversifying ${videos.length} videos using method: ${method}`
  );

  if (method === "penalties") {
    return applyDiversityPenalties(videos, config);
  } else if (method === "rerank") {
    return rerankForDiversity(videos, 3, config);
  } else {
    // "both": Apply penalties first, then re-rank
    const afterPenalties = applyDiversityPenalties(videos, config);
    return rerankForDiversity(afterPenalties, 3, config);
  }
}

export default {
  calculateSimilarity,
  applyDiversityPenalties,
  rerankForDiversity,
  diversifyVideoList
};
