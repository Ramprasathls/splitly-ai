import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BalancePill } from "@/components/balance-pill";
import { CreateGroupForm } from "@/components/create-group-form";
import { CurrencySelect } from "@/components/currency-select";
import { MemberAvatars } from "@/components/member-avatars";
import { Card } from "@/components/ui/card";
import { ensureUser } from "@/lib/ensure-user";
import { formatUsd } from "@/lib/format";
import { getGroups } from "@/lib/queries";
import { getDisplay } from "@/lib/rates";

export const metadata = { title: "Dashboard · Splitly" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string | string[] }>;
}) {
  const { userId } = await auth.protect();
  const user = await ensureUser();
  const [groups, display] = await Promise.all([
    getGroups(userId),
    searchParams.then((p) => getDisplay(p.currency)),
  ]);
  // Group links carry the display currency through.
  const query =
    display.currency === "USD" ? "" : `?currency=${display.currency}`;

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
          Welcome back, {user?.name.split(" ")[0] ?? "there"} 👋
        </h1>
        <CurrencySelect value={display.currency} basePath="/dashboard" />
      </div>

      <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
        <Card className="gap-1 px-5 py-4">
          <p className="text-muted-foreground">You are owed</p>
          <p className="text-3xl font-semibold text-emerald-600">
            {formatUsd(owed, display)}
          </p>
        </Card>
        <Card className="gap-1 px-5 py-4">
          <p className="text-muted-foreground">You owe</p>
          <p className="text-3xl font-semibold text-rose-600">
            {formatUsd(owe, display)}
          </p>
        </Card>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-medium">Your groups</h2>
        <CreateGroupForm />
      </div>

      {groups.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No groups yet.</p>
      ) : null}

      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link href={`/groups/${g.id}${query}`} className="block">
              <Card className="gap-4 px-5 py-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{g.name}</h3>
                  <BalancePill cents={g.yourBalanceCents} display={display} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <MemberAvatars members={g.members} />
                  <span className="text-muted-foreground">
                    {formatUsd(g.totalCents, display)} total
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
