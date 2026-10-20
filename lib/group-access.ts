import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export type Access = { userId: string; memberIds: string[] };

/**
 * Identity comes from Clerk only. Returns the caller's id and the group's
 * member ids, or an error if the caller is signed out or not a member.
 */
export async function requireMembership(
  groupId: string,
): Promise<Access | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };
  if (typeof groupId !== "string" || !groupId)
    return { error: "Group not found" };

  const members = await db.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);
  if (!memberIds.includes(userId)) return { error: "Group not found" };
  return { userId, memberIds };
}
