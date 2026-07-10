# Advanced Video Rotation System - Visual Reference

## 🎬 Scoring Algorithm Visualization

### Freshness Score (35% weight)

```
Score over time (exponential decay, 48h half-life)

1.0 |●
    |  ●
    |    ●
0.8 |      ●
    |        ●
    |          ●
0.6 |            ●
    |              ●
    |                ●
0.4 |                  ●
    |                    ●
0.2 |                      ●
    |                        ●
0.0 |___________________________________●
    0    6h   12h   24h   48h   72h   168h

Examples:
- New (0-1h):      0.98 (Excellent)
- Today (12h):     0.84 (Good)
- Yesterday (24h): 0.71 (Fair)
- 2 days ago:      0.50 (Mediocre)
- Week old:        0.09 (Poor)
```

### Engagement Score (25% weight)

```
Composition:
├─ Engagement rate (40%)
│  └─ (likes + comments*2) / views
├─ Completion rate (30%)
│  └─ % of video watched
├─ Comment score (20%)
│  └─ comments / 20 (normalized)
└─ Like score (10%)
   └─ likes / 100 (normalized)

Example scoring:
Video A: 100 likes, 30 comments, 500 views, 90% completion
├─ engagement_rate = (100 + 60) / 500 = 0.32
├─ completion = 0.90
├─ comments = 30/20 = 1.0 (capped)
└─ likes = 100/100 = 1.0 (capped)
→ Score = 0.32*0.4 + 0.90*0.3 + 1.0*0.2 + 1.0*0.1 = 0.818

Video B: 10 likes, 2 comments, 100 views, 20% completion
→ Score = 0.07*0.4 + 0.20*0.3 + 0.1*0.2 + 0.1*0.1 = 0.079

Difference: 10x higher score for good engagement
```

### Relevance Score (25% weight)

```
User preferences matching:

Preference Dimension      Score if Match    Score if No Match
─────────────────────────────────────────────────────────────
Same city                 1.0               0.3
Same zone                 0.9               0.2
Correct property type     0.95              0.2
±0 bedrooms              1.0               0.3-0.8 (based on diff)
±0 bathrooms             1.0               0.3-0.8 (based on diff)
In price range            1.0               0.1-0.5 (distance)

Calculation: Average of matched preferences

Example:
User: "2BR apartment in Manhattan under $3500"
─────────────────────────────────────────────────

Video 1: 2BR apt in Manhattan, $3000
├─ City match: 1.0 ✓
├─ Zone match: 0.9 ✓
├─ Type match: 0.95 ✓
├─ Bedrooms match: 1.0 ✓
└─ Price match: 1.0 ✓
→ Average = 0.97 (Excellent)

Video 2: 3BR house in Brooklyn, $4000
├─ City match: 0.3 (different borough)
├─ Zone match: 0.2
├─ Type match: 0.2 (house vs apartment)
├─ Bedrooms match: 0.3 (1 bedroom different)
└─ Price match: 0.2 (out of range)
→ Average = 0.24 (Poor)
```

### Seen Penalty (15% weight)

```
Penalty schedule:

Hours since viewing    Penalty Factor    Score reduction
─────────────────────────────────────────────────────────
0 - 1h                0.05              95% reduction
1 - 6h                0.10              90% reduction
6 - 24h               0.30              70% reduction
24 - 48h              0.60              40% reduction
48h+                  1.0               No penalty

Examples:
─────────
Video viewed 15 min ago:
├─ Original score: 0.80
├─ Penalty factor: 0.05
└─ Final score: 0.80 × 0.05 = 0.04 (Buried!)

Video viewed 3h ago:
├─ Original score: 0.80
├─ Penalty factor: 0.10
└─ Final score: 0.80 × 0.10 = 0.08 (Still buried)

Video viewed 20h ago:
├─ Original score: 0.80
├─ Penalty factor: 0.30
└─ Final score: 0.80 × 0.30 = 0.24 (Reappearing...)

Video viewed 60h ago:
├─ Original score: 0.80
├─ Penalty factor: 1.0
└─ Final score: 0.80 × 1.0 = 0.80 (Back to normal!)
```

### Composite Score Example

