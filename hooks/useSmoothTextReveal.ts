import { useCallback, useEffect, useRef, useState } from "react";

const CHARS_PER_SEC = 520;
const WORDS_PER_SEC_RTL = 14;

function isRTLText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

function splitRTLUnits(text: string): string[] {
  const units: string[] = [];
  const re = /\S+\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    units.push(m[0]);
  }
  return units;
}

export type SmoothTextReveal = {
  visibleText: string;
  complete: boolean;
  skip: () => void;
};

/**
 * ChatGPT-style smooth reveal: rAF-batched for EN/FR, word-chunked for RTL scripts.
 * Tap anywhere on the message to skip via `skip()`.
 */
export function useSmoothTextReveal(
  fullText: string,
  enabled: boolean,
): SmoothTextReveal {
  const [visibleText, setVisibleText] = useState(() =>
    enabled ? "" : fullText,
  );
  const [complete, setComplete] = useState(() => !enabled);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const skippedRef = useRef(false);

  const skip = useCallback(() => {
    skippedRef.current = true;
    setVisibleText(fullText);
    setComplete(true);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [fullText]);

  useEffect(() => {
    skippedRef.current = false;
    if (!enabled) {
      setVisibleText(fullText);
      setComplete(true);
      return;
    }

    setVisibleText("");
    setComplete(false);
    startRef.current = performance.now();

    const rtl = isRTLText(fullText);
    const charUnits = rtl ? null : Array.from(fullText);
    const wordUnits = rtl ? splitRTLUnits(fullText) : null;

    const tick = (now: number) => {
      if (skippedRef.current) return;

      const elapsed = (now - startRef.current) / 1000;

      if (rtl && wordUnits) {
        const targetWords = Math.min(
          wordUnits.length,
          Math.floor(elapsed * WORDS_PER_SEC_RTL) + 1,
        );
        const next = wordUnits.slice(0, targetWords).join("");
        setVisibleText(next);
        if (targetWords >= wordUnits.length) {
          setComplete(true);
          return;
        }
      } else if (charUnits) {
        const targetChars = Math.min(
          charUnits.length,
          Math.floor(elapsed * CHARS_PER_SEC),
        );
        const next = charUnits.slice(0, targetChars).join("");
        setVisibleText(next);
        if (targetChars >= charUnits.length) {
          setComplete(true);
          return;
        }
      } else {
        setVisibleText(fullText);
        setComplete(true);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [fullText, enabled]);

  return { visibleText, complete, skip };
}

export { isRTLText };
