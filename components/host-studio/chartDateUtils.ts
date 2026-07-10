/** Format API day keys (YYYY-MM-DD) for chart axes. */
export function formatAxisDay(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  const date = new Date(y, m, d);
  if (Number.isNaN(date.getTime())) return iso;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  if (day.getTime() === today.getTime()) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateRange(days: string[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return formatAxisDay(days[0]);
  return `${formatAxisDay(days[0])} – ${formatAxisDay(days[days.length - 1])}`;
}

/** Evenly spaced indices for x-axis labels (always includes first & last). */
export function pickXLabelIndices(length: number, labelCount: number): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];
  const n = Math.min(labelCount, length);
  if (n <= 1) return [length - 1];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.round((i / (n - 1)) * (length - 1)));
  }
  return [...new Set(out)];
}

export function buildDefaultDays(length: number): string[] {
  const out: string[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let i = length - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

export function yTickValues(max: number): number[] {
  if (max <= 0) return [0];
  if (max <= 4) return [0, max];
  const mid = Math.round(max / 2);
  if (mid === 0 || mid === max) return [0, max];
  return [0, mid, max];
}

export function formatYTick(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
