"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockAction } from "@/components/use-mock-action";

export function AddMemberForm() {
  const [email, setEmail] = useState("");
  const { pending, run } = useMockAction();

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setEmail(""));
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
