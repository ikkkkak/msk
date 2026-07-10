# Advanced Video Rotation - Implementation Quick Start

## 📋 What You Get

This complete system implements:

```
✅ Scoring Algorithm
   - Freshness (exponential decay)
   - Engagement (likes, comments, completion)
   - Relevance (user preferences)
   - Seen penalty (no repeats)

✅ Diversity Engine
   - Similarity detection (location, type, price)
   - Diversity penalties & re-ranking
   - Prevents monotonous feeds

✅ Rotation Mechanism
   - Virtual permutation cycles
   - Complete catalog coverage before repeats
   - User-specific but deterministic orderings

✅ View Tracking
   - Local storage via AsyncStorage
   - TTL-based eligibility (24h default)
   - Cycle reset after 72h

✅ Comprehensive Tests
   - Unit tests for all components
   - Integration tests for full flows
   - Mock data generators

✅ Documentation
   - Architecture guide
   - Backend integration examples
   - Configuration reference
```

## 🚀 Quick Start (5 minutes)

### Step 1: Install Services

Copy these 4 files to `/services`:

```
✓ videoScoringService.ts          (Scoring logic)
✓ videoDiversityService.ts        (Diversity algorithms)
✓ videoRotationAlgorithm.ts       (Permutation & cycles)
✓ videoRotationTracker.ts         (View history tracking)
```

### Step 2: Import in Your Feed Hook

In `hooks/queries/useCursorVideoFeed.ts`:

```typescript
import * as ScoringService from "../../services/videoScoringService";
import * as DiversityService from "../../services/videoDiversityService";
import * as RotationTracker from "../../services/videoRotationTracker";
```

### Step 3: Process Videos with Scoring

```typescript
// In your queryFn (after fetching videos from API):

const { user } = useUser();
const userId = user?.ID ?? "anonymous";

// Build view history map
const viewHistoryMap = await RotationTracker.buildViewHistoryMap(userId);

// Score each video
const scoredVideos = ScoringService.scoreVideos(
  videos,
  {
    userCity: user?.preferredCity,
    userZone: user?.preferredZone,
    preferredPropertyTypes: user?.preferences?.propertyTypes,
    preferredBedrooms: user?.preferences?.bedrooms,
    preferredPriceRange: user?.preferences?.priceRange
  },
  viewHistoryMap
);

// Extract scores for sorting
const videosByScore = scoredVideos.map((s) => ({
  ...videoMap.get(s.videoId),
  score: s.score
}));

// Apply diversity
const diversified = DiversityService.diversifyVideoList(videosByScore, "both");

// Return diversified videos
return {
  videos: diversified,
  nextCursor: response.nextCursor,
  hasMore: response.hasMore
};
```

### Step 4: Record Views When Video Completes

```typescript
// When user finishes watching a video:
await RotationTracker.recordVideoView(
  userId,
  videoId,
  watchDurationSeconds,
  completionRate // 0-1, e.g., 0.95 for 95% watched
);
```

## 🎯 Configuration Presets

### Preset 1: Balanced (Default)

Good for most use cases:

```typescript
const weights = {
  freshness: 0.35,
  engagement: 0.25,
  relevance: 0.25,
  seenPenalty: 0.15
};
```

### Preset 2: Fresh Feed

Emphasize recent videos:

```typescript
const weights = {
  freshness: 0.5,
  engagement: 0.15,
  relevance: 0.2,
  seenPenalty: 0.15
};
```

### Preset 3: Quality Focus

Emphasize popular content:

```typescript
const weights = {
  freshness: 0.2,
  engagement: 0.4,
  relevance: 0.25,
  seenPenalty: 0.15
};
```

### Preset 4: Discovery

Emphasize relevant personalized content:

```typescript
const weights = {
  freshness: 0.25,
  engagement: 0.15,
  relevance: 0.45,
  seenPenalty: 0.15
};
```

## 📊 Expected Behavior

### Before Implementation

```
User opens feed multiple times:
- Day 1: See videos [1, 2, 3, 4, 5] (same order each time)
- Day 2: See videos [1, 2, 3, 4, 5] (REPEATS!)
- Day 3: See videos [1, 2, 3, 4, 5] (REPEATS!)
- Frustration: 100%
```

### After Implementation

```
User opens feed multiple times:
- Day 1: See videos [5, 3, 2, 1, 4] (rotated order)
- Scroll down: See [7, 9, 6, 8] (different content, diverse)
- Day 2 (2 hours later): See [3, 8, 5, 2] (old videos pushed to bottom)
- Day 2 (24+ hours later): See [5, 3, 2, 1, 4] (eligible for re-rotation)
- Day 8 (72+ hours, >90% seen): Cycle resets, new order!
- Satisfaction: ✨✨✨
```

## 🧪 Testing Your Implementation

### Quick Smoke Test

```typescript
// In your React Native component:
import * as RotationTracker from "../../services/videoRotationTracker";
import * as ScoringService from "../../services/videoScoringService";

async function testRotationSystem() {
  const userId = "test-user";

  // Clear history
  await RotationTracker.clearViewHistory(userId);

  // Test scoring
  const video = {
    id: 1,
    createdAt: new Date(),
    likesCount: 50,
    commentsCount: 10,
    viewCount: 200,
    completionRate: 0.9,
    city: "New York",
    propertyType: "Apartment"
  };

  const score = ScoringService.scoreVideo(video, {
    userCity: "New York",
    preferredPropertyTypes: ["Apartment"]
  });

  console.log("✓ Scoring works:", score.score);

  // Test tracking
  await RotationTracker.recordVideoView(userId, 1, 45, 0.95);
  const hasViewed = await RotationTracker.hasViewedVideo(userId, 1);
  console.log("✓ Tracking works:", hasViewed);

  // Test eligibility
  const eligible = await RotationTracker.isEligibleForRotation(userId, 1);
  console.log("✓ Eligibility check works:", eligible === false); // Just viewed, not eligible
}

// Run test
testRotationSystem().catch(console.error);
```

