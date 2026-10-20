"use client";

import { useTransition } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// One client component for every deletable row. The server component passes a
// bound server action: deleteExpense.bind(null, groupId, id).
export function DeleteRowButton({
  label,
  action,
}: {
  label: string;
  action: () => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.error) toast.error(result.error);
          else toast.success("Deleted");
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
    </Button>
  );
}
