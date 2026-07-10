/**
 * Unit Tests for Video Prioritization & Rotation System
 *
 * Tests cover:
 * - Scoring calculations (freshness, engagement, relevance, penalties)
 * - Diversity algorithms (similarity, re-ranking)
 * - Rotation logic (permutation, cycle, TTL)
 * - Integration scenarios
 */

import * as ScoringService from "../videoScoringService";
import * as DiversityService from "../videoDiversityService";
import * as RotationAlgorithm from "../videoRotationAlgorithm";
import * as RotationTracker from "../videoRotationTracker";

// ============================================================================
// SCORING SERVICE TESTS
// ============================================================================

describe("Scoring Service", () => {
  describe("calculateFreshnessScore", () => {
    it("should return 1.0 for video created just now", () => {
      const now = new Date();
      const score = ScoringService.calculateFreshnessScore(now, now);
      expect(score).toBeCloseTo(1.0, 2);
    });

    it("should return lower score for older videos", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const score1h = ScoringService.calculateFreshnessScore(oneHourAgo, now);
      const score2d = ScoringService.calculateFreshnessScore(twoDaysAgo, now);

      expect(score1h).toBeGreaterThan(score2d);
      expect(score1h).toBeGreaterThan(0.7);
      expect(score2d).toBeGreaterThan(0.3);
    });

    it("should decay exponentially with half-life of 48 hours", () => {
      const now = new Date();
      const after48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const video = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const scoreAtVideo = ScoringService.calculateFreshnessScore(video, now);
      const scoreAfter48h = ScoringService.calculateFreshnessScore(
        video,
        after48h
      );

      // After one half-life (48h), score should be ~50% of original
      expect(scoreAfter48h).toBeCloseTo(scoreAtVideo * 0.5, 1);
    });
  });

  describe("calculateEngagementScore", () => {
    it("should reward high engagement", () => {
      const lowEngagement = {
        id: 1,
        createdAt: new Date(),
        likesCount: 5,
        commentsCount: 1,
        viewCount: 500,
        completionRate: 0.3
      };

      const highEngagement = {
        id: 2,
        createdAt: new Date(),
        likesCount: 100,
        commentsCount: 30,
        viewCount: 500,
        completionRate: 0.9
      };

      const scorelow = ScoringService.calculateEngagementScore(lowEngagement);
      const scoreHigh = ScoringService.calculateEngagementScore(highEngagement);

      expect(scoreHigh).toBeGreaterThan(scorelow);
    });

    it("should give credit for high completion rate", () => {
      const lowCompletion = {
        id: 1,
        createdAt: new Date(),
        likesCount: 10,
        commentsCount: 2,
        viewCount: 100,
        completionRate: 0.2
      };

      const highCompletion = {
        id: 2,
        createdAt: new Date(),
        likesCount: 10,
        commentsCount: 2,
        viewCount: 100,
        completionRate: 0.95
      };

      const scoreLow = ScoringService.calculateEngagementScore(lowCompletion);
      const scoreHigh = ScoringService.calculateEngagementScore(highCompletion);

      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });
  });

  describe("calculateSeenPenalty", () => {
    it("should return 1.0 for never-seen videos", () => {
      const penalty = ScoringService.calculateSeenPenalty(null);
      expect(penalty).toBe(1.0);
    });

    it("should heavily penalize recently seen videos", () => {
      const now = new Date();

      const justSeen = ScoringService.calculateSeenPenalty(now, now);
      const seenAnHourAgo = ScoringService.calculateSeenPenalty(
        new Date(now.getTime() - 60 * 60 * 1000),
        now
      );
      const seen24hAgo = ScoringService.calculateSeenPenalty(
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        now
      );

      expect(justSeen).toBeLessThan(0.1); // Very heavy penalty
      expect(seenAnHourAgo).toBeLessThan(0.15);
      expect(seen24hAgo).toBeGreaterThan(0.2); // Lighter penalty after 24h
    });

    it("should remove penalty after TTL expires", () => {
      const now = new Date();
      const seen72hAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

      const penalty = ScoringService.calculateSeenPenalty(seen72hAgo, now);
      expect(penalty).toBeCloseTo(1.0, 1); // Full recovery
    });
  });

  describe("scoreVideo", () => {
    it("should score new, high-engagement video highly", () => {
      const now = new Date();
      const video = {
        id: 1,
        createdAt: now,
        likesCount: 50,
        commentsCount: 10,
        viewCount: 200,
        completionRate: 0.8,
        city: "New York",
        propertyType: "Apartment",
        bedrooms: 2
      };

      const score = ScoringService.scoreVideo(video, {
        userCity: "New York",
        preferredPropertyTypes: ["Apartment"],
        preferredBedrooms: 2
      });

      expect(score.score).toBeGreaterThan(0.7);
      expect(score.breakdown.freshness).toBeGreaterThan(0.9);
      expect(score.breakdown.engagement).toBeGreaterThan(0.5);
      expect(score.breakdown.relevance).toBeGreaterThan(0.8);
    });

    it("should score old, low-engagement video poorly", () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const video = {
        id: 2,
        createdAt: oldDate,
        likesCount: 1,
        commentsCount: 0,
        viewCount: 10,
        completionRate: 0.1
      };

      const score = ScoringService.scoreVideo(video, {});

      expect(score.score).toBeLessThan(0.5);
      expect(score.breakdown.freshness).toBeLessThan(0.3);
      expect(score.breakdown.engagement).toBeLessThan(0.2);
    });
  });
});

