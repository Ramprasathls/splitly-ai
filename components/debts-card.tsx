import { settleUp } from "@/app/actions/settlements";
import { SettleUpButton } from "@/components/settle-up-button";
import { formatUsd, type Display } from "@/lib/format";
import { displayName, memberById } from "@/lib/members";
import type { Member, SimplifiedDebt } from "@/lib/types";

export function DebtsCard({
  groupId,
  display,
  debts,
  members,
  currentUserId,
}: {
  groupId: string;
  display: Display;
  debts: SimplifiedDebt[];
  members: Member[];
  currentUserId: string;
}) {
  const name = (id: string) => {
    const member = memberById(members, id);
    return member ? displayName(member, currentUserId) : "Someone";
  };

  if (debts.length === 0) {
    return <p className="text-muted-foreground">Everyone is settled up.</p>;
  }

  return (
    <ul className="divide-y rounded-xl border">
      {debts.map((d) => {
        const involvesYou =
          d.fromUserId === currentUserId || d.toUserId === currentUserId;
        const amountTone =
          d.toUserId === currentUserId
            ? "text-emerald-600"
            : d.fromUserId === currentUserId
              ? "text-rose-600"
              : "text-muted-foreground";
        return (
          <li
            key={`${d.fromUserId}-${d.toUserId}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <p className="min-w-0 flex-1">
              <span className="font-semibold">{name(d.fromUserId)}</span> owes{" "}
              <span className="font-semibold">{name(d.toUserId)}</span>
            </p>
            <span className={`font-medium ${amountTone}`}>
              {formatUsd(d.amountCents, display)}
            </span>
            {involvesYou ? (
              <SettleUpButton
                action={settleUp.bind(
                  null,
                  groupId,
                  d.fromUserId,
                  d.toUserId,
                  d.amountCents,
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
