import { Badge } from "@/components/ui/badge";
import { formatUsd, type Display } from "@/lib/format";

// emerald = money owed to you, rose = money you owe (money only — see rules).
export function BalancePill({
  cents,
  display,
}: {
  cents: number;
  display: Display;
}) {
  if (cents === 0) return <Badge variant="secondary">settled up</Badge>;
  if (cents > 0) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/50 text-emerald-600"
      >
        you are owed {formatUsd(cents, display)}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rose-500/50 text-rose-600">
      you owe {formatUsd(-cents, display)}
    </Badge>
  );
}
