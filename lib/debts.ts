import "server-only";
import { netBalances } from "@/lib/balances";
import type { db } from "@/lib/db";
import { simplifyDebts } from "@/lib/simplify-debts";
import type { SimplifiedDebt } from "@/lib/types";

// Works with the normal client or a transaction client.
type Client = Pick<typeof db, "expense" | "settlement">;

/** The group's current minimized debts, derived from its ledger. */
export async function getGroupDebts(
  groupId: string,
  client: Client,
): Promise<SimplifiedDebt[]> {
  const [expenses, settlements] = await Promise.all([
    client.expense.findMany({
      where: { groupId },
      select: {
        paidById: true,
        amountCents: true,
        splits: { select: { userId: true, amountCents: true } },
      },
    }),
    client.settlement.findMany({
      where: { groupId },
      select: { fromUserId: true, toUserId: true, amountCents: true },
    }),
  ]);
  return simplifyDebts(netBalances(expenses, settlements));
}
