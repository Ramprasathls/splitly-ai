type BalanceExpense = {
  paidById: string;
  amountCents: number;
  splits: { userId: string; amountCents: number }[];
};

type BalanceSettlement = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};

/**
 * Net balance per user in cents. Positive: owed money. Negative: owes money.
 * (everything paid) − (own share of every expense) ± settlements.
 * Derived at read time — never stored.
 */
export function netBalances(
  expenses: BalanceExpense[],
  settlements: BalanceSettlement[],
): Map<string, number> {
  const balances = new Map<string, number>();
  const add = (userId: string, cents: number) =>
    balances.set(userId, (balances.get(userId) ?? 0) + cents);

  for (const expense of expenses) {
    add(expense.paidById, expense.amountCents);
    for (const split of expense.splits) add(split.userId, -split.amountCents);
  }
  // The payer of a settlement has cleared debt; the receiver is owed less.
  for (const s of settlements) {
    add(s.fromUserId, s.amountCents);
    add(s.toUserId, -s.amountCents);
  }
  return balances;
}
