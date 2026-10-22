import { HandCoinsIcon } from "lucide-react";
import { deleteExpense } from "@/app/actions/expenses";
import { deleteSettlement } from "@/app/actions/settlements";
import { DeleteRowButton } from "@/components/delete-row-button";
import { ExpenseModal } from "@/components/expense-modal";
import {
  formatCents,
  formatShortDate,
  formatUsd,
  type Display,
} from "@/lib/format";
import { displayName, memberById } from "@/lib/members";
import type { Expense, Member, Settlement } from "@/lib/types";

type Item =
  | { kind: "expense"; at: Date; expense: Expense }
  | { kind: "settlement"; at: Date; settlement: Settlement };

// Every record that feeds the balance math appears here and can be removed.
export function ActivityList({
  groupId,
  display,
  expenses,
  settlements,
  members,
  currentUserId,
}: {
  groupId: string;
  display: Display;
  expenses: Expense[];
  settlements: Settlement[];
  members: Member[];
  currentUserId: string;
}) {
  const items: Item[] = [
    ...expenses.map((expense): Item => ({
      kind: "expense",
      at: expense.createdAt,
      expense,
    })),
    ...settlements.map((settlement): Item => ({
      kind: "settlement",
      at: settlement.createdAt,
      settlement,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const name = (id: string) => {
    const member = memberById(members, id);
    return member ? displayName(member, currentUserId) : "Someone";
  };

  if (items.length === 0) {
    return <p className="text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="divide-y rounded-xl border">
      {items.map((item) => {
        if (item.kind === "settlement") {
          const s = item.settlement;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <HandCoinsIcon className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {name(s.fromUserId)} paid {name(s.toUserId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatUsd(s.amountCents, display)} ·{" "}
                  {formatShortDate(s.createdAt)}
                </p>
              </div>
              <DeleteRowButton
                label="Delete payment"
                action={deleteSettlement.bind(null, groupId, s.id)}
              />
            </li>
          );
        }

        const e = item.expense;
        const yourShare =
          e.splits.find((s) => s.userId === currentUserId)?.amountCents ?? 0;
        // Show the display-currency equivalent unless it IS the entered currency.
        const showEquivalent = e.originalCurrency !== display.currency;
        return (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.description}</p>
              <p className="text-sm text-muted-foreground">
                {name(e.paidById)} paid{" "}
                {formatCents(e.originalAmountCents, e.originalCurrency)}
                {showEquivalent
                  ? ` (≈ ${formatUsd(e.amountCents, display)})`
                  : ""}{" "}
                · {formatShortDate(e.createdAt)}
              </p>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              your share {formatUsd(yourShare, display)}
            </span>
            <ExpenseModal
              groupId={groupId}
              members={members}
              currentUserId={currentUserId}
              expense={e}
            />
            <DeleteRowButton
              label={`Delete ${e.description}`}
              action={deleteExpense.bind(null, groupId, e.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
