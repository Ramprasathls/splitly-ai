import { ArrowRightIcon } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatars";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/format";
import { simplifyDebts } from "@/lib/simplify-debts";
import type { Member } from "@/lib/types";

// The pitch, rendered with the product's own algorithm: five messy IOUs go in,
// simplifyDebts() decides what comes out. Nothing below the IOU list is
// hard-coded.
const PEOPLE: Record<string, Member> = {
  maya: { id: "maya", name: "Maya", email: "" },
  ben: { id: "ben", name: "Ben", email: "" },
  priya: { id: "priya", name: "Priya", email: "" },
  sam: { id: "sam", name: "Sam", email: "" },
};

// [debtor, creditor, cents]
const IOUS: [string, string, number][] = [
  ["maya", "ben", 1000],
  ["ben", "priya", 1600],
  ["sam", "priya", 600],
  ["maya", "priya", 800],
  ["sam", "ben", 600],
];

function compute() {
  const balances = new Map<string, number>(
    Object.keys(PEOPLE).map((id) => [id, 0]),
  );
  for (const [from, to, cents] of IOUS) {
    balances.set(from, (balances.get(from) ?? 0) - cents);
    balances.set(to, (balances.get(to) ?? 0) + cents);
  }
  const settled = [...balances]
    .filter(([, net]) => net === 0)
    .map(([id]) => id);
  return { payments: simplifyDebts(balances), settled };
}

function Row({
  from,
  to,
  cents,
  strong = false,
}: {
  from: string;
  to: string;
  cents: number;
  strong?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <MemberAvatar member={PEOPLE[from]} className="size-6 text-xs" />
      <span
        className={
          strong ? "flex-1 font-medium" : "flex-1 text-muted-foreground"
        }
      >
        {PEOPLE[from].name} owes {PEOPLE[to].name}
      </span>
      {/* emerald = money owed to someone: only on the settled-up amounts */}
      <span
        className={
          strong ? "font-semibold text-emerald-600" : "text-muted-foreground"
        }
      >
        {formatCents(cents)}
      </span>
    </li>
  );
}

export function DebtProof() {
  const { payments, settled } = compute();

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:gap-8">
      <Card className="w-full gap-0 py-0 transition-transform duration-300 hover:-translate-y-1 hover:rotate-0 md:-rotate-2">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-medium">After the trip</h3>
          <Badge variant="secondary">{IOUS.length} IOUs</Badge>
        </div>
        <ul className="divide-y border-t">
          {IOUS.map(([from, to, cents], i) => (
            <Row key={i} from={from} to={to} cents={cents} />
          ))}
        </ul>
      </Card>

      <ArrowRightIcon
        aria-hidden
        className="size-7 shrink-0 rotate-90 text-primary md:rotate-0"
      />

      <Card className="w-full gap-0 py-0 transition-transform duration-300 hover:-translate-y-1 hover:rotate-0 md:rotate-2">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-medium">With Splitly</h3>
          <Badge>{payments.length} payments</Badge>
        </div>
        <ul className="divide-y border-t">
          {payments.map((p) => (
            <Row
              key={`${p.fromUserId}-${p.toUserId}`}
              from={p.fromUserId}
              to={p.toUserId}
              cents={p.amountCents}
              strong
            />
          ))}
          {settled.map((id) => (
            <li key={id} className="px-4 py-2.5 text-muted-foreground">
              {PEOPLE[id].name} owes nothing at all
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
