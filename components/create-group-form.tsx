"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGroup } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createGroup(name);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success("Group created");
          setName("");
          router.push(`/groups/${result.groupId}`);
        });
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New group name…"
        aria-label="New group name"
        className="w-56"
      />
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "Create group"}
      </Button>
    </form>
  );
}