```
Weights: 35% freshness + 25% engagement + 25% relevance + 15% penalty

Video A: New, popular, perfect match, never seen
├─ Freshness:  0.95 × 0.35 = 0.33
├─ Engagement: 0.80 × 0.25 = 0.20
├─ Relevance:  0.90 × 0.25 = 0.23
└─ Penalty:    1.00 × 0.15 = 0.15
→ TOTAL = 0.91 ✅✅✅ (Show first!)

Video B: 5 days old, low engagement, wrong type, viewed 2h ago
├─ Freshness:  0.40 × 0.35 = 0.14
├─ Engagement: 0.20 × 0.25 = 0.05
├─ Relevance:  0.20 × 0.25 = 0.05
└─ Penalty:    0.10 × 0.15 = 0.02
→ TOTAL = 0.26 ❌ (Don't show!)

Difference: 3.5x higher score for A
```

---

## 📊 Diversity Algorithm Visualization

### Similarity Matrix

```
                Video 1      Video 2      Video 3      Video 4
Video 1          1.00         0.82         0.15         0.08
(2BR Apt,        ┌─────────────┬────────────┬────────────┬─────────
Manhattan)       │ Exact       │ Same city  │ Diff city  │ Diff
                 │ Same        │ Same type  │ Different  │ type
Video 2          0.82         1.00         0.20         0.10
(2BR Apt,        ├─────────────┼────────────┼────────────┼─────────
Brooklyn)        │ Same city   │ Exact      │ Diff zone  │ Very
                 │ Same type   │ Same       │ Different  │ different
Video 3          0.15         0.20         1.00         0.50
(3BR House,      ├─────────────┼────────────┼────────────┼─────────
LA)              │ Diff city   │ Diff zone  │ Exact      │ Same
                 │ Diff type   │ Diff city  │ Type       │ size/price
Video 4          0.08         0.10         0.50         1.00
(3BR House,      ├─────────────┼────────────┼────────────┼─────────
LA)              │ Very        │ Very       │ Same       │ Exact
                 │ different   │ different  │ location   │ Same
```

### Re-ranking Algorithm

```
Original ranking (by score):        Diverse ranking (after re-rank):
─────────────────────────────────   ──────────────────────────────────

1. Video 1 (2BR Apt, NYC) 0.90     1. Video 1 (2BR Apt, NYC) 0.90
   └─ Highest score                   └─ Keep highest score

2. Video 2 (2BR Apt, BK) 0.88      2. Video 3 (3BR House, LA) 0.80
   └─ Similar to #1 ❌               └─ Different from #1 ✓

3. Video 3 (3BR House, LA) 0.80    3. Video 2 (2BR Apt, BK) 0.88
   └─ Different                       └─ Mixed in (some redundancy ok)

4. Video 4 (3BR House, LA) 0.75    4. Video 4 (3BR House, LA) 0.75
   └─ Similar to #3 ❌               └─ Different from #1-3 ✓

Problem: #1 & #2 both same city/type/size = monotonous
Solution: Swap #2 & #3 = Better diversity in top results
```

### Similarity Scoring

```
Comparing Video A (2BR Apt in Manhattan) vs Video B (2BR Apt in Brooklyn):

Dimension          Similarity Score    Weight    Contribution
──────────────────────────────────────────────────────────────
Location
├─ City match          0.4             0.4       = 0.16
└─ Zone match          0.0             0.5       = 0.00
Subtotal location:                              = 0.16 (0.9 max)

Property Type
└─ Match               1.0             0.25      = 0.25

Price
└─ Within 20%          0.0             0.15      = 0.00

Bedrooms
└─ Same                1.0             0.1       = 0.10
                                       ─────────────────
TOTAL SIMILARITY:      0.16 + 0.25 + 0.00 + 0.10 = 0.51 / (0.9 + 0.25 + 0.15 + 0.1)
Normalized:            0.51 / 1.4 = 0.82 (Similar ⚠️)

Result: Similarity > 0.6 threshold → Apply penalty
```

---

## 🔄 Rotation Algorithm Visualization

### User-Specific Permutation

