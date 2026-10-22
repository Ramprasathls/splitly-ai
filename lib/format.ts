import { fromUsdCents } from "@/lib/fx";

/** The currency amounts are shown in, and its rate (units per 1 USD). */
export type Display = { currency: string; unitsPerUsd: number };

/** Hundredths of a unit → "€89.00" / "¥4,500". */
export function formatCents(cents: number, currency = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}

/** A stored USD amount, converted at today's rate into the display currency. */
export function formatUsd(usdCents: number, display: Display): string {
  return formatCents(
    fromUsdCents(usdCents, display.unitsPerUsd),
    display.currency,
  );
}

// UTC so server and client render the same day (no hydration mismatch).
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
