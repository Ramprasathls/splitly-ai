"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockAction } from "@/components/use-mock-action";

export function CreateGroupForm() {
  const [name, setName] = useState("");
  const { pending, run } = useMockAction();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setName(""));
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
