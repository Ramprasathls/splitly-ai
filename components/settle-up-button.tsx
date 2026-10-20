"use client";

import { Button } from "@/components/ui/button";
import { useMockAction } from "@/components/use-mock-action";

export function SettleUpButton() {
  const { pending, run } = useMockAction();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => run()}
    >
      {pending ? "Settling…" : "Settle up"}
    </Button>
  );
}