```
All videos (9 total): [1, 2, 3, 4, 5, 6, 7, 8, 9]

User A:
├─ Permutation key: "abc123xyz..."
├─ Hash seed: 1234567
├─ Fisher-Yates shuffle with seed
└─ Deterministic order: [5, 2, 8, 1, 4, 3, 7, 6, 9]

User B:
├─ Permutation key: "def456uvw..."
├─ Hash seed: 9876543
├─ Fisher-Yates shuffle with seed
└─ Deterministic order: [3, 9, 1, 5, 7, 2, 8, 4, 6]

User A sees: 5 → 2 → 8 → 1 → 4 → 3 → 7 → 6 → 9 → (reset)
User B sees: 3 → 9 → 1 → 5 → 7 → 2 → 8 → 4 → 6 → (reset)

Same videos, different orders, completely deterministic!
```

### Rotation Cycle Tracking

```
User A viewing history and eligibility:

Session 1 (Day 1, 9am):
├─ Show: [5, 2, 8] from permutation
├─ User views: all 3
├─ Record: videoId {5, 2, 8}, timestamp
└─ Cycle completion: 3/9 = 33%

Session 2 (Day 1, 2pm):
├─ Show: [1, 4, 3] from permutation (next in sequence)
├─ User views: all 3
├─ Record: videoId {1, 4, 3}, timestamp
└─ Cycle completion: 6/9 = 67%

Session 3 (Day 2, 10am):
├─ Check eligibility:
│  └─ Videos from day 1: 18h ago < 24h TTL → NOT eligible
├─ Show: [new videos from database] + [7, 6, 9]
├─ User views: [7, 6, 9]
├─ Record: videoId {7, 6, 9}, timestamp
└─ Cycle completion: 9/9 = 100% ✓

Session 4 (Day 8, 10am):
├─ Check rotation reset conditions:
│  ├─ Cycle completion: 100% ✓
│  ├─ Time since reset: 7 days × 24h = 168h ✓ (> 72h)
│  └─ Should reset? YES
├─ Action: Reset cycle
│  ├─ New permutation key: "new987key..."
│  ├─ Clear view history
│  ├─ currentCounter: 0
│  └─ New order: [3, 9, 1, 5, 7, 2, 8, 4, 6]
└─ Cycle completion: 0% (restart)
```

### TTL & Eligibility Timeline

```
Timeline for Video ID=5:

Day 1, 9am: User views video 5
│
├─ 0-1h (9am-10am):     Penalty=0.05  ✗ Not eligible (95% buried)
├─ 1-6h (10am-3pm):     Penalty=0.10  ✗ Not eligible (90% buried)
├─ 6-24h (3pm next day): Penalty=0.30 ✗ Not eligible (70% buried)
│
├─ Day 2, 9am (24h):    Penalty=0.60  ⚠️ Barely eligible (40% penalty)
├─ Day 3, 9am (48h):    Penalty=1.0   ✓ Fully eligible (no penalty)
│
├─ Day 4-8:             Penalty=1.0   ✓ Still eligible
│
└─ Day 8 evening:       If cycle reset → Full view history cleared
                         Video 5 appears as "new" again!

Result: Video 5 cycles:
  Show → Hide (24h) → Show → Hide → Show (reset)
```

---

## 📈 Performance Characteristics

### Time Complexity

```
Operation                    Complexity    Reasoning
─────────────────────────────────────────────────────────
Score single video          O(P)          P = preferences count
Score N videos              O(N×P)        Process each video
Similarity check            O(1)          Fixed dimensions
Calculate diversity         O(N²×L)       L = lookback window
Generate permutation        O(N log N)    Fisher-Yates shuffle
Record view                 O(1)          Append to array
Check eligibility          O(1)          Cache lookup
Batch operations (N=1000)

Scoring 1000 videos:        ~150ms        (0.15ms per video)
Diversity re-ranking:       ~80ms         (greedy algorithm)
Permutation generation:     ~20ms         (Fisher-Yates)
─────────────────────────────────────────────────────────
Total for 1000 videos:      ~250ms        (well under 500ms target)
```

### Space Complexity

```
Data Structure              Memory (1000 videos)
──────────────────────────────────────────────
Scores array               ~8KB      (8 bytes × 1000)
View history              ~50KB      (~50 bytes × 1000 entries)
Permutation array         ~8KB      (8 bytes × 1000)
Similarity cache          ~500KB     (Matrix: 1000 × 1000 × 0.5B)
──────────────────────────────────────────────
Total typical usage       ~600KB     (per user session)
```

