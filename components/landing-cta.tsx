import { Suspense } from "react";
import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const CTA_CLASS = "h-11 px-6 text-base";

// Signed out → opens the sign-up modal. Signed in → straight to the dashboard.
// Reading the session needs a Suspense boundary under Cache Components; the
// fallback is a same-size placeholder so the layout never jumps.
export function LandingCta() {
  return (
    <Suspense
      fallback={
        <div className="h-11 w-60 animate-pulse rounded-full bg-primary/20" />
      }
    >
      <Show
        when="signed-in"
        fallback={
          <SignUpButton mode="modal">
            <Button type="button" size="lg" className={CTA_CLASS}>
              Start splitting — it&apos;s free
            </Button>
          </SignUpButton>
        }
      >
        <Button
          size="lg"
          className={CTA_CLASS}
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          Go to your dashboard
        </Button>
      </Show>
    </Suspense>
  );
}
