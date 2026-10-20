"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatars";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMockAction } from "@/components/use-mock-action";
import { CURRENCIES } from "@/lib/currencies";
import { displayName } from "@/lib/members";
import type { Expense, Member } from "@/lib/types";

type FormState = {
  quickText: string;
  description: string;
  amount: string;
  currency: string;
  paidById: string;
  included: string[];
};

const CURRENCY_ITEMS = CURRENCIES.map((c) => ({ value: c, label: c }));
const SPLIT_ITEMS = [{ value: "equally", label: "equally" }];

// Pill-style selects used inside the "Paid by … and split …" sentence.
const PILL_TRIGGER =
  "h-auto w-auto gap-1 border-0 bg-transparent px-1 py-0.5 text-base font-medium text-primary shadow-none dark:bg-transparent dark:hover:bg-transparent";

function initialState(
  members: Member[],
  currentUserId: string,
  expense?: Expense,
): FormState {
  if (expense) {
    return {
      quickText: "",
      description: expense.description,
      amount: (expense.originalAmountCents / 100).toFixed(2),
      currency: expense.originalCurrency,
      paidById: expense.paidById,
      included: expense.splits.map((s) => s.userId),
    };
  }
  return {
    quickText: "",
    description: "",
    amount: "",
    currency: "USD",
    paidById: currentUserId,
    included: members.map((m) => m.id),
  };
}

function isValid(form: FormState): boolean {
  const amount = Number(form.amount);
  return (
    form.description.trim().length > 0 &&
    /^\d+(\.\d{1,2})?$/.test(form.amount) &&
    amount > 0 &&
    form.included.length > 0
  );
}

// One component serves add AND edit: passing `expense` switches to edit mode.
export function ExpenseModal({
  members,
  currentUserId,
  expense,
}: {
  members: Member[];
  currentUserId: string;
  expense?: Expense;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    initialState(members, currentUserId, expense),
  );
  const save = useMockAction();
  const parse = useMockAction();

  const memberItems = members.map((m) => ({
    value: m.id,
    label: displayName(m, currentUserId),
  }));

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  // Populate on OPEN so a reopen after save shows fresh props, not mount-time
  // values.
  function handleOpenChange(next: boolean) {
    if (next) setForm(initialState(members, currentUserId, expense));
    setOpen(next);
  }

  function toggleMember(id: string, checked: boolean) {
    patch({
      included: checked
        ? [...form.included, id]
        : form.included.filter((x) => x !== id),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {expense ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${expense.description}`}
            />
          }
        >
          <PencilIcon />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button type="button" />}>
          <PlusIcon />
          Add expense
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit expense" : "Add an expense"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.run(() => setOpen(false));
          }}
        >
          <div className="grid gap-2 rounded-lg bg-primary/5 p-3">
            <Label htmlFor="quick-add">✨ Quick add with AI</Label>
            <div className="flex gap-2">
              <Input
                id="quick-add"
                value={form.quickText}
                onChange={(e) => patch({ quickText: e.target.value })}
                placeholder='e.g. "dinner in Tokyo 4500 yen"'
              />
              <Button
                type="button"
                variant="outline"
                disabled={parse.pending || !form.quickText.trim()}
                onClick={() => parse.run()}
              >
                {parse.pending ? "Parsing…" : "Parse"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Dinner at the beach shack"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="expense-amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => patch({ amount: e.target.value })}
                placeholder="120.00"
              />
              <Select
                items={CURRENCY_ITEMS}
                value={form.currency}
                onValueChange={(v) => v && patch({ currency: v })}
              >
                <SelectTrigger aria-label="Currency" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_ITEMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-1 text-base">
            <span>Paid by</span>
            <Select
              items={memberItems}
              value={form.paidById}
              onValueChange={(v) => v && patch({ paidById: v })}
            >
              <SelectTrigger aria-label="Paid by" className={PILL_TRIGGER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {memberItems.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>and split</span>
            <Select items={SPLIT_ITEMS} defaultValue="equally">
              <SelectTrigger aria-label="Split method" className={PILL_TRIGGER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPLIT_ITEMS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ul className="divide-y rounded-lg border">
            {members.map((m) => (
              <li key={m.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                  <Checkbox
                    checked={form.included.includes(m.id)}
                    onCheckedChange={(checked) => toggleMember(m.id, checked)}
                  />
                  <MemberAvatar member={m} className="size-7" />
                  <span>{displayName(m, currentUserId)}</span>
                </label>
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.pending || !isValid(form)}>
              {save.pending
                ? "Saving…"
                : expense
                  ? "Save changes"
                  : "Save expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
