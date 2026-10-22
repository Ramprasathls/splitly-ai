import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ActivityList } from "@/components/activity-list";
import { BalancePill } from "@/components/balance-pill";
import { CurrencySelect } from "@/components/currency-select";
import { DebtsCard } from "@/components/debts-card";
import { ExpenseModal } from "@/components/expense-modal";
import { MemberAvatars } from "@/components/member-avatars";
import { MembersList } from "@/components/members-list";
import { Separator } from "@/components/ui/separator";
import { ensureUser } from "@/lib/ensure-user";
import { getGroupDetail } from "@/lib/queries";
import { getDisplay } from "@/lib/rates";

export default async function GroupPage({
  params,
  searchParams,
}: PageProps<"/groups/[groupId]">) {
  const { userId } = await auth.protect();
  await ensureUser();
  const { groupId } = await params;
  const display = await getDisplay((await searchParams).currency);
  const group = await getGroupDetail(userId, groupId);
  if (!group) notFound();

  const currentUserId = userId;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{group.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <MemberAvatars members={group.members} />
            <BalancePill cents={group.yourBalanceCents} display={display} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySelect
            value={display.currency}
            basePath={`/groups/${group.id}`}
          />
          <ExpenseModal
            aiEnabled={Boolean(process.env.GEMINI_API_KEY)}
            groupId={group.id}
            members={group.members}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="mb-3 text-xl font-medium">Activity</h2>
          <ActivityList
            groupId={group.id}
            display={display}
            expenses={group.expenses}
            settlements={group.settlements}
            members={group.members}
            currentUserId={currentUserId}
          />
        </section>

        <aside>
          <h2 className="mb-3 text-xl font-medium">Who owes whom</h2>
          <DebtsCard
            groupId={group.id}
            display={display}
            debts={group.simplifiedDebts}
            members={group.members}
            currentUserId={currentUserId}
          />
          <Separator className="my-8" />
          <h2 className="mb-3 text-xl font-medium">Members</h2>
          <MembersList
            groupId={group.id}
            members={group.members}
            currentUserId={currentUserId}
          />
        </aside>
      </div>
    </main>
  );
}
