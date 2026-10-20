import type { Member } from "./types";

/** Names, never ids — the current user reads as "You". */
export function displayName(member: Member, currentUserId: string): string {
  return member.id === currentUserId ? "You" : member.name;
}

export function memberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function initial(member: Member): string {
  return member.name.trim().charAt(0).toUpperCase();
}
