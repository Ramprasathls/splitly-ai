"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addMember } from "@/app/actions/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await addMember(groupId, email);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Member added");
          setEmail("");
        });
      }}
    >
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="friend@example.com"
        aria-label="Member email"
      />
      <Button
        type="submit"
        variant="outline"
        disabled={pending || !email.trim()}
      >
        {pending ? "Adding…" : "Add member"}
      </Button>
    </form>
  );
}
