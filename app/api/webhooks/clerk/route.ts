import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { removeUser, syncUser } from "@/lib/user-sync";

// Public on purpose: Clerk's deliveries carry no session. verifyWebhook is the
// only gate, and every branch below is idempotent because Svix retries.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req); // reads CLERK_WEBHOOK_SIGNING_SECRET
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const u = evt.data;
        const primary =
          u.email_addresses.find((e) => e.id === u.primary_email_address_id) ??
          u.email_addresses[0];
        await syncUser({
          id: u.id,
          email: primary?.email_address,
          firstName: u.first_name,
          lastName: u.last_name,
          imageUrl: u.image_url,
        });
        break;
      }
      case "user.deleted": {
        if (evt.data.id) await removeUser(evt.data.id);
        break;
      }
      default:
        // Other event types are acknowledged and ignored.
        break;
    }
  } catch (err) {
    // 500 makes Svix retry; the handlers above are safe to replay.
    console.error(`Clerk webhook ${evt.type} failed:`, err);
    return new Response("Processing failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
