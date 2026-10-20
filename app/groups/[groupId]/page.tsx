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
import { MOCK_CURRENT_USER_ID } from "@/lib/mock-data";
import { getGroupDetail } from "@/lib/queries";

export default async function GroupPage({
  params,
}: PageProps<"/groups/[groupId]">) {
  const { userId } = await auth.protect();
  const { groupId } = await params;
  const group = await getGroupDetail(userId, groupId);
  if (!group) notFound();

  // Phase 3 replaces this with the Clerk userId (members are real rows then).
  const currentUserId = MOCK_CURRENT_USER_ID;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{group.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <MemberAvatars members={group.members} />
            <BalancePill cents={group.yourBalanceCents} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySelect />
          <ExpenseModal members={group.members} currentUserId={currentUserId} />
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="mb-3 text-xl font-medium">Activity</h2>
          <ActivityList
            expenses={group.expenses}
            settlements={group.settlements}
            members={group.members}
            currentUserId={currentUserId}
          />
        </section>

        <aside>
          <h2 className="mb-3 text-xl font-medium">Who owes whom</h2>
          <DebtsCard
            debts={group.simplifiedDebts}
            members={group.members}
            currentUserId={currentUserId}
          />
          <Separator className="my-8" />
          <h2 className="mb-3 text-xl font-medium">Members</h2>
          <MembersList members={group.members} currentUserId={currentUserId} />
        </aside>
      </div>
    </main>
  );
}
