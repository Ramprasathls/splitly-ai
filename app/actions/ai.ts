"use server";

import { auth } from "@clerk/nextjs/server";
import { aiConfigured, extractExpense } from "@/lib/ai-quick-add";
import { parseCurrency } from "@/lib/currencies";
import { requireMembership } from "@/lib/group-access";
import { MAX_QUICK_ADD_CHARS } from "@/lib/quick-add-limits";
import { rateLimit } from "@/lib/rate-limit";

// Each call costs money, so: signed in, a member of the group, bounded input,
// and a per-user limit. The model only suggests values; the form still shows
// them for review and the save path re-validates everything.
export async function parseExpenseText(
  groupId: string,
  text: string,
  defaultCurrency: string,
): Promise<
  { error: string } | { description: string; amount: string; currency: string }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to continue" };

  const access = await requireMembership(groupId);
  if ("error" in access) return access;

  if (!aiConfigured()) return { error: "AI quick-add isn't set up" };

  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return { error: "Describe the expense first" };
  if (trimmed.length > MAX_QUICK_ADD_CHARS) {
    return { error: `Keep it under ${MAX_QUICK_ADD_CHARS} characters` };
  }

  if (!rateLimit(`quick-add:${userId}`, 15, 60_000)) {
    return { error: "Too many requests — wait a moment" };
  }

  return extractExpense(trimmed, parseCurrency(defaultCurrency));
}
