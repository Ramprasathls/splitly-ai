"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Display-currency switcher. Phase 7 wires it to ?currency= and converts the
// amounts; until then only USD is offered so the UI never claims a conversion.
const ITEMS = [{ value: "USD", label: "USD" }];

export function CurrencySelect() {
  return (
    <Select items={ITEMS} defaultValue="USD">
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
