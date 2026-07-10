# Advanced Video Prioritization & Rotation Algorithm

## Overview

This system implements a sophisticated video recommendation feed that balances **novelty**, **diversity**, **engagement**, and **replay prevention**. It's inspired by Zillow's recommendation diversity research and prevents users from seeing repetitive content while maintaining a fresh, personalized experience.

## Architecture

The system consists of four core services that work together:

```
┌─────────────────────────────────────────────────────────┐
│         Video Feed Request (user scrolls)               │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴────────────┬──────────────┐
         ▼                        ▼              ▼
    ┌─────────┐           ┌────────────┐   ┌──────────┐
    │ Scoring │           │ Rotation   │   │ Tracking │
    │ Service │           │ Tracker    │   │ Service  │
    └─────────┘           └────────────┘   └──────────┘
         │                     │                │
         │ Scores videos       │ Gets view      │ Records
         │ (0-1) based on:     │ history        │ what user
         │ • Freshness         │ for this user  │ has seen
         │ • Engagement        │ TTL: 24h       │
         │ • Relevance         │                │
         │ • Seen penalty      │                │
         └──────────┬──────────┴────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  Diversity       │
          │  Service         │
          └──────────────────┘
          Reranks to avoid
          consecutive similar
          videos (same city,
          type, host, etc)
                    │
                    ▼
          ┌──────────────────┐
          │ Final Feed       │
          │ (Rotated,        │
          │  Diverse,        │
          │  Personalized)   │
          └──────────────────┘
```

## Core Services

### 1. Scoring Service (`videoScoringService.ts`)

Calculates a composite score (0-1) for each video based on multiple factors:

#### Components:

**Freshness Score (Weight: 35%)**

- Uses exponential decay with 48-hour half-life
- Recent videos (< 24h): 0.95-1.0
- 2-7 days old: 0.25-0.70
- Ensures new listings get visibility quickly

```typescript
freshnessScore = exp(-ageInHours / 48);
```

**Engagement Score (Weight: 25%)**

- Combines: likes, comments, view count, completion rate
- Formula: `0.4 * engagementRate + 0.3 * completionRate + 0.2 * commentScore + 0.1 * likeScore`
- Indicators of content quality and viewer satisfaction

**Relevance Score (Weight: 25%)**

- Matches video to user preferences:
  - Location (city/zone): 0-1.0
  - Property type: 0-1.0
  - Bedrooms/bathrooms: deviation-based
  - Price range: in-range vs out-of-range
- Weighted average of matched dimensions

**Seen Penalty (Weight: 15%)**

- Dramatically reduces score for recently viewed videos
- Penalty schedule:
  - Just seen (0-1h): 0.05 (95% penalty)
  - 1-6 hours: 0.10 (90% penalty)
  - 6-24 hours: 0.30 (70% penalty)
  - 24-48 hours: 0.60 (40% penalty)
  - 48h+: 1.0 (no penalty)

#### Final Score:

```
compositeScore = (
  freshnessScore * 0.35 +
  engagementScore * 0.25 +
  relevanceScore * 0.25 +
  seenPenalty * 0.15
)
```

**Example:**

```
Video A: New (0.95), Highly engaged (0.8), Matches preferences (0.9), Never seen (1.0)
Score = 0.95*0.35 + 0.8*0.25 + 0.9*0.25 + 1.0*0.15 = 0.9075 ✅

Video B: 5 days old (0.4), Low engagement (0.2), Different city (0.3), Viewed 2h ago (0.08)
Score = 0.4*0.35 + 0.2*0.25 + 0.3*0.25 + 0.08*0.15 = 0.2595 ❌
```

### 2. Rotation Tracker (`videoRotationTracker.ts`)

Manages per-user view history with TTL (time-to-live) and deduplication:

**Key Concepts:**

- **View History**: LocalStorage (AsyncStorage) maintains list of {videoId, viewedAt, watchDuration}
- **TTL**: 24 hours - after this, video becomes eligible for re-rotation
- **Deduplication**: Same video viewed within 5 minutes updates existing record (not doubled)
- **Cycle Tracking**: Counts how many unique videos user has seen

