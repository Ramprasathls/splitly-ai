"use client";

import { useState, useTransition } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { addExpense, updateExpense } from "@/app/actions/expenses";
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
import { CURRENCIES, currencyDecimals } from "@/lib/currencies";
import { reconstructShares } from "@/lib/fx";
import { formatCents } from "@/lib/format";
import { displayName } from "@/lib/members";
import { parseAmountToCents } from "@/lib/money";
import {
  computeSplits,
  defaultSplitValues,
  formatBp,
  formatCentsInput,
  inferSplitMode,
  parsePercentToBp,
  type SplitInput,
  type SplitMode,
} from "@/lib/splits";
import type { Expense, Member } from "@/lib/types";

type FormState = {
  description: string;
  amount: string;
  currency: string;
  paidById: string;
  mode: SplitMode;
  /** Checked members. */
  included: string[];
  /** Per-member text for the active mode: a percentage or an amount. */
  values: Record<string, string>;
};

const CURRENCY_ITEMS = CURRENCIES.map((c) => ({ value: c, label: c }));
const SPLIT_ITEMS: { value: SplitMode; label: string }[] = [
  { value: "equal", label: "equally" },
  { value: "percent", label: "by percentages" },
  { value: "exact", label: "by exact amounts" },
];

// Pill-style selects used inside the "Paid by … and split …" sentence.
const PILL_TRIGGER =
  "h-auto w-auto gap-1 border-0 bg-transparent px-1 py-0.5 text-base font-medium text-primary shadow-none dark:bg-transparent dark:hover:bg-transparent";

function initialState(
  members: Member[],
  currentUserId: string,
  expense?: Expense,
): FormState {
  if (expense) {
    // Stored splits are USD; rebuild the shares in the ENTERED currency (same
    // proportional exact-sum math as entry). Equal-ish splits reopen as
    // "equally"; anything else as exact amounts.
    const decimals = currencyDecimals(expense.originalCurrency);
    const entered = reconstructShares(
      expense.originalAmountCents,
      expense.splits,
      decimals,
    );
    const mode = inferSplitMode(entered);
    return {
      description: expense.description,
      amount: formatCentsInput(expense.originalAmountCents, decimals),
      currency: expense.originalCurrency,
      paidById: expense.paidById,
      mode,
      included: entered.map((s) => s.userId),
      values:
        mode === "exact"
          ? Object.fromEntries(
              entered.map((s) => [
                s.userId,
                formatCentsInput(s.amountCents, decimals),
              ]),
            )
          : {},
    };
  }
  return {
    description: "",
    amount: "",
    currency: "USD",
    paidById: currentUserId,
    mode: "equal",
    included: members.map((m) => m.id),
    values: {},
  };
}

