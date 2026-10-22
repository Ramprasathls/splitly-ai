import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { syncUser } from "@/lib/user-sync";

/**
 * Returns the signed-in user's row, creating it from Clerk on first sight.
 *
 * `auth()` verifies the session token locally, but `currentUser()` is a network
 * call to Clerk's Backend API, so it only runs when the row is missing. Once a
 * user exists, pages don't depend on Clerk's API being up. Later profile changes
 * (name, email, avatar) arrive through the webhook (/api/webhooks/clerk); both
 * paths go through syncUser.
 */
export async function ensureUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const user = await currentUser();
  if (!user) return null;

  return syncUser({
    id: user.id,
    email:
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  });
}
