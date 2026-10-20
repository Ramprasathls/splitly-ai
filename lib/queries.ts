import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { netBalances } from "@/lib/balances";
import { db } from "@/lib/db";
import type { GroupDetail, GroupSummary, Member } from "@/lib/types";

// Reads live here, never in "use server" files (those become public endpoints).

const groupInclude = {
  members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
  expenses: { include: { splits: true }, orderBy: { createdAt: "desc" } },
  settlements: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.GroupInclude;

type GroupRow = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;

function toSummary(group: GroupRow, userId: string): GroupSummary {
  const balances = netBalances(group.expenses, group.settlements);
  const members: Member[] = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    imageUrl: m.user.imageUrl,
  }));
  return {
    id: group.id,
    name: group.name,
    members,
    totalCents: group.expenses.reduce((sum, e) => sum + e.amountCents, 0),
    yourBalanceCents: balances.get(userId) ?? 0,
  };
}

export async function getGroups(userId: string): Promise<GroupSummary[]> {
  const groups = await db.group.findMany({
    where: { members: { some: { userId } } },
    include: groupInclude,
    orderBy: { createdAt: "desc" },
  });
  return groups.map((g) => toSummary(g, userId));
}

/** Null when the group doesn't exist OR the caller isn't a member. */
export async function getGroupDetail(
  userId: string,
  groupId: string,
): Promise<GroupDetail | null> {
  const group = await db.group.findFirst({
    where: { id: groupId, members: { some: { userId } } },
    include: groupInclude,
  });
  if (!group) return null;

  return {
    ...toSummary(group, userId),
    expenses: group.expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amountCents: e.amountCents,
      originalAmountCents: e.originalAmountCents,
      originalCurrency: e.originalCurrency,
      paidById: e.paidById,
      createdAt: e.createdAt,
      splits: e.splits.map((s) => ({
        userId: s.userId,
        amountCents: s.amountCents,
      })),
    })),
    settlements: group.settlements.map((s) => ({
      id: s.id,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amountCents: s.amountCents,
      createdAt: s.createdAt,
    })),
    // Phase 4 (debt simplification) fills this from the net balances.
    simplifiedDebts: [],
  };
}
