# 📊 ARCHITECTURE DIAGRAM - TikTok-Level Video Feed

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VIDEO FEED SCREEN (React)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      FLASHLIST                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ VIDEO CARD 0 (Visible)                             │ │  │
│  │  │ ├─ Thumbnail loaded ✓                              │ │  │
│  │  │ ├─ Video playing ✓                                 │ │  │
│  │  │ └─ Audio ON                                        │ │  │
│  │  ├─────────────────────────────────────────────────────┤ │  │
│  │  │ VIDEO CARD 1 (Pre-loading)                         │ │  │
│  │  │ ├─ Thumbnail visible                               │ │  │
│  │  │ ├─ Video buffering...                              │ │  │
│  │  │ └─ Audio OFF (muted)                               │ │  │
│  │  ├─────────────────────────────────────────────────────┤ │  │
│  │  │ VIDEO CARD 2 (Pre-loading)                         │ │  │
│  │  │ └─ Warmup in progress...                           │ │  │
│  │  ├─────────────────────────────────────────────────────┤ │  │
│  │  │ VIDEO CARD 3 (Queued)                              │ │  │
│  │  │ └─ Ready to preload when time comes...             │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                    (More videos below)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
       │
       ├─ onViewableItemsChanged()
       │  └─ Determines which video should play
       │
       └─ preloadUpcomingVideos()
          └─ Starts buffering next 3 videos
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     Backend Server                              │
│                 (Returns 10 videos at once)                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   videoFeedFetcher.ts                  │
        ├────────────────────────────────────────┤
        │ 1. Fetch 10 videos from API            │
        │ 2. Score videos (freshness, engagement)│
        │ 3. Apply diversity filtering           │
        │ 4. SHUFFLE with Math.random()  ← FIX   │
        │ 5. Return shuffled array               │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │   VideoFeedScreen.tsx                  │
        ├────────────────────────────────────────┤
        │ 1. Receive shuffled videos             │
        │ 2. Store in accumulatedVideos[]        │
        │ 3. Pass to FlashList                   │
        │ 4. Trigger preloadUpcomingVideos()     │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │   Preload Service                      │
        ├────────────────────────────────────────┤
        │ Register refs for indices:             │
        │ • Current (always)                     │
        │ • Next 3 (aggressive)                  │
        │ • Previous 1 (scroll-back)             │
        │                                        │
        │ Warm buffer by calling:                │
        │ videoRef.getStatusAsync()              │
        └────────────┬─────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌─────────┐   ┌──────────────┐  ┌──────────────┐
│ Memory  │   │ Two-Layer    │  │ Two-Layer    │
│ Cache   │   │ Cache        │  │ Cache        │
│ 100MB   │   │ Memory Layer │  │ Disk Layer   │
│ Fast    │   │ 100MB        │  │ 500MB        │
│         │   │              │  │ Persistent   │
└─────────┘   └──────────────┘  └──────────────┘
    │                │                │
    └────────────────┼────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │   Video Components Render              │
        ├────────────────────────────────────────┤
        │ For each visible video:                │
        │ 1. Show thumbnail (instant)            │
        │ 2. Fade to video (on ready)            │
        │ 3. Play audio                          │
        │ 4. Loop video                          │
        └────────────────────────────────────────┘
```

---

## Memory Management Lifecycle

```
TIME ──────────────────────────────────────────────────────────>

Index 0  ✅ Loaded  ──────────────────┐
                                      │ Unload when
Index 1  ✅ Loaded  ──────────────────┤ distance > 5
                                      │
Index 2  ✅ Loaded  ──────────────────┘

Index 3  [Current]  🔴 Active playback
         RAM: 50MB

Index 4  ✅ Preloading
Index 5  ✅ Preloading
Index 6  ✅ Preloading (warmup)

Index 7  ⏳ Queued (will preload next)

Index 8+ ❌ Not in memory


Memory Timeline:
──────────────────────────────────────────────────
Time     Memory Usage    Activity
──────────────────────────────────────────────────
0s       50MB           Load current + next 3
3s       80MB           All preloading active
5s       100MB          Peak (all buffers full)
6s       80MB            ← Scroll to index 4
10s      80MB           Stabilized
15s      80MB           Cleanup ran, unloaded index 0
20s      80MB           Steady state
──────────────────────────────────────────────────
```

---

## Shuffle Algorithm Evolution

### ❌ BEFORE (Deterministic - BROKEN)

```typescript
const seed = `${deviceId}-${Math.floor(Date.now() / 3600000)}`;
// Same hour → Same seed → Same shuffle order
// 10:00 AM: Seed = "device-442208"
// 10:30 AM: Seed = "device-442208" ← SAME!
// Result: Same video order all morning 😞
```

### ✅ AFTER (Randomized - FIXED)

```typescript
// Each call gets different random sequence
Math.random() * (i + 1); // Different each time
// 10:00 AM: Random sequence A → Order [37,40,25,18,33]
// 10:01 AM: Random sequence B → Order [40,25,37,33,18] ✓
// 10:02 AM: Random sequence C → Order [25,37,40,18,33] ✓
// Result: Different order every refresh 🎉
```

---

## Performance Timeline - Fast Scroll

```
User Scroll Action: SWIPE DOWN
───────────────────────────────

