// Pure currency-conversion math. Rates are "units of the currency per 1 USD"
// (frankfurter.dev with base=USD). The only float step is the single multiply or
// divide by a rate, rounded straight back to integer cents; everything else is
// integer (BigInt) math so shares always sum exactly.
// Relative .ts imports keep this file runnable by `npm test`.

import { splitEqually } from "./money.ts";
import type { Share } from "./splits.ts";

export type Rates = Record<string, number>;

// BigInt(0), not a 0n literal: this project's TS target predates BigInt literals.
const ZERO = BigInt(0);

/** Entered amount (hundredths of a currency unit) → USD cents, rounded once. */
export function toUsdCents(amountCents: number, unitsPerUsd: number): number {
  return Math.round(amountCents / unitsPerUsd);
}

/** USD cents → hundredths of a currency unit at `unitsPerUsd`. */
export function fromUsdCents(usdCents: number, unitsPerUsd: number): number {
  return Math.round(usdCents * unitsPerUsd);
}

/**
 * Divides `total` in proportion to `weights` so the parts sum EXACTLY to
 * `total`: each part is floored, then the leftover units go to the largest
 * fractional remainders (ties: lowest index). BigInt, so large amounts can't
 * overflow.
 */
export function allocateProportionally(
  total: number,
  weights: number[],
): number[] {
  const big = weights.map((w) => BigInt(w));
  const sum = big.reduce((s, w) => s + w, ZERO);
  if (sum <= ZERO) throw new Error("Weights must add up to more than zero");

  const t = BigInt(total);
  const floors = big.map((w) => (t * w) / sum);
  const remainders = big.map((w) => (t * w) % sum);
  let leftover = Number(t - floors.reduce((s, f) => s + f, ZERO));

  const order = big
    .map((_, i) => i)
    .sort((a, b) =>
      remainders[a] === remainders[b]
        ? a - b
        : remainders[a] > remainders[b]
          ? -1
          : 1,
    );
  const parts = floors.map((f) => Number(f));
  for (const i of order) {
    if (leftover === 0) break;
    parts[i] += 1;
    leftover -= 1;
  }
  return parts;
}

/**
 * Converts per-member shares (in the entered currency) into USD shares that sum
 * exactly to `usdTotalCents`, keeping each member's proportion.
 */
export function convertShares(shares: Share[], usdTotalCents: number): Share[] {
  const usd = allocateProportionally(
    usdTotalCents,
    shares.map((s) => s.amountCents),
  );
  return shares.map((s, i) => ({ userId: s.userId, amountCents: usd[i] }));
}

/**
 * Edit-form prefill: rebuilds each member's share in the ENTERED currency from
 * the stored USD splits, proportionally and summing exactly to the entered
 * total. Works in whole currency units for zero-decimal currencies. (The
 * original entry isn't stored per member, so coarse currencies like JPY can
 * land a unit off the original.)
 */
export function reconstructShares(
  originalTotalCents: number,
  usdShares: Share[],
  decimals: 0 | 2,
): Share[] {
  const unit = decimals === 0 ? 100 : 1;
  const parts = allocateProportionally(
    Math.round(originalTotalCents / unit),
    usdShares.map((s) => s.amountCents),
  );
  return usdShares.map((s, i) => ({
    userId: s.userId,
    amountCents: parts[i] * unit,
  }));
}

/**
 * Was this expense an equal split in the entered currency? Replays the entry
 * pipeline (split the entered total equally, convert once) and compares with
 * what was stored. That is exact; judging the rebuilt shares is not: when one
 * US cent spans many entered units (THB, JPY, INR...) the rebuilt shares drift
 * from what was typed, and an equal split looked "uneven" about 44% of the time.
 * Matches per member first, then as a multiset in case rows came back reordered.
 */
export function wasEqualSplit(
  originalTotalCents: number,
  usdShares: Share[],
  decimals: 0 | 2,
): boolean {
  if (usdShares.length === 0) return false;
  const unit = decimals === 0 ? 100 : 1;
  const usdTotal = usdShares.reduce((sum, s) => sum + s.amountCents, 0);

  const entered = splitEqually(
    Math.round(originalTotalCents / unit),
    usdShares.map((s) => s.userId),
  ).map((s) => ({ userId: s.userId, amountCents: s.amountCents * unit }));
  const replay = convertShares(entered, usdTotal);

  if (replay.every((s, i) => s.amountCents === usdShares[i].amountCents)) {
    return true;
  }
  const byAmount = (a: number, b: number) => a - b;
  const a = replay.map((s) => s.amountCents).sort(byAmount);
  const b = usdShares.map((s) => s.amountCents).sort(byAmount);
  return a.every((v, i) => v === b[i]);
}
