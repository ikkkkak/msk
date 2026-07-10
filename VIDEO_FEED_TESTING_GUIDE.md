# TESTING GUIDE - Video Feed System

## 🧪 TEST PROCEDURE

### Test 1: Shuffle Randomization

**Goal:** Verify videos appear in different order each refresh

```
1. Open app
2. Note the first video ID (e.g., ID=37)
3. Pull down to refresh feed
4. Check if first video ID changed (e.g., ID=40)
5. Repeat 5 times
```

**Expected:** Different first video IDs on each refresh
**Console logs:**

```
[SHUFFLE] ✅ Reordered 7/10 videos
[SHUFFLE] First 5 AFTER shuffle: 37, 40, 25, 18, 33
```

---

### Test 2: No Black Screens

**Goal:** Verify videos load without black placeholders

```
1. Open app - First video should play instantly
2. Scroll down slowly - watch each video
3. Scroll fast - should still load smoothly
4. Scroll back up - videos should appear instantly
```

**Expected:**

- ✓ Thumbnail fades when video ready
- ✓ No 2+ second black screens
- ✓ Smooth scrolling at 60fps

**Console logs:**

```
[PRELOAD] Current: 0, Preloading indices: 0,1,2,3
[VideoFeed] Backend returned 10 videos
📊 [VIDEO 0] videoReady=true, isLoading=false, paused=false
```

---

### Test 3: Memory Efficiency

**Goal:** Verify memory stays stable after long scrolls

```
1. Open React DevTools (if web) or Android/iOS profiler
2. Scroll down 20+ times
3. Monitor memory usage
4. Scroll back up
5. Check memory hasn't increased excessively
```

**Expected:**

- Memory rises initially (preloading current +3 videos)
- Stabilizes after 5-10 scrolls
- Doesn't exceed 300MB
- Decreases when scrolling back to start

**Console logs:**

```
[TwoLayerCache] Added to memory: Video 37 (2048KB). Total: 4096MB
[TwoLayerCache] Memory optimization: Removed 3 videos
```

---

### Test 4: Scroll-Back Instant Playback

**Goal:** Verify videos cached and replay instantly

```
1. Open app and watch video 1
2. Scroll down to video 5
3. Scroll back to video 1
4. Note if it plays instantly
```

**Expected:**

- ✓ Video 1 plays immediately (no buffering)
- ✓ No re-download from server
- ✓ No black screen

**Console logs:**

```
[TwoLayerCache] Retrieved from disk: Video 1
```

---

### Test 5: Video Switching Responsiveness

**Goal:** Verify no audio overlap or delayed playback

```
1. Play video 1 with volume on
2. Scroll quickly to video 2
3. Watch for:
   - Audio from video 1 should stop immediately
   - Video 2 audio should start cleanly
   - No overlapping audio
```

**Expected:**

- ✓ Instant audio cutoff
- ✓ Clean transition
- ✓ No lag or stutter

---

### Test 6: Preloading Verification

**Goal:** Confirm preloading ahead of view

```
1. Open DevTools Console
2. Look for [PRELOAD] logs
3. At index 5, should see: "Preloading indices: 5,6,7,8,4"
4. Scroll to index 6, should see: "Preloading indices: 6,7,8,9,5"
```

**Expected:**

- Current index always in preload list
- Next 3 always preloading
- Previous 1 always preloading

---

## 📊 PERFORMANCE METRICS TO MONITOR

### CPU Usage

- **Idle:** <5%
- **Scrolling:** <30%
- **Video playing:** <20%

### Memory Usage

- **Initial:** ~100MB
- **After 10 scrolls:** ~180MB
- **After 30 scrolls:** ~200MB (stabilized)

### Frame Rate

- **Scrolling:** 55-60 FPS (target)
- **Playing:** 55-60 FPS (target)

### Network

- **Initial load:** ~5 API calls
- **Per scroll:** 0-1 additional calls (load-more)

---

## ❌ FAILURE INDICATORS (Must Not Happen)

| Issue                         | Check For                       |
| ----------------------------- | ------------------------------- |
| Black screens persist         | Preload logs missing            |
| Same video always first       | Shuffle not using Math.random() |
| Audio overlaps                | Volume not muting correctly     |
| Memory crash after 50 scrolls | Unload not running              |
| 5+ second load times          | drawDistance too small          |
| Scroll janky                  | FPS dropping below 30           |

---

## 🔍 DEBUG CHECKLIST

### If Videos Show Black

1. ✓ Check `drawDistance={PAGE_HEIGHT * 3}` is set
2. ✓ Verify `removeClippedSubviews={false}`
3. ✓ Check console for `[PRELOAD]` logs
4. ✓ Verify `onViewableItemsChanged` fires
5. ✓ Check `videoReady[ID]` state

### If Shuffle Doesn't Randomize

1. ✓ Verify using `Math.random()` not seeded RNG
2. ✓ Check console: `[SHUFFLE] Reordered X/10`
3. ✓ Confirm X varies between refreshes
4. ✓ Check no hourly seed constraint

### If Memory Grows Unbounded

1. ✓ Check memory optimization `useEffect` runs
2. ✓ Verify `unloadAsync()` is called
3. ✓ Monitor `maxDistance` (should be 5)
4. ✓ Check unload logs in console

---

## 🎬 LIVE TESTING STEPS

```bash
# 1. Start Expo
npm start

# 2. Clear cache before test
expo clear

# 3. Open DevTools Console
Ctrl+Shift+I (or Cmd+Option+I on Mac)

# 4. Filter logs to show shuffle/preload
Search: [SHUFFLE] or [PRELOAD]

# 5. Run tests
- Refresh app multiple times
- Note first video IDs
- Scroll slowly, then fast
- Watch console logs
```

---

## ✅ SUCCESS CRITERIA

### Shuffle Fix

- [ ] First video ID changes on each refresh
- [ ] No hourly constraint visible in logs
- [ ] Console shows varying reorder counts

### Performance Fix

- [ ] No black screens on fast scroll
- [ ] Video loads within 500ms
- [ ] Scroll-back instant (<100ms)

### Memory Fix

- [ ] Memory stabilizes after initial preload
- [ ] No crash after 50+ scrolls
- [ ] Unload logs appear periodically

### Complete Success

- [ ] All 6 tests pass
- [ ] No black screens
- [ ] Memory stable
- [ ] 60fps scroll
- [ ] Audio clean
- [ ] TikTok-like experience
