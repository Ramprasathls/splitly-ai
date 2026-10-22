// "Just added" window for the sparkle on new expenses. Pure, no imports:
// runnable by `npm test`.

export const RECENT_MS = 60_000;

/** True while `createdAtMs` is less than `windowMs` old at `nowMs`. */
export function isRecent(
  createdAtMs: number,
  nowMs: number,
  windowMs = RECENT_MS,
): boolean {
  return nowMs - createdAtMs < windowMs;
}

/** Milliseconds until an item stops being recent (0 if it already has). */
export function msUntilStale(
  createdAtMs: number,
  nowMs: number,
  windowMs = RECENT_MS,
): number {
  return Math.max(0, createdAtMs + windowMs - nowMs);
}
