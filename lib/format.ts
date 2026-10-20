export function formatCents(cents: number, currency = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}

// UTC so server and client render the same day (no hydration mismatch).
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
