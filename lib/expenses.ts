import { CURRENCIES, currencyDecimals } from "@/lib/currencies";
import { convertShares, toUsdCents, type Rates } from "@/lib/fx";
import { parseAmountToCents } from "@/lib/money";
import { computeSplits, type SplitInput } from "@/lib/splits";

export type ExpenseInput = {
  description: string;
  /** Decimal string in `currency`, e.g. "12.50". Never a float from the client. */
  amount: string;
  currency: string;
  paidById: string;
  /** How to divide the amount, in the entered currency. */
  split: SplitInput;
};

export type ParsedExpense = {
  description: string;
  paidById: string;
  /** USD cents — converted once, here, at entry. */
  amountCents: number;
  /** The amount as entered, in hundredths of `originalCurrency`. */
  originalAmountCents: number;
  originalCurrency: string;
  /** USD shares, summing exactly to amountCents. */
  splits: { userId: string; amountCents: number }[];
};

// Server actions are public endpoints: check the shape, not just the types.
function isSplitInput(value: unknown): value is SplitInput {
  if (!value || typeof value !== "object") return false;
  const split = value as Record<string, unknown>;
  if (split.mode === "equal") {
    return (
      Array.isArray(split.userIds) &&
      split.userIds.every((id) => typeof id === "string")
    );
  }
  if (split.mode === "percent" || split.mode === "exact") {
    return (
      Array.isArray(split.entries) &&
      split.entries.every(
        (e) =>
          !!e &&
          typeof e === "object" &&
          typeof (e as Record<string, unknown>).userId === "string" &&
          typeof (e as Record<string, unknown>).value === "string",
      )
    );
  }
  return false;
}

/**
 * The single validation path for add AND edit. The client is never trusted:
 * shapes, members, amounts and the split total are all re-checked here, and
 * the shares are computed here, never taken from the client.
 *
 * `rates` (units per 1 USD) is only needed for non-USD entries. The entry is
 * split in its own currency first (so "by exact amounts" adds up in euros, say),
 * then converted ONCE to USD, with the shares reconciled to sum exactly.
 */
export function parseExpenseInput(
  input: ExpenseInput,
  groupMemberIds: string[],
  rates: Rates | null = null,
): ParsedExpense | { error: string } {
  if (
    !input ||
    typeof input.description !== "string" ||
    typeof input.amount !== "string" ||
    typeof input.currency !== "string" ||
    typeof input.paidById !== "string" ||
    !isSplitInput(input.split)
  ) {
    return { error: "Invalid expense" };
  }

  const description = input.description.trim();
  if (!description || description.length > 120) {
    return { error: "Enter a description (max 120 characters)" };
  }

  if (!(CURRENCIES as readonly string[]).includes(input.currency)) {
    return { error: "Unsupported currency" };
  }

  const amountCents = parseAmountToCents(
    input.amount,
    currencyDecimals(input.currency),
  );
  if (amountCents === null) return { error: "Enter a valid amount" };

  if (!groupMemberIds.includes(input.paidById)) {
    return { error: "Payer must be a group member" };
  }

  const memberIds =
    input.split.mode === "equal"
      ? input.split.userIds
      : input.split.entries.map((e) => e.userId);
  if (memberIds.length === 0) return { error: "Select at least one member" };
  if (new Set(memberIds).size !== memberIds.length) {
    return { error: "Duplicate members" };
  }
  if (!memberIds.every((id) => groupMemberIds.includes(id))) {
    return { error: "Only group members can share an expense" };
  }

  // 1. Split in the entered currency.
  const enteredShares = computeSplits(amountCents, input.split);
  if ("error" in enteredShares) return enteredShares;

  // 2. Convert once to USD at today's rate.
  const unitsPerUsd = input.currency === "USD" ? 1 : rates?.[input.currency];
  if (!unitsPerUsd) {
    return { error: "Exchange rates are unavailable — try again shortly" };
  }
  const usdTotal = toUsdCents(amountCents, unitsPerUsd);

  // 3. Convert the shares proportionally, reconciled to the USD total.
  const splits = convertShares(enteredShares, usdTotal);
  if (usdTotal < 1 || splits.some((s) => s.amountCents < 1)) {
    return { error: "Amount is too small to split that way" };
  }

  return {
    description,
    paidById: input.paidById,
    amountCents: usdTotal,
    originalAmountCents: amountCents,
    originalCurrency: input.currency,
    splits,
  };
}
