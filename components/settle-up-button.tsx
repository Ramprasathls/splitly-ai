"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Takes a bound server action: settleUp.bind(null, groupId, from, to, cents).
export function SettleUpButton({
  action,
}: {
  action: () => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.error) toast.error(result.error);
          else toast.success("Payment recorded");
        })
      }
    >
      {pending ? "Settling…" : "Settle up"}
    </Button>
  );
}
