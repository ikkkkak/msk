export type StudioRangeDays = 7 | 14;

export function sliceTrend<T extends number>(
  values: T[],
  days: string[],
  range: StudioRangeDays,
): { values: T[]; days: string[] } {
  const n = Math.min(range, values.length, days.length);
  return {
    values: values.slice(-n),
    days: days.slice(-n),
  };
}

export function periodDelta(
  values: number[],
  range: StudioRangeDays,
): { current: number; delta: number; pct: number | null } {
  const n = range;
  const current = values.slice(-n).reduce((a, b) => a + b, 0);
  const prevSlice = values.slice(-n * 2, -n);
  const previous =
    prevSlice.length >= n
      ? prevSlice.reduce((a, b) => a + b, 0)
      : values.slice(0, Math.max(0, values.length - n)).reduce((a, b) => a + b, 0);
  const delta = current - previous;
  const pct =
    previous > 0 ? Math.round((delta / previous) * 1000) / 10 : null;
  return { current, delta, pct };
}

export function formatTrendLabel(
  delta: number,
  pct: number | null,
): string {
  if (delta === 0 && (pct === null || pct === 0)) return "—";
  const sign = delta >= 0 ? "+" : "";
  const num = formatCompact(Math.abs(delta));
  if (pct !== null) {
    return `${sign}${num} (${sign}${Math.abs(pct)}%)`;
  }
  return `${sign}${num}`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function formatMetricValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}
