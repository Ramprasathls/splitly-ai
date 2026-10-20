import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="text-lg font-semibold">
        💸 Splitly
      </Link>
      <nav className="flex items-center gap-3">
        <Show when="signed-in">
          <Link href="/dashboard" className="text-sm font-medium">
            Dashboard
          </Link>
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button type="button" className="text-sm font-medium">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
            >
              Get started
            </button>
          </SignUpButton>
        </Show>
      </nav>
    </header>
  );
}
