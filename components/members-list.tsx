import { AddMemberForm } from "@/components/add-member-form";
import { MemberAvatar } from "@/components/member-avatars";
import { displayName } from "@/lib/members";
import type { Member } from "@/lib/types";

export function MembersList({
  groupId,
  members,
  currentUserId,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
}) {
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <MemberAvatar member={m} className="size-8" />
            <span className="font-medium">{displayName(m, currentUserId)}</span>
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {m.email}
            </span>
          </li>
        ))}
      </ul>
      <AddMemberForm groupId={groupId} />
    </div>
  );
}
