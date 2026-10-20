"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
