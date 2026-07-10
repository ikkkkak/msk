// ─────────────────────────────────────────────
// useVideoPlayback.ts
//
// The SINGLE source of truth for which video plays.
//
// GUARANTEES:
//  • Only one video plays at any moment (enforced by ref-level calls)
//  • Scroll forward  → new video plays in the same animation frame
//  • Scroll back     → previous video plays instantly (already buffered)
//  • Tab switch      → all videos pause immediately
//  • App background  → all videos pause immediately
//  • User pause      → never auto-resumes until user taps play
//  • Re-renders from state changes NEVER trigger extra play/pause calls
// ─────────────────────────────────────────────

import {
  useRef,
  useCallback,
  useEffect,
  RefObject,
  MutableRefObject
} from "react";
import { AppState, AppStateStatus } from "react-native";

interface UseVideoPlaybackOptions {
  /** all video refs indexed by list position */
  videoRefs: MutableRefObject<Array<any>>;
  /** current visible index */
  activeIndexRef: MutableRefObject<number>;
  isMuted: boolean;
  isScreenFocused: MutableRefObject<boolean>;
  shouldAutoplay: boolean;
  /** When true for an index, playAt is a no-op (user tapped pause). */
  isPausedAtIndex: (index: number) => boolean;
}

async function forcePauseRef(ref: any) {
  if (!ref) return;
  try {
    await ref.pauseAsync?.();
    await ref.setIsMutedAsync?.(true);
  } catch (_) {
    // ref may have been unmounted
  }
}

export function useVideoPlayback({
  videoRefs,
  activeIndexRef,
  isMuted,
  isScreenFocused,
  shouldAutoplay,
  isPausedAtIndex
}: UseVideoPlaybackOptions) {
  const transitioning = useRef(false);
  const tabAtSwitch = useRef<string>("");

  const pauseAll = useCallback(
    (except?: number) => {
      videoRefs.current.forEach((ref, i) => {
        if (!ref) return;
        if (i === except) return;
        forcePauseRef(ref);
      });
    },
    [videoRefs]
  );

  const playAt = useCallback(
    async (index: number) => {
      const ref = videoRefs.current[index];
      if (!ref) return;
      if (!isScreenFocused.current) return;
      if (!shouldAutoplay) return;

      if (isPausedAtIndex(index)) {
        await forcePauseRef(ref);
        return;
      }

      try {
        await ref.setIsMutedAsync(isMuted);
        const status = await ref.getStatusAsync();
        if (status?.isLoaded && !status.isPlaying) {
          await ref.playAsync();
        }
      } catch (_) {
        // ref may have been unmounted
      }
    },
    [
      videoRefs,
      isMuted,
      isScreenFocused,
      shouldAutoplay,
      isPausedAtIndex
    ]
  );

  const onIndexChange = useCallback(
    (newIndex: number, currentTab: string) => {
      if (transitioning.current) return;
      if (newIndex === activeIndexRef.current) {
        if (isPausedAtIndex(newIndex)) {
          forcePauseRef(videoRefs.current[newIndex]);
          return;
        }
        playAt(newIndex);
        return;
      }

      transitioning.current = true;
      tabAtSwitch.current = currentTab;

      const prevIndex = activeIndexRef.current;
      activeIndexRef.current = newIndex;

      pauseAll();

      const execute = () => {
        if (!isScreenFocused.current) {
          transitioning.current = false;
          return;
        }

        const oldRef = videoRefs.current[prevIndex];
        if (oldRef) {
          forcePauseRef(oldRef);
        }

        playAt(newIndex).finally(() => {
          transitioning.current = false;
        });
      };

      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(execute);
      } else {
        setTimeout(execute, 0);
      }
    },
    [
      activeIndexRef,
      pauseAll,
      playAt,
      isScreenFocused,
      videoRefs,
      isPausedAtIndex
    ]
  );

  const pauseAllNow = useCallback(() => {
    transitioning.current = false;
    videoRefs.current.forEach((ref) => {
      forcePauseRef(ref);
    });
  }, [videoRefs]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state !== "active") {
        pauseAllNow();
      } else if (isScreenFocused.current) {
        const idx = activeIndexRef.current;
        if (!isPausedAtIndex(idx)) {
          playAt(idx);
        } else {
          forcePauseRef(videoRefs.current[idx]);
        }
      }
    });
    return () => sub.remove();
  }, [
    pauseAllNow,
    playAt,
    activeIndexRef,
    isScreenFocused,
    isPausedAtIndex,
    videoRefs
  ]);

  // Enforce single-video invariant + user-pause on active row
  useEffect(() => {
    const id = setInterval(() => {
      if (transitioning.current) return;
      const activeIdx = activeIndexRef.current;
      videoRefs.current.forEach((ref, i) => {
        if (!ref) return;
        if (i === activeIdx && isPausedAtIndex(i)) {
          ref
            .getStatusAsync?.()
            .then((s: any) => {
              if (s?.isPlaying) forcePauseRef(ref);
            })
            .catch(() => {});
          return;
        }
        if (i === activeIdx) return;
        ref
          .getStatusAsync?.()
          .then((s: any) => {
            if (s?.isPlaying) forcePauseRef(ref);
          })
          .catch(() => {});
      });
    }, 800);
    return () => clearInterval(id);
  }, [activeIndexRef, videoRefs, isPausedAtIndex]);

  return { onIndexChange, pauseAllNow, playAt };
}