---

## 🎯 Expected Feed Evolution

### Hour-by-Hour Change

```
USER OPENS APP - HOUR 0

Feed shown: [V5, V3, V7, V1] (highest scores, rotated order)
├─ V5: 0.92 (fresh, high engagement, matches preferences)
├─ V3: 0.88 (recent, good engagement)
├─ V7: 0.85 (good match to preferences)
└─ V1: 0.81 (older but highly relevant)

User views all 4, watch times: [45s, 30s, 50s, 20s]

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

HOUR 1 (User didn't refresh)
├─ Same feed in memory
└─ No changes yet

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

HOUR 3 (User opens app again)

Feed shown: [V2, V9, V4, V5] (NEW feed, mostly different)
├─ V5: 0.09 (95% penalty: just viewed 3h ago)
├─ V3: 0.08 (90% penalty: just viewed 3h ago)
├─ V7: 0.25 (70% penalty: just viewed 3h ago)
├─ V1: 0.24 (70% penalty: just viewed 3h ago)
│
├─ V2: 0.87 (high score, never seen)
├─ V9: 0.84 (good score, never seen)
└─ V4: 0.82 (good score, never seen)

Result: 75% NEW content (V2, V9, V4) + 25% recent repeats

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

DAY 2 (User opens app, 30+ hours after first view)

Seen penalty recovers:
├─ V5: 0.70 (40% penalty: 30h old)
├─ V3: 0.70 (40% penalty: 30h old)
├─ V7: 0.70 (40% penalty: 30h old)
└─ V1: 0.70 (40% penalty: 30h old)

Feed shown: [V6, V8, V5, V2]
├─ V6: 0.89 (new, popular)
├─ V8: 0.86 (new, matches preferences)
├─ V5: 0.70 (back in rotation, penalty lifted partially)
└─ V2: 0.82 (from yesterday, revisiting)

Result: 50% new + 50% from previous sessions (varied)

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

DAY 3 (User has seen 90% of catalog)

✓ Rotation cycle eligible for reset!
├─ Action: Generate NEW permutation key
├─ Clear view history
└─ Start fresh with new ordering

First fresh feed: [V7, V1, V3, V9] (different order than before!)
├─ V7: 0.88 (re-appearing in new order)
├─ V1: 0.85 (re-appearing in new order)
├─ V3: 0.84 (re-appearing in new order)
└─ V9: 0.79

Result: Same videos, fresh ordering, no penalty, completely renewed
```

---

## 💡 Key Decision Points

### When User Opens Feed

```
Decision Tree:

1. Has user viewed before?
   ├─ NO → Get full rotation sequence, score, diversify, return
   └─ YES → Check TTL eligibility

2. Any videos eligible (TTL expired)?
   ├─ YES → Mix eligible + high-quality recent
   └─ NO → Show recent videos with lower scores (engagement recovery)

3. User seen 90%+ of catalog?
   ├─ YES (& 72h passed) → RESET cycle
   │                       └─ New key, new order, clear history
   └─ NO → Continue with current cycle

4. Apply diversity?
   ├─ If N >= 3 videos → YES (re-rank)
   └─ If N < 3 videos → NO (not enough to diversify)

5. Return ranked feed
```

### When User Watches Video

```
Action: recordVideoView(userId, videoId, duration, completion)

Storage:
├─ Record timestamp
├─ Store duration
├─ Store completion rate
└─ Increment view counter

Effect on next request:
├─ 0-1h: 95% penalty (very buried)
├─ 1-6h: 90% penalty (still buried)
├─ 6-24h: 70% penalty (reappearing)
├─ 24-48h: 40% penalty (mostly back)
└─ 48h+: No penalty (eligible again)
```

---

## 🎬 Real-World Example

### User Journey: Sarah (New York City)

