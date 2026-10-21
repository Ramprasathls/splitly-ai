import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simplifyDebts } from "./simplify-debts.ts";

const balances = (entries: Record<string, number>) =>
  new Map(Object.entries(entries));

describe("worked examples", () => {
  it("A owes B $10, B owes C $10 ⇒ A owes C $10", () => {
    // A −10, B 0 (owed 10, owes 10), C +10
    const debts = simplifyDebts(balances({ A: -1000, B: 0, C: 1000 }));
    assert.deepEqual(debts, [
      { fromUserId: "A", toUserId: "C", amountCents: 1000 },
    ]);
  });

  it("+30 +10 −10 −30 settles in 2 payments", () => {
    const debts = simplifyDebts(balances({ P: 30, Q: 10, R: -10, S: -30 }));
    assert.deepEqual(debts, [
      { fromUserId: "S", toUserId: "P", amountCents: 30 },
      { fromUserId: "R", toUserId: "Q", amountCents: 10 },
    ]);
  });

  it("+50 +20 −30 −40 hits the n−1 bound (3 payments)", () => {
    const debts = simplifyDebts(balances({ A: 50, B: 20, C: -30, D: -40 }));
    assert.deepEqual(debts, [
      { fromUserId: "D", toUserId: "A", amountCents: 40 },
      { fromUserId: "C", toUserId: "B", amountCents: 20 },
      { fromUserId: "C", toUserId: "A", amountCents: 10 },
    ]);
  });

  it("everyone settled → no payments", () => {
    assert.deepEqual(simplifyDebts(balances({ A: 0, B: 0 })), []);
    assert.deepEqual(simplifyDebts(new Map()), []);
  });

  it("ties are broken by id", () => {
    const debts = simplifyDebts(balances({ b: 10, a: 10, y: -10, x: -10 }));
    assert.deepEqual(debts, [
      { fromUserId: "x", toUserId: "a", amountCents: 10 },
      { fromUserId: "y", toUserId: "b", amountCents: 10 },
    ]);
  });
});

describe("invalid input", () => {
  it("throws when balances don't sum to zero", () => {
    assert.throws(
      () => simplifyDebts(balances({ A: 100, B: -99 })),
      /sum to zero/,
    );
  });

  it("throws on fractional cents", () => {
    assert.throws(
      () => simplifyDebts(balances({ A: 0.5, B: -0.5 })),
      /integer/,
    );
  });
});

// Small seeded PRNG so a failure is reproducible.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("fuzz: 2,000 random groups", () => {
  const rand = mulberry32(20261020);
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rand() * (hi - lo + 1));

  for (let run = 0; run < 2000; run++) {
    it(`run ${run}`, () => {
      const n = int(2, 12);
      const ids = Array.from({ length: n }, (_, i) => `u${i}`);
      const entries: [string, number][] = ids.map((id) => [
        id,
        rand() < 0.2 ? 0 : int(-500_000, 500_000),
      ]);
      // Force the zero-sum invariant the real ledger guarantees.
      const sum = entries.reduce((s, [, v]) => s + v, 0);
      entries[n - 1][1] -= sum;

      const input = new Map(entries);
      const debts = simplifyDebts(input);

      // 1. At most (members with a non-zero balance) − 1 payments.
      const nonZero = entries.filter(([, v]) => v !== 0).length;
      assert.ok(debts.length <= Math.max(nonZero - 1, 0));

      // 2. Applying every payment takes every balance to exactly zero.
      const after = new Map(input);
      for (const d of debts) {
        after.set(d.fromUserId, after.get(d.fromUserId)! + d.amountCents);
        after.set(d.toUserId, after.get(d.toUserId)! - d.amountCents);
      }
      for (const v of after.values()) assert.equal(v, 0);

      // 3. Every amount is a positive integer; nobody pays themselves.
      for (const d of debts) {
        assert.ok(Number.isInteger(d.amountCents) && d.amountCents > 0);
        assert.notEqual(d.fromUserId, d.toUserId);
      }

      // 4. Direction is right and nobody both pays and receives.
      const payers = new Set(debts.map((d) => d.fromUserId));
      const receivers = new Set(debts.map((d) => d.toUserId));
      for (const p of payers) {
        assert.ok(input.get(p)! < 0);
        assert.ok(!receivers.has(p));
      }
      for (const r of receivers) assert.ok(input.get(r)! > 0);

      // 5. Same balances in a different map order → identical output.
      const shuffled = [...entries].sort(() => rand() - 0.5);
      assert.deepEqual(simplifyDebts(new Map(shuffled)), debts);
    });
  }
});
