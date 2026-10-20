import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initial } from "@/lib/members";
import type { Member } from "@/lib/types";

export function MemberAvatar({
  member,
  className,
}: {
  member: Member;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {member.imageUrl ? (
        <AvatarImage src={member.imageUrl} alt={member.name} />
      ) : null}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initial(member)}
      </AvatarFallback>
    </Avatar>
  );
}

export function MemberAvatars({ members }: { members: Member[] }) {
  return (
    <div className="flex -space-x-2">
      {members.map((m) => (
        <MemberAvatar
          key={m.id}
          member={m}
          className="size-8 ring-2 ring-background"
        />
      ))}
    </div>
  );
}