// ============================================================================
// DIVERSITY SERVICE TESTS
// ============================================================================

describe("Diversity Service", () => {
  describe("calculateSimilarity", () => {
    it("should return 1.0 for identical videos", () => {
      const v = {
        id: 1,
        score: 0.8,
        city: "New York",
        zone: "Manhattan",
        propertyType: "Apartment",
        price: 3000,
        bedrooms: 2
      };

      const similarity = DiversityService.calculateSimilarity(v, v);
      expect(similarity).toBeCloseTo(1.0, 1);
    });

    it("should return low similarity for different videos", () => {
      const v1 = {
        id: 1,
        score: 0.8,
        city: "New York",
        zone: "Manhattan",
        propertyType: "Apartment",
        price: 3000,
        bedrooms: 2
      };

      const v2 = {
        id: 2,
        score: 0.7,
        city: "Los Angeles",
        zone: "West Hollywood",
        propertyType: "House",
        price: 5000,
        bedrooms: 4
      };

      const similarity = DiversityService.calculateSimilarity(v1, v2);
      expect(similarity).toBeLessThan(0.3);
    });

    it("should penalize same city but different details", () => {
      const v1 = {
        id: 1,
        score: 0.8,
        city: "New York",
        zone: "Manhattan",
        propertyType: "Apartment",
        price: 3000
      };

      const v2 = {
        id: 2,
        score: 0.7,
        city: "New York",
        zone: "Brooklyn",
        propertyType: "House",
        price: 2000
      };

      const similarity = DiversityService.calculateSimilarity(v1, v2);
      expect(similarity).toBeGreaterThan(0.2);
      expect(similarity).toBeLessThan(0.7);
    });
  });

  describe("applyDiversityPenalties", () => {
    it("should penalize consecutive similar videos", () => {
      const videos = [
        {
          id: 1,
          score: 0.9,
          city: "New York",
          propertyType: "Apartment"
        },
        {
          id: 2,
          score: 0.85,
          city: "New York", // Same city - should be penalized
          propertyType: "Apartment" // Same type
        },
        {
          id: 3,
          score: 0.8,
          city: "Los Angeles",
          propertyType: "House"
        }
      ];

      const penalized = DiversityService.applyDiversityPenalties(videos);

      // Video 2 should be penalized and potentially reordered
      expect(penalized.length).toBe(3);
      // First should still be video 1
      expect(penalized[0].id).toBe(1);
    });
  });

  describe("rerankForDiversity", () => {
    it("should rerank to maximize diversity", () => {
      const videos = [
        {
          id: 1,
          score: 0.9,
          city: "New York",
          propertyType: "Apartment"
        },
        {
          id: 2,
          score: 0.88,
          city: "New York",
          propertyType: "Apartment"
        },
        {
          id: 3,
          score: 0.85,
          city: "Los Angeles",
          propertyType: "House"
        },
        {
          id: 4,
          score: 0.8,
          city: "Chicago",
          propertyType: "Condo"
        }
      ];

      const reranked = DiversityService.rerankForDiversity(videos);

      // Should still have 4 videos
      expect(reranked.length).toBe(4);

      // First should still be highest scorer
      expect(reranked[0].id).toBe(1);

      // Should avoid putting similar videos together
      // Video 3 or 4 (different cities) should come before video 2
      const video2Position = reranked.findIndex((v) => v.id === 2);
      const video3Or4Before2 = reranked
        .slice(0, video2Position)
        .some((v) => v.id === 3 || v.id === 4);
      expect(video3Or4Before2).toBe(true);
    });
  });
});

// ============================================================================
// ROTATION ALGORITHM TESTS
// ============================================================================

