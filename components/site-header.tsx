import { Suspense } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold">
          💸 Splitly
        </Link>
        <nav className="flex items-center gap-3">
          <Suspense fallback={null}>
            <Show when="signed-in">
              <Link href="/dashboard" className="text-sm font-medium">
                Dashboard
              </Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button type="button" variant="ghost">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button type="button">Get started</Button>
              </SignUpButton>
            </Show>
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