t=0ms    User swipes
         └─ FlatList snap triggered

t=50ms   onViewableItemsChanged fires
         ├─ Pause current video (index 3)
         ├─ Play next video (index 4)
         └─ Call preloadUpcomingVideos(4)

t=50-100ms  Video 4 plays
            ├─ Thumbnail already visible ✓
            ├─ Video buffer warm ✓
            └─ Starts playing instantly ✓

t=150ms  Preload service registers:
         ├─ Video 5 (next)
         ├─ Video 6 (next+1)
         ├─ Video 7 (next+2)
         └─ Video 3 (previous)

t=200ms  All videos in preload view

Result: No loading delay ✓ No black screen ✓
```

---

## Console Log Flow During Typical Use

```
🚀 APP START
│
├─ [VideoFeed] Fetching rent - user=anonymous, device=80C90D17
│
├─ [VideoFeed] Backend returned 10 videos from /video/feed
│
├─ [SHUFFLE-DEBUG] Input: 10 videos, ready to randomize
│
├─ [SHUFFLE] ✅ Reordered 7/10 videos
│
├─ [SHUFFLE] First 5 AFTER shuffle: 37, 40, 25, 18, 33
│
├─ [PRELOAD] Current: 0, Preloading indices: 0,1,2,3
│
├─ [TwoLayerCache] Added to memory: Video 37 (2048KB). Total: 4096MB
│
└─ 📊 [VIDEO 0] videoReady=true, isLoading=false, paused=false


👆 USER SCROLLS DOWN
│
├─ [PRELOAD] Current: 1, Preloading indices: 1,2,3,4,0
│
├─ [TwoLayerCache] Added to memory: Video 40 (2048KB)
│
├─ [TwoLayerCache] Added to disk: Video 25 (2048KB)
│
└─ 📊 [VIDEO 1] videoReady=true, isLoading=false, paused=false


👆 USER SCROLLS DOWN (Fast)
│
├─ [PRELOAD] Current: 2, Preloading indices: 2,3,4,5,1
│
└─ Video plays instantly (preloaded) ✓


👆 USER SCROLLS BACK UP
│
├─ [TwoLayerCache] Retrieved from disk: Video 37
│
├─ [PRELOAD] Current: 0, Preloading indices: 0,1,2,3
│
└─ 🎬 Video 37 plays instantly from cache ✓
```

---

## State Management Flow

```
┌─────────────────────────────────────┐
│        VideoFeedScreen State        │
├─────────────────────────────────────┤
│ currentIndex: number                │  ← Updated by viewability
│ activeTab: "rent" | "sale" | ...    │  ← User clicks tab
│ paused: Record<number, boolean>     │  ← Play/pause per video
│ muted: boolean                      │  ← Audio toggle
│ videoReady: Record<number, boolean> │  ← When video loaded
│ videoLoading: Record<number, bool>  │  ← Loading state
└─────────────────────────────────────┘
         ▲                    │
         │                    ▼
    ┌────┴──────────────┬──────────────┐
    │                   │              │
    │            onViewableItemsChanged setVideoReady
    │                   │              │
    │       Updates currentIndex   Triggered by:
    │       Triggers preload       - onLoad()
    │       Manages playback       - onReadyForDisplay()
    │                              - setTimeout()
```

---

## Component Hierarchy

```
VideoFeedScreen
├─ FlashList
│  └─ renderItem({ item, index })
│     └─ TouchableOpacity
│        ├─ Animated.View (thumbnail)
│        │  └─ Image (blurred, faded out when ready)
│        │
│        ├─ Animated.View (video container)
│        │  └─ Video (plays on demand)
│        │
│        └─ (UI Buttons)
│           ├─ Like button
│           ├─ Comment button
│           ├─ Share button
│           └─ More options
│
├─ Memory Optimization useEffect
│  └─ Unloads distant videos every 3 scrolls
│
└─ Preload Service
   └─ Manages video refs
      └─ Calls getStatusAsync() to warm buffer
```

---

## Error Handling & Fallbacks

```
VIDEO LOAD FAILURE?
│
├─ Error caught
│
├─ Keep thumbnail visible
│
├─ Log error to console: [VideoCard] Video error for ...
│
├─ Retry on next visibility change
│
└─ Never crash app


MEMORY LIMIT EXCEEDED?
│
├─ Auto-evict oldest videos
│
├─ Log: [TwoLayerCache] Evicted from memory: Video X
│
├─ Continue operation
│
└─ Graceful degradation


NETWORK TIMEOUT?
│
├─ Show placeholder
│
├─ Retry with exponential backoff
│
├─ Fall back to cached version if available
│
└─ Queue for retry when online
```

This architecture ensures **professional-grade reliability** with graceful degradation at every layer.
