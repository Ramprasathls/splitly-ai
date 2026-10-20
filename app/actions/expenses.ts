"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseExpenseInput, type ExpenseInput } from "@/lib/expenses";
import { requireMembership } from "@/lib/group-access";

function revalidateGroup(groupId: string) {
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

export async function addExpense(
  groupId: string,
  input: ExpenseInput,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  const parsed = parseExpenseInput(input, access.memberIds);
  if ("error" in parsed) return parsed;

  const { splits, ...fields } = parsed;
  await db.expense.create({
    data: { groupId, ...fields, splits: { create: splits } },
  });

  revalidateGroup(groupId);
  return {};
}

// An edit is a re-entry: the full validation re-runs and the splits are
// rewritten in the same update as the total, so they can't drift apart.
export async function updateExpense(
  groupId: string,
  expenseId: string,
  input: ExpenseInput,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  const parsed = parseExpenseInput(input, access.memberIds);
  if ("error" in parsed) return parsed;

  const { splits, ...fields } = parsed;
  try {
    await db.expense.update({
      where: { id: expenseId, groupId },
      data: { ...fields, splits: { deleteMany: {}, create: splits } },
    });
  } catch {
    return { error: "Expense not found" };
  }

  revalidateGroup(groupId);
  return {};
}

export async function deleteExpense(
  groupId: string,
  expenseId: string,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  // Scoped by groupId; settlements are separate facts and are never touched.
  const { count } = await db.expense.deleteMany({
    where: { id: expenseId, groupId },
  });
  if (count === 0) return { error: "Expense not found" };

  revalidateGroup(groupId);
  return {};
}
