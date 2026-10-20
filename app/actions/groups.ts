"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/ensure-user";

export async function createGroup(
  name: string,
): Promise<{ error: string } | { groupId: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > 60) {
    return { error: "Enter a group name (max 60 characters)" };
  }

  // The creator's User row must exist before the membership FK.
  await ensureUser();

  const group = await db.group.create({
    data: {
      name: trimmed,
      members: { create: { userId, role: "admin" } },
    },
  });

  revalidatePath("/dashboard");
  return { groupId: group.id };
}
