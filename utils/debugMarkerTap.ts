/**
 * Debug util: record marker tap time and compute elapsed until card shown.
 * Log all actions with timestamps to find what delays the card.
 */

let lastTapAt = 0;

function fmt(elapsedMs: number): string {
  const sec = Math.floor(elapsedMs / 1000);
  const ms = (elapsedMs % 1000).toFixed(2);
  if (sec > 0) return `${sec}s ${ms}ms`;
  return `${ms}ms`;
}

export function recordMarkerTap(): number {
  lastTapAt = performance.now();
  const t = lastTapAt;
  const sec = Math.floor(t / 1000);
  const ms = (t % 1000).toFixed(0);
  console.log(`[MARKER_DEBUG] 🎯 TAP (context uptime ${sec}s ${ms}ms, used as t=0 for +elapsed)`);
  return lastTapAt;
}

export function getLastTapAt(): number {
  return lastTapAt;
}

export function logElapsedSinceTap(label: string): number {
  const elapsed = lastTapAt ? performance.now() - lastTapAt : 0;
  console.log(`[MARKER_DEBUG] ⏱️ ${label} +${fmt(elapsed)} (${elapsed.toFixed(2)}ms total)`);
  if (elapsed > 100 && (label.includes("CARD_SHOWN") || label.includes("sheet sync"))) {
    console.log(`[MARKER_DEBUG] ⚠️ Delay ${elapsed.toFixed(0)}ms likely from React re-render/commit (heavy tree, context updates). State updates finished in <10ms.`);
  }
  return elapsed;
}

export function logAction(label: string, detail?: Record<string, unknown>): void {
  const elapsed = lastTapAt ? performance.now() - lastTapAt : 0;
  const extra = detail ? ` ${JSON.stringify(detail)}` : "";
  console.log(`[MARKER_DEBUG] ${label} +${fmt(elapsed)}${extra}`);
}