**Storage Structure:**

```typescript
VideoRotationState {
  userId: string | number
  viewedVideos: [
    { videoId: 1, viewedAt: timestamp, watchDurationSec: 45, completionRate: 0.95 },
    { videoId: 3, viewedAt: timestamp, watchDurationSec: 12, completionRate: 0.3 },
    ...
  ]
  userPermutationKey: "abc123..." // Random seed for this user
  currentCounter: 42 // For permutation calculation
  lastRotationReset: timestamp
}
```

**Core Functions:**

- `recordVideoView(userId, videoId)` - Mark video as viewed
- `hasViewedVideo(userId, videoId)` - Check if seen before
- `getLastViewTime(userId, videoId)` - Get timestamp of last view
- `isEligibleForRotation(userId, videoId, ttlHours=24)` - Check if TTL expired
- `getViewHistory(userId)` - Get all viewed videos
- `clearViewHistory(userId)` - Manual reset (testing)
- `resetRotationCycle(userId)` - Full cycle reset after 72+ hours

### 3. Diversity Service (`videoDiversityService.ts`)

Post-processing to ensure variety in feed and prevent monotony:

**Problem Solved:**
Without diversity, top-scored videos might all be 2BR apartments in Manhattan, leading to repetitive feed.

**Similarity Metrics (0-1 scale, 1 = identical):**

- **Location**: City match (0.4) + Zone match (0.5)
- **Property Type**: Type match (0.25)
- **Price**: Similar if within 20% (0.15)
- **Size**: Bedroom match (0.1)

**Example Similarities:**

```
2BR in Manhattan vs 2BR in Manhattan = 0.95 (too similar ❌)
2BR in Manhattan vs 3BR in Brooklyn = 0.50 (somewhat similar ⚠️)
2BR Apartment in Manhattan vs 4BR House in LA = 0.10 (diverse ✅)
```

**Algorithms:**

1. **Penalty Method**: Reduce scores for similar items

   ```
   if similarity_to_previous > 0.6:
     newScore = oldScore * 0.7
   ```

2. **Re-ranking Method**: Greedy selection for maximum diversity

   ```
   FOR each position:
     SELECT video with:
       - Highest composite score (0.7 weight)
       - Lowest avg similarity to recent 3 (0.3 weight)
   ```

3. **Combined Method** (default):
   ```
   Apply penalties THEN re-rank
   Results in balanced: quality + diversity
   ```

### 4. Rotation Algorithm (`videoRotationAlgorithm.ts`)

Implements virtual permutation cycle to guarantee complete catalog coverage:

**Problem Solved:**
Ensuring user sees every video before any repeats.

**How It Works:**

1. **User-Specific Permutation**:
   - Each user gets random "permutation key" on first visit
   - Key never changes for that user (consistent ordering)
   - Different users get different keys (different orderings)

2. **Deterministic but Pseudo-Random**:

   ```
   permutationIndex(counter, userKey) =
     (LCG_hash(userKey + counter)) % totalVideos

   Result: Position appears random but is always same for same user+counter
   ```

3. **Complete Cycle**:

   ```
   User sees videos in order determined by permutation:
   Video order for user: [5, 2, 8, 1, 4, 3, 7, 6, 9]

   Call 1: Show videos [5, 2, 8]
   User views all

   Call 2: Show videos [1, 4, 3] (next in sequence)
   User views all

   Call 3: Show videos [7, 6, 9] (complete first cycle)
   User views all

   Call 4: After 72h+ with no new videos → Reset cycle
   User gets new key, different order: [3, 9, 1, 5, 7, 2, 8, 4, 6]
   ```

4. **TTL & Eligibility**:
   - Recently viewed videos get lower scores (scoring service)
   - After 24h TTL, video is eligible to show again
   - After 72h + >90% viewed, cycle resets

## End-to-End Flow

### User Session Example

