import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Upserts the signed-in Clerk user into our User table (id = Clerk userId).
 * Dev fallback — the Clerk webhook (Phase 5) is the production sync path.
 */
export async function ensureUser() {
  const user = await currentUser();
  if (!user) return null;

  const email = (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${user.id}@unknown.invalid`
  ).toLowerCase();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0];

  return db.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email, name, imageUrl: user.imageUrl },
    update: { email, name, imageUrl: user.imageUrl },
  });
}
