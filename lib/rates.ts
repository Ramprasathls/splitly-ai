import "server-only";
import { cacheLife } from "next/cache";
import { CURRENCIES, parseCurrency } from "@/lib/currencies";
import type { Display } from "@/lib/format";
import type { Rates } from "@/lib/fx";

const SYMBOLS = CURRENCIES.filter((c) => c !== "USD").join(",");

// ECB reference rates via frankfurter.dev, as "units per 1 USD". Cached for an
// hour; a failed fetch throws and is never cached.
async function fetchRates(): Promise<Rates> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });

  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${SYMBOLS}`,
  );
  if (!res.ok) throw new Error(`Rates request failed (${res.status})`);

  const data = (await res.json()) as { rates?: Record<string, number> };
  const rates: Rates = { USD: 1 };
  for (const code of CURRENCIES) {
    if (code === "USD") continue;
    const rate = data.rates?.[code];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`Missing or invalid rate for ${code}`);
    }
    rates[code] = rate;
  }
  return rates;
}

/** Today's rates, or null if the provider is unreachable. */
export async function getRates(): Promise<Rates | null> {
  try {
    return await fetchRates();
  } catch (err) {
    console.error("Exchange rates unavailable:", err);
    return null;
  }
}

/**
 * Resolves the `?currency=` display choice. Falls back to USD for unknown codes
 * or when rates are unavailable, so the page never shows a made-up conversion.
 */
export async function getDisplay(
  param: string | string[] | undefined,
): Promise<Display> {
  const currency = parseCurrency(param);
  if (currency === "USD") return { currency: "USD", unitsPerUsd: 1 };

  const rates = await getRates();
  const unitsPerUsd = rates?.[currency];
  return unitsPerUsd
    ? { currency, unitsPerUsd }
    : { currency: "USD", unitsPerUsd: 1 };
}
