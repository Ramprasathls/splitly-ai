import { ENTRY_CURRENCIES } from "@/lib/currencies";
import { parseAmountToCents, splitEqually } from "@/lib/money";

export type ExpenseInput = {
  description: string;
  /** Decimal string in `currency`, e.g. "12.50". Never a float from the client. */
  amount: string;
  currency: string;
  paidById: string;
  memberIds: string[];
};

export type ParsedExpense = {
  description: string;
  paidById: string;
  amountCents: number;
  originalAmountCents: number;
  originalCurrency: string;
  splits: { userId: string; amountCents: number }[];
};

/**
 * The single validation path for add AND edit. The client is never trusted:
 * shapes, members, amounts and the split total are all re-checked here.
 */
export function parseExpenseInput(
  input: ExpenseInput,
  groupMemberIds: string[],
): ParsedExpense | { error: string } {
  if (
    !input ||
    typeof input.description !== "string" ||
    typeof input.amount !== "string" ||
    typeof input.currency !== "string" ||
    typeof input.paidById !== "string" ||
    !Array.isArray(input.memberIds) ||
    !input.memberIds.every((id) => typeof id === "string")
  ) {
    return { error: "Invalid expense" };
  }

  const description = input.description.trim();
  if (!description || description.length > 120) {
    return { error: "Enter a description (max 120 characters)" };
  }

  if (!(ENTRY_CURRENCIES as readonly string[]).includes(input.currency)) {
    return { error: "Unsupported currency" };
  }

  const amountCents = parseAmountToCents(input.amount);
  if (amountCents === null) return { error: "Enter a valid amount" };

  if (!groupMemberIds.includes(input.paidById)) {
    return { error: "Payer must be a group member" };
  }

  const memberIds = input.memberIds;
  if (memberIds.length === 0) return { error: "Select at least one member" };
  if (new Set(memberIds).size !== memberIds.length) {
    return { error: "Duplicate members" };
  }
  if (!memberIds.every((id) => groupMemberIds.includes(id))) {
    return { error: "Only group members can share an expense" };
  }

  const splits = splitEqually(amountCents, memberIds);
  const total = splits.reduce((sum, s) => sum + s.amountCents, 0);
  if (total !== amountCents || splits.some((s) => s.amountCents < 0)) {
    return { error: "Shares don't add up" };
  }

  // Phase 7 converts non-USD entries; until then USD is the only entry currency.
  return {
    description,
    paidById: input.paidById,
    amountCents,
    originalAmountCents: amountCents,
    originalCurrency: input.currency,
    splits,
  };
}
