"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SparklesIcon } from "lucide-react";
import { isRecent, msUntilStale } from "@/lib/recent";

// Marks an expense added in the last minute, then switches itself off. The
// clock is read only on the client (the server snapshot is always "not
// recent"), so there's no hydration mismatch, and a timer ends the sparkle at
// the one-minute mark without waiting for a refresh.
export function NewSparkle({ createdAt }: { createdAt: string }) {
  const createdMs = new Date(createdAt).getTime();

  const subscribe = useCallback(
    (onChange: () => void) => {
      const wait = msUntilStale(createdMs, Date.now());
      if (wait === 0) return () => {};
      const timer = setTimeout(onChange, wait);
      return () => clearTimeout(timer);
    },
    [createdMs],
  );

  const recent = useSyncExternalStore(
    subscribe,
    () => isRecent(createdMs, Date.now()),
    () => false,
  );

  if (!recent) return null;
  return (
    <SparklesIcon
      aria-label="Just added"
      role="img"
      className="size-4 shrink-0 text-primary motion-safe:animate-in motion-safe:zoom-in"
    />
  );
}
