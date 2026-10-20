"use client";

import { useTransition } from "react";
import { toast } from "sonner";

// Phase 2 stand-in for server actions: shows the pending state and a toast so
// the feedback rules hold, but saves nothing. Phase 3 replaces every caller
// with a real action.
export async function runMock() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  toast.info("Preview data — nothing was saved");
}

export function useMockAction() {
  const [pending, startTransition] = useTransition();
  function run(onDone?: () => void) {
    startTransition(async () => {
      await runMock();
      onDone?.();
    });
  }
  return { pending, run };
}