```
TIME 1: User opens Video Feed
├─ Query: GET /videos/feed?page=1
├─ Backend gets 20 videos from database
├─ Backend calculates scores for each:
│  └─ Uses user preferences, view history, engagement metrics
├─ Backend sorts by score (descending)
├─ Backend applies diversity re-ranking
├─ Backend returns 10 videos
└─ Frontend displays videos 1-10

TIME 2: User scrolls to position 7
├─ Frontend checks: currentPosition = 7
├─ Threshold triggered: 7/10 > 0.3 (30% from bottom)
├─ Query: GET /videos/feed?page=2&cursor=lastVideoId
├─ Backend repeats scoring process
├─ Backend excludes recently seen videos
├─ Backend returns next 10 videos
└─ Frontend displays videos 1-20

TIME 3: User views video 5
├─ Frontend calls: POST /videos/{videoId}/view
├─ Backend records: recordVideoView(userId=123, videoId=5, watchDuration=45s)
├─ Local tracker stores: {videoId: 5, viewedAt: now, duration: 45}
└─ Video 5 now has 95% penalty for next requests

TIME 4: User returns 2 hours later
├─ Query: GET /videos/feed?page=1
├─ Backend checks TTL for video 5:
│  └─ 2 hours < 24 hour TTL → penalty still 90%
│  └─ Video 5 won't appear in top results
├─ Instead shows: video 3 (new), video 7 (old but 3+ days seen), video 1 (highly relevant)
└─ Different feed, less repetition

TIME 5: User returns 1 week later
├─ Backend checks TTL for videos from week 1:
│  └─ 7 days >= 24 hour TTL → penalty removed
│  └─ Videos become eligible for re-rotation
├─ If user has seen 95%+ of catalog:
│  └─ Rotation cycle resets
│  └─ New permutation key generated
│  └─ Cycle count reset to 0
└─ User can now see repeat videos, but in different order
```

## Performance Characteristics

| Operation            | Time Complexity   | Space Complexity | Notes                          |
| -------------------- | ----------------- | ---------------- | ------------------------------ |
| Score video          | O(P)              | O(1)             | P = number of user preferences |
| Score N videos       | O(N\*P)           | O(N)             | Linear in videos               |
| Check similarity     | O(1)              | O(1)             | Fixed dimensions               |
| Diversity re-rank    | O(N² \* lookback) | O(N)             | ~O(N²) worst case              |
| Generate permutation | O(N)              | O(N)             | Shuffle array                  |
| Record view          | O(1)              | O(V)             | V = total views in history     |
| Check eligibility    | O(V)              | O(1)             | Linear scan of history         |

**Optimization Notes:**

- View history capped at 1000 (trim to 500 when exceeded)
- Diversity only applied if N > 3 videos
- Similarities calculated on-demand (cached in-memory during session)
- Permutation calculation is O(N) shuffle but happens once per session

## Configuration

### Weights (Scoring)

```typescript
weights: {
  freshness: 0.35,    // Prioritize recent videos
  engagement: 0.25,   // Reward popular content
  relevance: 0.25,    // Match user preferences
  seenPenalty: 0.15   // Discourage repeats
}
```

**Adjust for different strategies:**

- **"Fresh Feed"**: freshness: 0.5, others: 0.17
- **"Quality Focus"**: engagement: 0.4, others: 0.2
- **"Discovery"**: relevance: 0.1, freshness: 0.5, others: 0.2

### Diversity Config

```typescript
{
  similarityPenalty: 0.7,           // Reduce score to 70% if similar
  minItemsThreshold: 3,              // Only diversify if N >= 3
  maxSameCityConsecutive: 2,         // Max 2 consecutive same city
  maxSameHostConsecutive: 1,         // No consecutive same host
  similarityThreshold: 0.6           // Penalize if similarity > 60%
}
```

### TTL & Reset

```typescript
ROTATION_TTL_HOURS = 24; // Video becomes eligible again after 24h
RESET_THRESHOLD_HOURS = 72; // Reset cycle if 72h+ with >90% seen
```

## Testing

Run tests:

