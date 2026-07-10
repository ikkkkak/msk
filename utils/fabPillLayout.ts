import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/** Horizontal padding inside a pill segment (each side). */
export const FAB_SEGMENT_H_PAD = 12;
export const FAB_SEGMENT_ICON = 15;
export const FAB_SEGMENT_GAP = 6;
export const FAB_SEGMENT_MIN_W = 48;

export function segmentWidthFromLabel(
  labelWidth: number,
  opts?: { icon?: boolean; min?: number; hPad?: number },
): number {
  const icon = opts?.icon !== false;
  const hPad = opts?.hPad ?? FAB_SEGMENT_H_PAD;
  const min = opts?.min ?? FAB_SEGMENT_MIN_W;
  const iconSlot = icon ? FAB_SEGMENT_ICON + FAB_SEGMENT_GAP : 0;
  return Math.max(min, Math.ceil(labelWidth + iconSlot + hPad * 2));
}

/** Measure label width once via onLayout (hidden or visible Text). */
export function useMeasuredLabelWidth(fallback = 0) {
  const [width, setWidth] = useState(fallback);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth((prev) => (Math.abs(prev - w) > 0.5 ? w : prev));
  }, []);
  return { width, onLayout };
}
