import "server-only";
import { db } from "@/lib/db";

export type ClerkUserFields = {
  id: string;
  /** Primary email; falls back to a placeholder if Clerk has none. */
  email: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  imageUrl: string | null | undefined;
};

/**
 * Idempotent upsert of a Clerk user into our User table (id = Clerk userId).
 * Shared by the dashboard dev fallback (ensureUser) and the webhook, so the
 * two paths can never disagree about how a user is stored.
 */
export async function syncUser(user: ClerkUserFields) {
  const email = (user.email ?? `${user.id}@unknown.invalid`).toLowerCase();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];
  const imageUrl = user.imageUrl ?? null;

  return db.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email, name, imageUrl },
    update: { email, name, imageUrl },
  });
}

/**
 * Idempotent removal for user.deleted. A user who appears in the ledger can't
 * be deleted (their expenses and payments feed everyone else's balances), so
 * they are anonymized instead; otherwise the row is deleted and memberships
 * cascade. Safe to replay.
 */
export async function removeUser(id: string) {
  await db.$transaction(async (tx) => {
    const [paid, shares, sent, received] = await Promise.all([
      tx.expense.count({ where: { paidById: id } }),
      tx.expenseSplit.count({ where: { userId: id } }),
      tx.settlement.count({ where: { fromUserId: id } }),
      tx.settlement.count({ where: { toUserId: id } }),
    ]);

    if (paid + shares + sent + received === 0) {
      await tx.user.deleteMany({ where: { id } });
      return;
    }

    await tx.user.updateMany({
      where: { id },
      data: {
        name: "Deleted user",
        email: `deleted-${id}@deleted.invalid`,
        imageUrl: null,
      },
    });
  });
}