```bash
npm test -- videoRotation.test.ts
```

**Test Coverage:**

- ✅ Freshness score exponential decay
- ✅ Engagement score composition
- ✅ Seen penalty schedule
- ✅ Similarity calculations
- ✅ Diversity penalties and re-ranking
- ✅ Permutation determinism
- ✅ Cycle completion tracking
- ✅ TTL eligibility
- ✅ Complete user journeys

## Implementation Checklist

- [ ] Install services in `/services` directory
- [ ] Configure AsyncStorage for view history
- [ ] Integrate scoring into backend GetVideoFeed
- [ ] Add recordVideoView call after video completion
- [ ] Update frontend infinite query to pass userId
- [ ] Configure weights for your content strategy
- [ ] Run tests and verify behavior
- [ ] Monitor metrics:
  - [ ] Average repeat rate (% of shown videos already seen)
  - [ ] Cycle completion rate (% of catalog seen per session)
  - [ ] User satisfaction (likes, watch duration)
  - [ ] Diversity metrics (consecutive same city/type ratio)

## Backend Integration (Go)

In `video.go` `GetVideoFeed()`:

```go
// 1. Get user's view history
viewHistory := rotationTracker.GetViewHistory(userID)

// 2. Score each video
scoredVideos := make([]VideoScore, 0)
for _, video := range videos {
  score := scoringService.ScoreVideo(
    video,
    userPreferences,
    viewHistory[video.ID],
  )
  scoredVideos = append(scoredVideos, score)
}

// 3. Sort by score
sort.Slice(scoredVideos, func(i, j int) bool {
  return scoredVideos[i].Score > scoredVideos[j].Score
})

// 4. Apply diversity
diverse := diversityService.DiversifyVideoList(scoredVideos)

// 5. Apply rotation algorithm
rotated := rotationAlgorithm.ApplyRotationLogic(userID, diverse)

// 6. Return rotated feed
return rotated[:limit]
```

## Monitoring & Analytics

**Key Metrics:**

1. **Repeat Rate**: % of videos user has seen before
   - Target: < 10% in first page
   - Indicates: Are we preventing repeats?

2. **Diversity**: Avg similarity between consecutive videos
   - Target: < 0.4
   - Indicates: Is feed varied?

3. **Cycle Completion**: % of catalog user has seen
   - Target: 80% before reset
   - Indicates: Complete coverage?

4. **Engagement**: Watch duration, completion rate
   - Indicates: Is content quality good?

5. **Reset Events**: How often cycles reset per user
   - Target: Once per week for heavy users
   - Indicates: TTL strategy working?

## Troubleshooting

### Videos keep repeating

- [ ] Check TTL settings (should be 24h)
- [ ] Verify recordVideoView is being called
- [ ] Check view history storage (AsyncStorage working?)
- [ ] Increase seenPenalty weight

### Not enough diversity

- [ ] Reduce similarityThreshold (e.g., 0.5)
- [ ] Increase similarityPenalty (e.g., 0.5)
- [ ] Add more metadata (zone, neighborhood)
- [ ] Use "rerank" diversification method

### Cycle never resets

- [ ] Check that 72+ hours has passed with >90% seen
- [ ] Verify new videos are being added to catalog
- [ ] Manually test resetRotationCycle()

### Performance issues

- [ ] Reduce video batch size (per page)
- [ ] Limit diversity lookback window (from 3 to 2)
- [ ] Cache similarity calculations
- [ ] Use approximate algorithms for large catalogs

## References

- [Zillow's Recommendation Diversity Research](https://www.zillow.com/news/personalized-recommendation-diversity/)
- [How Recommender Systems Handle Diversity & Novelty - Milvus](https://milvus.io/ai-quick-reference/how-do-recommender-systems-handle-diversity-and-novelty)
- [Stack Overflow: Preventing Item Repetition](https://stackoverflow.com/questions/931247/ensuring-that-items-that-have-been-viewed-are-not-seen-again)
- [Fisher-Yates Shuffle Algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
- [Linear Congruential Generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