describe("Rotation Algorithm", () => {
  describe("generateRotationSequence", () => {
    it("should generate consistent permutation for same user", async () => {
      const userId = "test-user-1";
      const videoIds = [1, 2, 3, 4, 5];

      const seq1 = await RotationAlgorithm.generateRotationSequence(
        userId,
        videoIds
      );
      const seq2 = await RotationAlgorithm.generateRotationSequence(
        userId,
        videoIds
      );

      // Same user should get same sequence
      expect(seq1.orderedVideoIds).toEqual(seq2.orderedVideoIds);
    });

    it("should generate different permutations for different users", async () => {
      const user1 = "test-user-1";
      const user2 = "test-user-2";
      const videoIds = [1, 2, 3, 4, 5];

      // Reset trackers to ensure fresh keys
      await RotationTracker.clearViewHistory(user1);
      await RotationTracker.clearViewHistory(user2);

      const seq1 = await RotationAlgorithm.generateRotationSequence(
        user1,
        videoIds
      );
      const seq2 = await RotationAlgorithm.generateRotationSequence(
        user2,
        videoIds
      );

      // Different users should get different sequences (with very high probability)
      expect(seq1.orderedVideoIds).not.toEqual(seq2.orderedVideoIds);
    });

    it("should track cycle completion", async () => {
      const userId = "test-user-cycle";
      await RotationTracker.clearViewHistory(userId);

      const videoIds = [1, 2, 3, 4, 5];

      // Initial: 0% complete
      let seq = await RotationAlgorithm.generateRotationSequence(
        userId,
        videoIds
      );
      expect(seq.cycleCompletion).toBe(0);

      // View 2 videos
      await RotationTracker.recordVideoView(userId, 1);
      await RotationTracker.recordVideoView(userId, 2);

      seq = await RotationAlgorithm.generateRotationSequence(userId, videoIds);
      expect(seq.cycleCompletion).toBeCloseTo(0.4, 1);

      // View all 5
      await RotationTracker.recordVideoView(userId, 3);
      await RotationTracker.recordVideoView(userId, 4);
      await RotationTracker.recordVideoView(userId, 5);

      seq = await RotationAlgorithm.generateRotationSequence(userId, videoIds);
      expect(seq.cycleCompletion).toBeCloseTo(1.0, 1);
    });
  });

  describe("filterEligibleVideos", () => {
    it("should exclude recently viewed videos", async () => {
      const userId = "test-user-filter";
      await RotationTracker.clearViewHistory(userId);

      const videoIds = [1, 2, 3, 4, 5];

      // View video 1 and 2
      await RotationTracker.recordVideoView(userId, 1);
      await RotationTracker.recordVideoView(userId, 2);

      // Filter with 24h TTL (should exclude 1 and 2)
      const eligible = await RotationAlgorithm.filterEligibleVideos(
        userId,
        videoIds,
        24
      );

      expect(eligible).toEqual([3, 4, 5]);
    });

    it("should include videos after TTL expires", async () => {
      const userId = "test-user-ttl";
      await RotationTracker.clearViewHistory(userId);

      const videoIds = [1, 2, 3];

      // Mock: pretend video 1 was viewed 48 hours ago
      const state = await RotationTracker.getRotationState(userId);
      state.viewedVideos.push({
        videoId: 1,
        viewedAt: Date.now() - 48 * 60 * 60 * 1000
      });

      // With 24h TTL, should be eligible
      const eligible = await RotationAlgorithm.filterEligibleVideos(
        userId,
        videoIds,
        24
      );

      expect(eligible).toContain(1);
      expect(eligible).toContain(2);
      expect(eligible).toContain(3);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration Scenarios", () => {
  it("should handle complete user journey: first visit → rotation → reset", async () => {
    const userId = "test-integration-user";
    await RotationTracker.clearViewHistory(userId);

    const videos = [
      {
        id: 1,
        createdAt: new Date(),
        likesCount: 100,
        commentsCount: 20,
        viewCount: 500,
        completionRate: 0.9,
        city: "New York",
        zone: "Manhattan",
        propertyType: "Apartment",
        price: 3000,
        bedrooms: 2,
        hostUserId: "host-1",
        score: 0.9
      },
      {
        id: 2,
        createdAt: new Date(),
        likesCount: 80,
        commentsCount: 15,
        viewCount: 400,
        completionRate: 0.85,
        city: "New York",
        zone: "Brooklyn",
        propertyType: "House",
        price: 3500,
        bedrooms: 3,
        hostUserId: "host-2",
        score: 0.85
      },
      {
        id: 3,
        createdAt: new Date(),
        likesCount: 60,
        commentsCount: 10,
        viewCount: 300,
        completionRate: 0.8,
        city: "Los Angeles",
        zone: "West Hollywood",
        propertyType: "Apartment",
        price: 2500,
        bedrooms: 1,
        hostUserId: "host-3",
        score: 0.8
      }
    ];

    // Step 1: User first visits - should get full rotation
    let rotation = await RotationAlgorithm.generateRotationSequence(
      userId,
      videos.map((v) => v.id)
    );
    expect(rotation.cycleCompletion).toBe(0);
    expect(rotation.orderedVideoIds.length).toBe(3);

    // Step 2: User views videos in order
    await RotationTracker.recordVideoView(userId, rotation.orderedVideoIds[0]);
    await RotationTracker.recordVideoView(userId, rotation.orderedVideoIds[1]);

    rotation = await RotationAlgorithm.generateRotationSequence(
      userId,
      videos.map((v) => v.id)
    );
    expect(rotation.cycleCompletion).toBeCloseTo(0.67, 1);

    // Step 3: Viewed all - cycle full
    await RotationTracker.recordVideoView(userId, rotation.orderedVideoIds[2]);

    rotation = await RotationAlgorithm.generateRotationSequence(
      userId,
      videos.map((v) => v.id)
    );
    expect(rotation.cycleCompletion).toBe(1.0);
  });
});

export default {
  // Tests are self-contained
};
