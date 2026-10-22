// Money is integer cents everywhere. No floats touch a stored amount.

const AMOUNT_PATTERN = /^\d{1,9}(\.\d{1,2})?$/;
const WHOLE_AMOUNT_PATTERN = /^\d{1,9}$/;

/**
 * "12.5" → 1250 (hundredths of a unit). Null for anything that isn't a positive
 * amount. `decimals: 0` (JPY, KRW) accepts whole units only.
 */
export function parseAmountToCents(
  input: string,
  decimals: 0 | 2 = 2,
): number | null {
  const trimmed = input.trim();
  const pattern = decimals === 0 ? WHOLE_AMOUNT_PATTERN : AMOUNT_PATTERN;
  if (!pattern.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents > 0 ? cents : null;
}

/** Equal split that always sums exactly to `totalCents`. */
export function splitEqually(
  totalCents: number,
  userIds: string[],
): { userId: string; amountCents: number }[] {
  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents - base * userIds.length;
  return userIds.map((userId, i) => ({
    userId,
    amountCents: base + (i < remainder ? 1 : 0),
  }));
}
