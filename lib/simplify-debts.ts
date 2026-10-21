import type { SimplifiedDebt } from "./types";

type Side = { id: string; amount: number };

// Largest first; ties broken by id so the output is deterministic.
const largestFirst = (a: Side, b: Side) =>
  b.amount - a.amount || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Turns net balances (integer cents; positive = owed money, negative = owes
 * money) into the list of payments that settles the group.
 *
 * Greedy: repeatedly match the largest creditor with the largest debtor and
 * have the debtor pay min(what they owe, what the creditor is owed). Each step
 * zeroes at least one member, and the last zeroes two, so n members with
 * non-zero balances need at most n − 1 payments. (Greedy does not guarantee
 * the absolute minimum — that is NP-hard — only the n − 1 bound.)
 *
 * Throws if the balances don't sum to zero: that means the ledger is corrupt,
 * and failing loudly beats showing wrong debts.
 */
export function simplifyDebts(balances: Map<string, number>): SimplifiedDebt[] {
  const creditors: Side[] = [];
  const debtors: Side[] = [];
  let sum = 0;

  for (const [id, net] of balances) {
    if (!Number.isInteger(net)) {
      throw new Error(`Balance for ${id} is not an integer number of cents`);
    }
    sum += net;
    if (net > 0) creditors.push({ id, amount: net });
    else if (net < 0) debtors.push({ id, amount: -net });
  }
  if (sum !== 0) {
    throw new Error(`Balances must sum to zero, got ${sum} cents`);
  }

  const debts: SimplifiedDebt[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(largestFirst);
    debtors.sort(largestFirst);
    const creditor = creditors[0];
    const debtor = debtors[0];

    const pay = Math.min(creditor.amount, debtor.amount);
    debts.push({
      fromUserId: debtor.id,
      toUserId: creditor.id,
      amountCents: pay,
    });

    creditor.amount -= pay;
    debtor.amount -= pay;
    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }
  return debts;
}