## 📈 Monitoring Metrics

After implementation, track these in your analytics:

### 1. Repeat Rate

```
metric: % of first-page videos already seen
target: < 10%
how: (views_already_seen / views_total) * 100
```

### 2. Diversity Score

```
metric: avg similarity between consecutive videos
target: < 0.4
how: calculate similarity for each pair, average
```

### 3. Cycle Completion

```
metric: % of catalog user has seen
target: 80-90% before reset
how: (unique_videos_viewed / total_videos) * 100
```

### 4. Engagement

```
metric: avg watch duration
target: > 30 seconds
how: sum(watch_duration) / count(videos_watched)
```

### 5. TTL Effectiveness

```
metric: % of videos hitting 24h+ age before re-showing
target: > 95%
how: count(reshow_events) / count(total_showings)
```

## 🐛 Troubleshooting

### Issue: "Videos still repeating"

**Debug:**

1. Check recordVideoView is being called
2. Verify AsyncStorage is working: `adb shell getprop ro.secure` (Android)
3. Check TTL values: should be 24 hours default
4. Verify seenPenalty weight > 0.1

**Fix:**

```typescript
// Add debugging
console.log("[DEBUG] Recording view:", videoId);
const recorded = await RotationTracker.hasViewedVideo(userId, videoId);
console.log("[DEBUG] View recorded?", recorded);
```

### Issue: "Not enough diversity"

**Debug:**

1. Check similarity calculation
2. Verify diversity penalties are applied
3. Check if similarityThreshold too high

**Fix:**

```typescript
// Lower threshold for stricter diversity
const diversified = DiversityService.diversifyVideoList(videos, "both", {
  similarityThreshold: 0.4, // was 0.6, now stricter
  similarityPenalty: 0.5 // was 0.7, stronger penalty
});
```

### Issue: "Performance issues"

**Debug:**

1. Profile scoring time: `console.time("scoring"); scoreVideos(); console.timeEnd("scoring");`
2. Check if generating permutation is slow
3. Verify similarity calculations not excessive

**Fix:**

```typescript
// Optimize: reduce diversity lookback
const diversified = DiversityService.rerankForDiversity(
  videos,
  2 // was 3, now only look back 2 items
);

// Or: sample diversity checks if many videos
if (videos.length > 100) {
  // Only apply diversity to top 50
  const top50 = videos.slice(0, 50);
  const diversified = DiversityService.diversifyVideoList(top50);
  return [...diversified, ...videos.slice(50)];
}
```

## 📚 Full Documentation

See `VIDEO_ROTATION_GUIDE.md` for:

- Complete architecture details
- All configuration options
- Backend integration (Go)
- Performance characteristics
- Advanced optimization

## 🎓 Learning Resources

1. **Understanding the Algorithm** (30 min read)
   - Open `VIDEO_ROTATION_GUIDE.md`
   - Read "Architecture" + "Core Services" sections

2. **Implementation** (1-2 hours)
   - Follow "Quick Start" above
   - Copy services into your project
   - Run tests to verify

3. **Backend Integration** (2-3 hours)
   - Read `VIDEO_SCORING_BACKEND_INTEGRATION.go`
   - Port logic to your Go code
   - Test with API calls

4. **Tuning** (1+ hours)
   - Adjust weights for your content strategy
   - Monitor metrics
   - Iterate based on user engagement

## ✨ Key Insights

**Why This Works:**

1. **Freshness (35%)**: New listings get visibility without relying on engagement
2. **Engagement (25%)**: Popular content (quality signal) rises naturally
3. **Relevance (25%)**: Users see personalized matches
4. **Seen Penalty (15%)**: Recent repeats vanish, older content recycled
5. **Diversity**: Avoids monotony ("all 2BR apartments in Manhattan")
6. **Rotation**: Ensures complete catalog coverage

**Zillow's Advantage:**

- They use similar algorithms to show new listings quickly
- But also balance with popularity (homes that sell fast rank higher)
- Diversity prevents showing same neighborhood repeatedly
- Users stay engaged longer (more listings explored per session)

**Your Implementation:**

- Same principles, customized for your catalog
- Tune weights based on YOUR content and business goals
- Monitor metrics to find optimal configuration
- Iterate weekly based on user behavior

## 🚢 Deployment Checklist

- [ ] Copy 4 service files to `/services`
- [ ] Install tests: `npm test -- videoRotation.test.ts`
- [ ] All tests passing? ✓
- [ ] Import services in your feed hook
- [ ] Add scoring to queryFn
- [ ] Add view tracking to video completion handler
- [ ] Configure weights (start with "Balanced" preset)
- [ ] Deploy to staging
- [ ] Test with real data for 24+ hours
- [ ] Monitor repeat rate: is it < 10%? ✓
- [ ] Monitor diversity: avg similarity < 0.4? ✓
- [ ] Check performance: scoring < 100ms? ✓
- [ ] Deploy to production
- [ ] Monitor for 1 week
- [ ] Celebrate! 🎉

---

**Questions?** Check VIDEO_ROTATION_GUIDE.md or the inline code comments!
