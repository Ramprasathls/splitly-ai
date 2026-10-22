// Pure split math shared by the expense modal (live preview, enabling Save) and
// the server (the authority). Integer cents only; no floats touch a share.
// Relative .ts imports keep this file runnable by `npm test`.

import { parseAmountToCents, splitEqually } from "./money.ts";

export type SplitMode = "equal" | "percent" | "exact";

export type Share = { userId: string; amountCents: number };

export type SplitInput =
  | { mode: "equal"; userIds: string[] }
  | {
      mode: "percent" | "exact";
      /** `value` is the raw text: "33.33" (percent) or "12.50" (amount). */
      entries: { userId: string; value: string }[];
    };

const PERCENT_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;
const FULL_BP = 10_000; // 100.00% in hundredths of a percent

/** "33.33" → 3333 (hundredths of a percent). Null unless 0 < p ≤ 100. */
export function parsePercentToBp(input: string): number | null {
  const trimmed = input.trim();
  if (!PERCENT_PATTERN.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const bp = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return bp > 0 && bp <= FULL_BP ? bp : null;
}

/** 3333 → "33.33", 5000 → "50", 3330 → "33.3". */
export function formatBp(bp: number): string {
  return (bp / 100).toFixed(2).replace(/\.?0+$/, "");
}

/**
 * 1250 → "12.50" (integer math, safe for form fields). Zero-decimal
 * currencies (JPY, KRW) format as whole units: 450000 → "4500".
 */
export function formatCentsInput(cents: number, decimals: 0 | 2 = 2): string {
  const whole = Math.floor(cents / 100);
  return decimals === 0
    ? String(whole)
    : `${whole}.${String(cents % 100).padStart(2, "0")}`;
}

/**
 * Splits `totalCents` by basis points that sum to exactly 10,000. Each share is
 * floored, then the leftover cents go to the largest fractional remainders
 * (ties: input order), so the shares always sum exactly to the total.
 */
function allocateByBasisPoints(
  totalCents: number,
  entries: { userId: string; bp: number }[],
): Share[] {
  const floors = entries.map((e) => Math.floor((totalCents * e.bp) / FULL_BP));
  const remainders = entries.map((e) => (totalCents * e.bp) % FULL_BP);
  let leftover = totalCents - floors.reduce((s, v) => s + v, 0);

  const byRemainder = entries
    .map((_, i) => i)
    .sort((a, b) => remainders[b] - remainders[a] || a - b);
  const amounts = [...floors];
  for (const i of byRemainder) {
    if (leftover === 0) break;
    amounts[i] += 1;
    leftover -= 1;
  }
  return entries.map((e, i) => ({ userId: e.userId, amountCents: amounts[i] }));
}

/**
 * The single place a split is computed. Returns each member's share in cents,
 * summing exactly to `totalCents`, or an error describing what's wrong.
 */
export function computeSplits(
  totalCents: number,
  split: SplitInput,
): Share[] | { error: string } {
  let shares: Share[];

  if (split.mode === "equal") {
    if (split.userIds.length === 0)
      return { error: "Select at least one member" };
    shares = splitEqually(totalCents, split.userIds);
  } else if (split.mode === "exact") {
    if (split.entries.length === 0)
      return { error: "Select at least one member" };
    const parsed = split.entries.map((e) => ({
      userId: e.userId,
      amountCents: parseAmountToCents(e.value),
    }));
    if (parsed.some((p) => p.amountCents === null)) {
      return { error: "Enter an amount for each member" };
    }
    shares = parsed as Share[];
    if (shares.reduce((s, x) => s + x.amountCents, 0) !== totalCents) {
      return { error: "Amounts must add up to the total" };
    }
  } else {
    if (split.entries.length === 0)
      return { error: "Select at least one member" };
    const parsed = split.entries.map((e) => ({
      userId: e.userId,
      bp: parsePercentToBp(e.value),
    }));
    if (parsed.some((p) => p.bp === null)) {
      return { error: "Enter a percentage for each member" };
    }
    const entries = parsed as { userId: string; bp: number }[];
    if (entries.reduce((s, e) => s + e.bp, 0) !== FULL_BP) {
      return { error: "Percentages must add up to 100%" };
    }
    if (!Number.isSafeInteger(totalCents * FULL_BP)) {
      return { error: "Amount is too large" };
    }
    shares = allocateByBasisPoints(totalCents, entries);
  }

  if (
    shares.some((s) => !Number.isInteger(s.amountCents) || s.amountCents < 1)
  ) {
    return { error: "Amount is too small to split that way" };
  }
  if (shares.reduce((s, x) => s + x.amountCents, 0) !== totalCents) {
    return { error: "Shares don't add up" };
  }
  return shares;
}

/**
 * How an existing expense reopens in the edit form: "equal" when its shares are
 * exactly what an equal split would produce, otherwise "exact".
 */
export function inferSplitMode(shares: Share[]): "equal" | "exact" {
  if (shares.length === 0) return "equal";
  const total = shares.reduce((s, x) => s + x.amountCents, 0);
  const byAmount = (a: number, b: number) => a - b;
  const expected = splitEqually(
    total,
    shares.map((s) => s.userId),
  )
    .map((s) => s.amountCents)
    .sort(byAmount);
  const actual = shares.map((s) => s.amountCents).sort(byAmount);
  return expected.every((v, i) => v === actual[i]) ? "equal" : "exact";
}

/**
 * Starting values for a mode's input fields, so switching modes (or changing
 * who's included) starts from a valid equal split instead of blank boxes.
 */
export function defaultSplitValues(
  mode: SplitMode,
  userIds: string[],
  totalCents: number | null,
  decimals: 0 | 2 = 2,
): Record<string, string> {
  if (mode === "equal" || userIds.length === 0) return {};
  if (mode === "percent") {
    return Object.fromEntries(
      splitEqually(FULL_BP, userIds).map((s) => [
        s.userId,
        formatBp(s.amountCents),
      ]),
    );
  }
  if (totalCents === null) return {};
  // Zero-decimal currencies divide in whole units, never fractions of a yen.
  const unit = decimals === 0 ? 100 : 1;
  return Object.fromEntries(
    splitEqually(Math.round(totalCents / unit), userIds).map((s) => [
      s.userId,
      formatCentsInput(s.amountCents * unit, decimals),
    ]),
  );
}
