# Map Marker Tap → Card Performance Refactor

## Objective

Marker tap → bottom sheet collapse + property card visible in **<100ms** perceived latency (Airbnb-level). Previously ~1.79s.

---

## Root-Cause Analysis of the ~1.79s Delay

1. **Tap timestamp never recorded**  
   `recordMarkerTap()` was not called at the **first** moment of marker press. It lived only in commented/unused code. Elapsed-time logs were therefore wrong or measured from arbitrary points.

2. **Heavy React re-renders on tap**  
   `handlePropertySelected` did:
   - `instantCardStore.show(propertyData)` (good)
   - `sheetRef.snapToIndex(0)`
   - `mapUIState.selectMarker(...)` → React `setState`
   - `setSelectedPropertyId(...)` → another `setState`
   - `navigation.setOptions(...)` → Nav state  
   All in one tick. React batched updates, then re-rendered **SearchScreen** (huge tree: map, sheet, list, filters, etc.). The **commit** phase alone cost hundreds of ms.

3. **Card visibility gated on React state**  
   PropertyDetailCard uses `instantCardStore` + `useSyncExternalStore`, so it **can** update without SearchScreen state. But the **sheet** and **map** selection were driven by `mapUIState` / `selectedPropertyId`. Those updates forced a full SearchScreen re-render before index/collapse and selected-marker styling could update.

4. **Double card + double snap**  
   - **BaseMap** rendered its own overlay card (`cardComponent`) **and** SearchScreen rendered **PropertyDetailCard**. Two cards, redundant work.
   - Sheet snap was triggered both in `handlePropertySelected` **and** in the `useLayoutEffect` that syncs `cardVisible` → `snapToIndex(0)`. Double snap added work and potential jank.

5. **Map tree re-renders on selection**  
   `selectedPropertyId` flowed SearchScreen → MapPropertySale → PropertySaleMap → BaseMap. Any selection change re-rendered the whole map stack (including MapView) to update selected marker styling and, when used, the BaseMap overlay card.

6. **No “UI first, state second”**  
   Everything ran synchronously: store + snap + **all** React state updates. The card could only appear after the large SearchScreen commit. No decoupling of “show card + collapse sheet” from “update context + selected ID”.

---

## Refactored Event Flow

```
User taps marker (BaseMap)
    │
    ├─ recordMarkerTap()  ← FIRST: tap timestamp for all elapsed logs
    ├─ onMarkerSelect(id, idx, data)
    │       │
    │       └─ MapAdapter → MapPropertySale → handlePropertySelected
    │
    └─ Haptics + rAF(animateToRegion)  ← non-blocking

handlePropertySelected (SearchScreen):
    │
    ├─ instantCardStore.show(propertyData)     ← sync, card subscribes
    ├─ snappedForTapRef = true
    ├─ sheetRef.snapToIndex(0)                ← sync, sheet collapses
    ├─ Haptics + navigation.setOptions
    └─ requestAnimationFrame(() => {
           mapUIState.selectMarker(...)
           setSelectedPropertyId(...)
       })                                     ← deferred; next frame

Same frame:
    • PropertyDetailCard re-renders (store) → card visible
    • Sheet already collapsed (snap)
    • No SearchScreen setState yet → no heavy re-render

Next frame:
    • Deferred state updates run
    • SearchScreen re-renders; useLayoutEffect sees cardVisible
    • snappedForTapRef true → skip effect snap (already snapped)
```

**Rule:** **UI first** (store + snap + haptics), **React state second** (rAF).

---

## Code-Level Changes

### 1. **BaseMap**

- **`recordMarkerTap()`**  
  Called at the **very start** of `handleMarkerPress` (before same-target check) so all `logElapsedSinceTap` measurements are correct.

- **`useExternalCard` prop**  
  When `true`, BaseMap does **not** render the overlay card (`cardComponent`). Selection styling still uses `selectedIndex` / `selectedMarkerId`.  
  - Avoids double card.  
  - SearchScreen uses **PropertyDetailCard** only (instantCardStore).

