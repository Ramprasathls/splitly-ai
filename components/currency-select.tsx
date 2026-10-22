"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";

const ITEMS = CURRENCIES.map((c) => ({ value: c, label: c }));

// Display-currency switcher: the choice lives in ?currency= so it's shareable
// and survives refresh. Every amount on the page converts at today's rate.
export function CurrencySelect({
  value,
  basePath,
}: {
  value: string;
  basePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      items={ITEMS}
      value={value}
      disabled={pending}
      onValueChange={(next) => {
        if (!next || next === value) return;
        startTransition(() => {
          router.push(
            next === "USD" ? basePath : `${basePath}?currency=${next}`,
          );
        });
      }}
    >
      <SelectTrigger aria-label="Display currency" className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ITEMS.map((c) => (
          <SelectItem key={c.value} value={c.value}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