// One component serves add AND edit: passing `expense` switches to edit mode.
export function ExpenseModal({
  groupId,
  members,
  currentUserId,
  expense,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  expense?: Expense;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    initialState(members, currentUserId, expense),
  );
  const [pending, startTransition] = useTransition();

  const memberItems = members.map((m) => ({
    value: m.id,
    label: displayName(m, currentUserId),
  }));

  // Members in group order, so the same inputs always produce the same shares.
  const included = members
    .filter((m) => form.included.includes(m.id))
    .map((m) => m.id);
  const decimals = currencyDecimals(form.currency);
  const amountCents = parseAmountToCents(form.amount, decimals);

  const splitInput: SplitInput =
    form.mode === "equal"
      ? { mode: "equal", userIds: included }
      : {
          mode: form.mode,
          entries: included.map((userId) => ({
            userId,
            value: form.values[userId] ?? "",
          })),
        };

  // The same function the server runs; the server stays the authority.
  const result =
    amountCents !== null && included.length > 0
      ? computeSplits(amountCents, splitInput)
      : null;
  const shares = result && Array.isArray(result) ? result : null;
  const shareOf = (id: string) =>
    shares?.find((s) => s.userId === id)?.amountCents;

  // Actionable validation only — no explainer copy.
  let hint: string | null = null;
  if (form.mode === "percent") {
    const sum = included.reduce(
      (s, id) => s + (parsePercentToBp(form.values[id] ?? "") ?? 0),
      0,
    );
    if (sum !== 10_000) hint = `Percentages add up to ${formatBp(sum)}%`;
  } else if (form.mode === "exact" && amountCents !== null) {
    const assigned = included.reduce(
      (s, id) => s + (parseAmountToCents(form.values[id] ?? "", 2) ?? 0),
      0,
    );
    const left = amountCents - assigned;
    if (left > 0) hint = `${formatCents(left, form.currency)} left to assign`;
    if (left < 0) hint = `${formatCents(-left, form.currency)} over`;
  }
  if (!hint && result && "error" in result && amountCents !== null) {
    hint = result.error;
  }
  if (amountCents === null && decimals === 0 && form.amount.includes(".")) {
    hint = `${form.currency} has no decimals`;
  }

  const canSave =
    !pending && form.description.trim().length > 0 && shares !== null;

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  // Populate on OPEN so a reopen after save shows fresh props, not mount-time
  // values.
  function handleOpenChange(next: boolean) {
    if (next) setForm(initialState(members, currentUserId, expense));
    setOpen(next);
  }

  // Switching modes or who's included restarts from a valid equal split.
  function changeMode(mode: SplitMode) {
    patch({
      mode,
      values: defaultSplitValues(mode, included, amountCents, decimals),
    });
  }

  // Exact amounts restart from an equal split in the new currency's units.
  function changeCurrency(currency: string) {
    const nextDecimals = currencyDecimals(currency);
    patch({
      currency,
      values:
        form.mode === "exact"
          ? defaultSplitValues(
              "exact",
              included,
              parseAmountToCents(form.amount, nextDecimals),
              nextDecimals,
            )
          : form.values,
    });
  }

  function toggleMember(id: string, checked: boolean) {
    const next = checked
      ? [...form.included, id]
      : form.included.filter((x) => x !== id);
    const ordered = members.filter((m) => next.includes(m.id)).map((m) => m.id);
    patch({
      included: next,
      values: defaultSplitValues(form.mode, ordered, amountCents, decimals),
    });
  }

  function save() {
    const input = {
      description: form.description,
      amount: form.amount,
      currency: form.currency,
      paidById: form.paidById,
      split: splitInput,
    };
    startTransition(async () => {
      const result = expense
        ? await updateExpense(groupId, expense.id, input)
        : await addExpense(groupId, input);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(expense ? "Expense updated" : "Expense added");
      setOpen(false);
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
            save();
          }}
        >
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
                onValueChange={(v) => v && changeCurrency(v)}
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
            <Select
              items={SPLIT_ITEMS}
              value={form.mode}
              onValueChange={(v) => v && changeMode(v)}
            >
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

          <div className="grid gap-2">
            <ul className="divide-y rounded-lg border">
              {members.map((m) => {
                const name = displayName(m, currentUserId);
                const checked = form.included.includes(m.id);
                const share = shareOf(m.id);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-0.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => toggleMember(m.id, c)}
                      />
                      <MemberAvatar member={m} className="size-7" />
                      <span className="truncate">{name}</span>
                    </label>
                    {checked && form.mode === "equal" && share !== undefined ? (
                      <span className="text-sm text-muted-foreground">
                        {formatCents(share, form.currency)}
                      </span>
                    ) : null}
                    {checked && form.mode !== "equal" ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          inputMode="decimal"
                          aria-label={`${name} ${form.mode === "percent" ? "percentage" : "amount"}`}
                          value={form.values[m.id] ?? ""}
                          onChange={(e) =>
                            patch({
                              values: {
                                ...form.values,
                                [m.id]: e.target.value,
                              },
                            })
                          }
                          className="h-8 w-24 text-right"
                        />
                        <span className="w-8 text-sm text-muted-foreground">
                          {form.mode === "percent" ? "%" : form.currency}
                        </span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {hint ? (
              <p className="text-sm text-destructive" role="status">
                {hint}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {pending ? "Saving…" : expense ? "Save changes" : "Save expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