- **Card animation effect**  
  When `useExternalCard` is true, the card show/exit effect is skipped (no `withTiming` on `cardProgress`).

### 2. **MapAdapter (PropertySaleMap)**

- **`useExternalCard`**  
  Passed through to BaseMap. When true, `cardComponent` is passed as `undefined` and `useExternalCard={true}`.

### 3. **MapPropertySale**

- **`useExternalCard`**  
  Prop passed through to PropertySaleMap. SearchScreen passes `useExternalCard` for the sell tab.

### 4. **SearchScreen**

- **`handlePropertySelected`**  
  - **Sync:** `instantCardStore.show(propertyData)`, `snappedForTapRef = true`, `sheetRef.snapToIndex(0)`, Haptics, `navigation.setOptions`.  
  - **Deferred (rAF):** `mapUIState.selectMarker(...)`, `setSelectedPropertyId(...)`.

- **`snappedForTapRef`**  
  Set true before snap. The sheet sync `useLayoutEffect` checks it when `cardVisible` becomes true; if true, it **skips** `snapToIndex(0)` and sets the ref false. Avoids double snap.

- **`useExternalCard`**  
  Passed to `MapPropertySale` for the sell tab so only PropertyDetailCard is used.

### 5. **Timing / debugging**

- **Tap:** `recordMarkerTap()` in BaseMap.  
- **Card:** `PropertyDetailCard` logs `CARD_SHOWN` + `logElapsedSinceTap` when `visible` becomes true.  
- **Handler:** In `__DEV__`, `logElapsedSinceTap("handlePropertySelected UI done")` after sync work and `"handlePropertySelected state deferred"` inside rAF.

---

## Memoization and Re-renders

- **BaseMap**: `memo`; `handleMarkerPress`, `dismissCard`, etc. are `useCallback` with correct deps.  
- **StaticCardMarker**: `memo`.  
- **MapPropertySale:**  
  - `handlePropertySelect` is `useCallback`; `properties` passed as `useMemo` by ID stability in SearchScreen.  
- **Deferred state**  
  - Card and sheet react in the **first** frame (store + snap).  
  - Map selection and `cardVisible`-based logic update on the **next** frame (rAF), so the heavy SearchScreen re-render no longer blocks “card visible + sheet collapsed”.

---

## Performance Targets

| Metric                         | Target   | How we get there                                      |
|--------------------------------|----------|--------------------------------------------------------|
| Marker press → UI feedback     | <100ms   | Store + snap + Haptics sync; no state-driven commit first |
| Card visible                   | Same frame | `instantCardStore` + `useSyncExternalStore`           |
| Sheet collapsed                | Same frame | `snapToIndex(0)` before any setState                  |
| Full transition complete       | <250ms   | One rAF for state; minimal extra work                 |

---

## Final Architecture (Summary)

- **Single source of truth for “card visible” on tap:** `instantCardStore`. PropertyDetailCard subscribes; no need to wait for `mapUIState` or `selectedPropertyId` to show the card.
- **Sheet:** Collapse via **imperative** `snapToIndex(0)` on tap. Sync effect snap is **skipped** when `snappedForTapRef` is true.
- **Map selection:** Still from `selectedPropertyId` / `mapUIState`, but updated in **rAF** after store + snap. Selection styling is one frame behind; visually negligible.
- **BaseMap:** Stays reusable. `useExternalCard` lets SearchScreen use only the external card and avoid duplicate overlay + animation work.
- **Marker tap:** UI reaction first (store + sheet + Haptics), data/state reconciliation second (deferred `mapUIState` + `setSelectedPropertyId`).

---

## How to Verify

1. Enable `__DEV__` and watch `[MARKER_DEBUG]` logs.  
2. `recordMarkerTap` at tap; `handlePropertySelected UI done` should be **&lt;100ms** from tap.  
3. `CARD_SHOWN` in PropertyDetailCard should occur in the **same** frame as the sync handler work.  
4. `handlePropertySelected state deferred` logs in the **next** frame (rAF).

Run on a real device; simulator can hide JS/main-thread cost.
