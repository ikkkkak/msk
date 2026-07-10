import { useMemo, useRef } from "react";

export function dedupeByNumericId<T>(
  items: T[],
  getId: (item: T) => number,
): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    const id = getId(item);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

function propertyIdFromUnknown(item: unknown): number {
  const raw = (item as { id?: unknown; ID?: unknown })?.id ?? (item as { ID?: unknown })?.ID;
  const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function landmarkIdFromUnknown(item: unknown): number {
  return propertyIdFromUnknown(item);
}

/**
 * Keeps scroll-stable ordering within a filter session; resets when sessionKey changes.
 */
export function useStableListOrder<T>(
  items: T[],
  sessionKey: string,
  getId: (item: T) => number,
): T[] {
  const orderRef = useRef<number[]>([]);
  const mapRef = useRef<Map<number, T>>(new Map());
  const prevKeyRef = useRef(sessionKey);

  return useMemo(() => {
    if (prevKeyRef.current !== sessionKey) {
      prevKeyRef.current = sessionKey;
      orderRef.current = [];
      mapRef.current = new Map();
    }
    const nextMap = new Map<number, T>(mapRef.current);
    for (const item of items) nextMap.set(getId(item), item);

    const inNext = new Set(items.map(getId));
    const nextOrder: number[] = [];
    for (const id of orderRef.current) {
      if (inNext.has(id)) nextOrder.push(id);
    }
    const seen = new Set(nextOrder);
    for (const item of items) {
      const id = getId(item);
      if (!seen.has(id)) {
        nextOrder.push(id);
        seen.add(id);
      }
    }

    orderRef.current = nextOrder;
    mapRef.current = nextMap;
    return nextOrder.map((id) => nextMap.get(id)!).filter(Boolean);
  }, [items, sessionKey, getId]);
}

export const getRentPropertyId = propertyIdFromUnknown;
export const getLandmarkId = landmarkIdFromUnknown;
