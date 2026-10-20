import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { BalancePill } from "@/components/balance-pill";
import { CreateGroupForm } from "@/components/create-group-form";
import { CurrencySelect } from "@/components/currency-select";
import { MemberAvatars } from "@/components/member-avatars";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/format";
import { getGroups } from "@/lib/queries";

export const metadata = { title: "Dashboard · Splitly" };

export default async function DashboardPage() {
  const { userId } = await auth.protect();
  const [user, groups] = await Promise.all([currentUser(), getGroups(userId)]);

  const owed = groups.reduce(
    (sum, g) => sum + Math.max(g.yourBalanceCents, 0),
    0,
  );
  const owe = groups.reduce(
    (sum, g) => sum + Math.max(-g.yourBalanceCents, 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">
          Welcome back, {user?.firstName ?? "there"} 👋
        </h1>
        <CurrencySelect />
      </div>

      <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
        <Card className="gap-1 px-5 py-4">
          <p className="text-muted-foreground">You are owed</p>
          <p className="text-3xl font-semibold text-emerald-600">
            {formatCents(owed)}
          </p>
        </Card>
        <Card className="gap-1 px-5 py-4">
          <p className="text-muted-foreground">You owe</p>
          <p className="text-3xl font-semibold text-rose-600">
            {formatCents(owe)}
          </p>
        </Card>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-medium">Your groups</h2>
        <CreateGroupForm />
      </div>

      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link href={`/groups/${g.id}`} className="block">
              <Card className="gap-4 px-5 py-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{g.name}</h3>
                  <BalancePill cents={g.yourBalanceCents} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <MemberAvatars members={g.members} />
                  <span className="text-muted-foreground">
                    {formatCents(g.totalCents)} total
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
