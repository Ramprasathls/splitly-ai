import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/lib/user-sync";

/**
 * Upserts the signed-in Clerk user into our User table (id = Clerk userId).
 * Dev fallback — the Clerk webhook (/api/webhooks/clerk) is the production
 * sync path; both go through syncUser.
 */
export async function ensureUser() {
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