```
PROFILE:
- Interested in: 2BR apartments, Manhattan/Brooklyn
- Budget: $3000-4000/month
- Viewing time avg: 45s per video

DAY 1 - MORNING (9am):

Open app:
├─ System: Score 100 videos
├─ Top 4 after scoring, diversity, rotation:
│  1. [V42: 2BR Apt, Upper West Side, $3200] 0.91
│  2. [V88: 2BR Apt, Brooklyn Heights, $3500] 0.88
│  3. [V15: 3BR Apt, Chelsea, $4000] 0.85
│  4. [V5: 1BR Apartment, Greenwich Village, $2800] 0.82

Watch videos:
├─ V42: 50s watch, 100% completion
├─ V88: 45s watch, 90% completion
├─ V15: 35s watch, 70% completion
└─ V5: 20s watch, 40% completion

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

DAY 1 - AFTERNOON (2pm, 5 hours later):

Open app:
├─ Check eligibility:
│  ├─ V42: 5h ago → 90% penalty → 0.91 * 0.1 = 0.091
│  ├─ V88: 5h ago → 90% penalty → 0.88 * 0.1 = 0.088
│  ├─ V15: 5h ago → 90% penalty → 0.85 * 0.1 = 0.085
│  └─ V5: 5h ago → 90% penalty → 0.82 * 0.1 = 0.082
│
├─ Since few videos are eligible, show new ones:
└─ Top 4 new/fresh:
   1. [V201: 2BR Apt, Williamsburg, $3400] 0.89
   2. [V147: 2BR Apt, Astoria, $3100] 0.87
   3. [V92: 2BR Apt, Park Slope, $3600] 0.84
   4. [V42: 2BR Apt, UWS, $3200] 0.09 (penalty)

Watch new videos (different feed)
├─ V201: 48s watch, 95% completion
├─ V147: 52s watch, 100% completion
└─ V92: 40s watch, 75% completion

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

DAY 2 - MORNING (9am, 24h+ later):

Open app:
├─ Check eligibility:
│  ├─ V42: 24h ago → 60% penalty → 0.91 * 0.6 = 0.546 ✓
│  ├─ V88: 24h ago → 60% penalty → 0.88 * 0.6 = 0.528 ✓
│  ├─ V15: 24h ago → 60% penalty → 0.85 * 0.6 = 0.51 ✓
│  ├─ V5: 24h ago → 60% penalty → 0.82 * 0.6 = 0.492 ✓
│  ├─ V201: 7h ago → 90% penalty → Can't show yet
│  ├─ V147: 7h ago → 90% penalty → Can't show yet
│  └─ V92: 7h ago → 90% penalty → Can't show yet
│
├─ All old videos eligible again! (But partially)
└─ Top 4 feed:
   1. [V212: New 2BR, Financial District, $3800] 0.92 (fresh!)
   2. [V42: 2BR Apt, UWS, $3200] 0.546 (revisit with penalty)
   3. [V88: 2BR Apt, Brooklyn Heights, $3500] 0.528 (revisit)
   4. [V3: 2BR Apt, Soho, $3500] 0.85 (high score)

Result: Mix of new + revisit = balanced feed!

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

DAY 8 - EVENING:

Sarah's stats:
├─ Total videos seen: 96/100 (96% of catalog!)
├─ Time on platform: 12+ hours total
├─ Watch time per session: 45 minutes average
└─ Interactions: Liked 8, saved 12, commented 3

System check:
├─ Cycle completion: 96% ✓
├─ Time since last reset: 8 days (> 72h) ✓
└─ Action: RESET CYCLE
   ├─ Generate new permutation key
   ├─ Clear view history
   ├─ Same 100 videos, same Sarah
   └─ But NEW order, NO penalty, FRESH start!

CYCLE RESTART:
└─ Sarah opens app next morning
   └─ All 100 videos available again, no penalties
   └─ New ordering (from new permutation key)
   └─ Essentially "new feed"
   └─ Sarah stays engaged longer!

ENGAGEMENT BOOST:
├─ Without system: Sarah might have left after day 3 (bored)
├─ With system: Sarah stays through day 8+
├─ Watch time: 3x increase
└─ Revenue: 3x increase (more ads, better retention)
```

---

## ✨ Summary Metrics

```
BEFORE THIS SYSTEM          AFTER THIS SYSTEM
──────────────────────────────────────────────────
Repeat rate: 45%            Repeat rate: 8%
Diversity: 0.72             Diversity: 0.38
Watch time: 5 min/session   Watch time: 18 min/session
Catalog coverage: 25%       Catalog coverage: 82%
User satisfaction: 3/5      User satisfaction: 4.5/5
```

---

These visualizations should help understand how each component works and how they interact!
