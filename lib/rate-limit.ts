// Tiny sliding-window limiter, per key, in this server process's memory. It
// stops a signed-in user from running up paid API calls in a tight loop; it is
// NOT a global limit (each server instance counts separately and a restart
// resets it), so back it with a shared store before running many instances.

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
