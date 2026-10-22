import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeSplits,
  defaultSplitValues,
  formatBp,
  formatCentsInput,
  inferSplitMode,
  parsePercentToBp,
  type SplitInput,
} from "./splits.ts";

const percent = (...pairs: [string, string][]): SplitInput => ({
  mode: "percent",
  entries: pairs.map(([userId, value]) => ({ userId, value })),
});
const exact = (...pairs: [string, string][]): SplitInput => ({
  mode: "exact",
  entries: pairs.map(([userId, value]) => ({ userId, value })),
});
const amounts = (r: ReturnType<typeof computeSplits>) =>
  Array.isArray(r) ? r.map((s) => s.amountCents) : r;

describe("parsing and formatting", () => {
  it("parsePercentToBp", () => {
    assert.equal(parsePercentToBp("33.33"), 3333);
    assert.equal(parsePercentToBp("50"), 5000);
    assert.equal(parsePercentToBp("100"), 10000);
    assert.equal(parsePercentToBp("0.01"), 1);
    for (const bad of [
      "",
      "0",
      "0.00",
      "100.01",
      "101",
      "-5",
      "1.234",
      "abc",
      "5%",
    ]) {
      assert.equal(parsePercentToBp(bad), null, bad);
    }
  });
  it("formatBp / formatCentsInput", () => {
    assert.equal(formatBp(3333), "33.33");
    assert.equal(formatBp(5000), "50");
    assert.equal(formatBp(10000), "100");
    assert.equal(formatBp(3330), "33.3");
    assert.equal(formatCentsInput(1250), "12.50");
    assert.equal(formatCentsInput(7), "0.07");
    assert.equal(formatCentsInput(12000), "120.00");
  });
});

describe("percent splits", () => {
  it("33.33 / 33.33 / 33.34 of $100.00", () => {
    const r = computeSplits(
      10000,
      percent(["a", "33.33"], ["b", "33.33"], ["c", "33.34"]),
    );
    assert.deepEqual(amounts(r), [3333, 3333, 3334]);
  });
  it("largest remainder keeps the total exact ($10.00 at 33.33/33.33/33.34)", () => {
    const r = computeSplits(
      1000,
      percent(["a", "33.33"], ["b", "33.33"], ["c", "33.34"]),
    );
    assert.deepEqual(amounts(r), [333, 333, 334]);
  });
  it("70 / 30 of $0.99 → 69 + 30", () => {
    // 99*0.7 = 69.3, 99*0.3 = 29.7 → floors 69 + 29, leftover goes to the .7
    assert.deepEqual(
      amounts(computeSplits(99, percent(["a", "70"], ["b", "30"]))),
      [69, 30],
    );
  });
  it("rejects bad sums and bad values", () => {
    assert.deepEqual(
      computeSplits(1000, percent(["a", "50"], ["b", "49.99"])),
      {
        error: "Percentages must add up to 100%",
      },
    );
    assert.deepEqual(computeSplits(1000, percent(["a", "50"], ["b", ""])), {
      error: "Enter a percentage for each member",
    });
    assert.deepEqual(computeSplits(1000, percent(["a", "100"], ["b", "0"])), {
      error: "Enter a percentage for each member",
    });
  });
  it("rejects shares that round to zero cents", () => {
    assert.deepEqual(computeSplits(1, percent(["a", "50"], ["b", "50"])), {
      error: "Amount is too small to split that way",
    });
  });
});

describe("exact splits", () => {
  it("accepts amounts that add up exactly", () => {
    assert.deepEqual(
      amounts(computeSplits(1000, exact(["a", "6.50"], ["b", "3.50"]))),
      [650, 350],
    );
  });
  it("rejects under / over / blank", () => {
    assert.deepEqual(computeSplits(1000, exact(["a", "6.50"], ["b", "3.49"])), {
      error: "Amounts must add up to the total",
    });
    assert.deepEqual(computeSplits(1000, exact(["a", "6.50"], ["b", "3.51"])), {
      error: "Amounts must add up to the total",
    });
    assert.deepEqual(computeSplits(1000, exact(["a", "10"], ["b", ""])), {
      error: "Enter an amount for each member",
    });
    assert.deepEqual(computeSplits(1000, exact(["a", "10"], ["b", "0"])), {
      error: "Enter an amount for each member",
    });
  });
});

