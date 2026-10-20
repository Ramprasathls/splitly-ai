"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/group-access";

export async function addMember(
  groupId: string,
  email: string,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  const normalized =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: "Enter a valid email" };
  }

  const user = await db.user.findUnique({ where: { email: normalized } });
  if (!user) return { error: "No Splitly account for that email" };
  if (access.memberIds.includes(user.id)) {
    return { error: "Already in this group" };
  }

  await db.groupMember.create({
    data: { groupId, userId: user.id, role: "member" },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  return {};
}
