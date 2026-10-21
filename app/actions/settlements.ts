"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getGroupDebts } from "@/lib/debts";
import { requireMembership } from "@/lib/group-access";

function revalidateGroup(groupId: string) {
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

// Either party of a debt may record the payment.
export async function settleUp(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amountCents: number,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  if (
    typeof fromUserId !== "string" ||
    typeof toUserId !== "string" ||
    fromUserId === toUserId ||
    !access.memberIds.includes(fromUserId) ||
    !access.memberIds.includes(toUserId)
  ) {
    return { error: "Invalid payment" };
  }
  if (userId !== fromUserId && userId !== toUserId) {
    return { error: "You can only settle your own debts" };
  }
  if (
    !Number.isInteger(amountCents) ||
    amountCents <= 0 ||
    amountCents > 1e11
  ) {
    return { error: "Invalid amount" };
  }

  // Check and insert in one transaction: the payment must match a current
  // debt, so a stale tab or a double-click can't record it twice.
  const result = await db.$transaction(async (tx) => {
    const debts = await getGroupDebts(groupId, tx);
    const debt = debts.find(
      (d) => d.fromUserId === fromUserId && d.toUserId === toUserId,
    );
    if (!debt || amountCents > debt.amountCents) {
      return { error: "That debt has changed — refresh and try again" };
    }
    await tx.settlement.create({
      data: { groupId, fromUserId, toUserId, amountCents },
    });
    return {};
  });
  if (result.error) return result;

  revalidateGroup(groupId);
  return {};
}

export async function deleteSettlement(
  groupId: string,
  settlementId: string,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  const { count } = await db.settlement.deleteMany({
    where: { id: settlementId, groupId },
  });
  if (count === 0) return { error: "Payment not found" };

  revalidateGroup(groupId);
  return {};
}