describe("equal splits", () => {
  it("still sums exactly and rejects empty / sub-cent", () => {
    assert.deepEqual(
      amounts(computeSplits(1000, { mode: "equal", userIds: ["a", "b", "c"] })),
      [334, 333, 333],
    );
    assert.deepEqual(computeSplits(1000, { mode: "equal", userIds: [] }), {
      error: "Select at least one member",
    });
    assert.deepEqual(
      computeSplits(2, { mode: "equal", userIds: ["a", "b", "c"] }),
      {
        error: "Amount is too small to split that way",
      },
    );
  });
});

describe("edit-form helpers", () => {
  it("inferSplitMode: equal-ish shares reopen as equal, others as exact", () => {
    assert.equal(
      inferSplitMode([
        { userId: "a", amountCents: 334 },
        { userId: "b", amountCents: 333 },
        { userId: "c", amountCents: 333 },
      ]),
      "equal",
    );
    // the extra cent can sit on any member and still count as equal
    assert.equal(
      inferSplitMode([
        { userId: "a", amountCents: 333 },
        { userId: "b", amountCents: 333 },
        { userId: "c", amountCents: 334 },
      ]),
      "equal",
    );
    assert.equal(
      inferSplitMode([
        { userId: "a", amountCents: 700 },
        { userId: "b", amountCents: 300 },
      ]),
      "exact",
    );
  });
  it("defaultSplitValues start from a valid equal split", () => {
    const pct = defaultSplitValues("percent", ["a", "b", "c"], 1000);
    assert.deepEqual(pct, { a: "33.34", b: "33.33", c: "33.33" });
    assert.ok(
      Array.isArray(computeSplits(1000, percent(...Object.entries(pct)))),
    );
    const ex = defaultSplitValues("exact", ["a", "b", "c"], 1000);
    assert.deepEqual(ex, { a: "3.34", b: "3.33", c: "3.33" });
    assert.ok(Array.isArray(computeSplits(1000, exact(...Object.entries(ex)))));
    // zero-decimal currency (¥1,000 = 100000 hundredths) splits in whole units
    assert.deepEqual(defaultSplitValues("exact", ["a", "b", "c"], 100000, 0), {
      a: "334",
      b: "333",
      c: "333",
    });
    assert.deepEqual(defaultSplitValues("exact", ["a"], null), {});
    assert.deepEqual(defaultSplitValues("equal", ["a"], 1000), {});
  });
});

// Seeded PRNG so a failure is reproducible.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("fuzz: shares always sum exactly", () => {
  const rand = mulberry32(20261021);
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rand() * (hi - lo + 1));

  for (let run = 0; run < 1500; run++) {
    it(`run ${run}`, () => {
      const n = int(1, 9);
      const ids = Array.from({ length: n }, (_, i) => `u${i}`);
      const total = int(1, 1_000_000_000); // up to $10M

      // n positive basis-point values summing to exactly 10,000
      const cuts = new Set<number>();
      while (cuts.size < n - 1) cuts.add(int(1, 9_999));
      const edges = [0, ...[...cuts].sort((a, b) => a - b), 10_000];
      const bps = edges.slice(1).map((e, i) => e - edges[i]);

      const r = computeSplits(
        total,
        percent(
          ...ids.map((id, i): [string, string] => [id, formatBp(bps[i])]),
        ),
      );
      if (Array.isArray(r)) {
        assert.equal(
          r.reduce((s, x) => s + x.amountCents, 0),
          total,
        );
        for (const s of r) {
          assert.ok(Number.isInteger(s.amountCents) && s.amountCents >= 1);
        }
        // largest remainder: nobody is more than 1 cent from their exact share
        r.forEach((s, i) => {
          const exactShare = (total * bps[i]) / 10_000;
          assert.ok(Math.abs(s.amountCents - exactShare) < 1);
        });
      } else {
        // only legitimate failure: some share rounded to zero cents
        assert.equal(r.error, "Amount is too small to split that way");
        assert.ok(total * Math.min(...bps) < 10_000 * 2);
      }

      // Equal splits round-trip through inferSplitMode.
      const eq = computeSplits(total, { mode: "equal", userIds: ids });
      if (Array.isArray(eq)) assert.equal(inferSplitMode(eq), "equal");
    });
  }
});
