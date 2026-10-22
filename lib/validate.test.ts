import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isId } from "./validate.ts";

describe("isId", () => {
  it("accepts real ids (cuid, Clerk user ids)", () => {
    assert.ok(isId("cmvh03f8t0000abcdefghijkl"));
    assert.ok(isId("user_2abCdEfGhIjKlMnOpQrStUvWxYz"));
  });
  it("rejects objects that Prisma would treat as filters", () => {
    for (const hostile of [
      { not: "" },
      { contains: "" },
      { in: ["a", "b"] },
      { startsWith: "" },
      { gte: "" },
      [],
      ["a"],
    ]) {
      assert.equal(isId(hostile), false, JSON.stringify(hostile));
    }
  });
  it("rejects non-strings, empty and oversized values", () => {
    for (const bad of [undefined, null, 0, 1, true, "", "x".repeat(129)]) {
      assert.equal(isId(bad), false, String(bad));
    }
  });
});
