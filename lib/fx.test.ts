import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allocateProportionally,
  convertShares,
  fromUsdCents,
  reconstructShares,
  toUsdCents,
  wasEqualSplit,
} from "./fx.ts";
import { splitEqually } from "./money.ts";

describe("rate conversion", () => {
  it("toUsdCents / fromUsdCents round once", () => {
    // €89.00 at 0.89015 EUR per USD
    assert.equal(toUsdCents(8900, 0.89015), 9998);
    // ¥4,500 (450000 hundredths) at 157.88 JPY per USD
    assert.equal(toUsdCents(450000, 157.88), 2850);
    assert.equal(fromUsdCents(10000, 0.89015), 8902); // $100.00 → €89.02 (8901.5 rounds up)
    assert.equal(toUsdCents(12345, 1), 12345); // USD is identity
    assert.equal(fromUsdCents(12345, 1), 12345);
  });
});

describe("allocateProportionally", () => {
  it("splits evenly and by weight, summing exactly", () => {
    assert.deepEqual(allocateProportionally(1000, [1, 1, 1]), [334, 333, 333]);
    assert.deepEqual(allocateProportionally(1000, [7, 3]), [700, 300]);
    assert.deepEqual(allocateProportionally(99, [70, 30]), [69, 30]);
    assert.deepEqual(allocateProportionally(10, [0, 5, 5]), [0, 5, 5]);
  });
  it("rejects all-zero weights", () => {
    assert.throws(() => allocateProportionally(100, [0, 0]), /more than zero/);
  });
  it("doesn't overflow on very large amounts (BigInt)", () => {
    const parts = allocateProportionally(
      99_999_999_999,
      [99_999_999_999, 99_999_999_999, 99_999_999_999],
    );
    assert.equal(
      parts.reduce((s, p) => s + p, 0),
      99_999_999_999,
    );
    assert.deepEqual(parts, [33_333_333_333, 33_333_333_333, 33_333_333_333]);
  });
});

describe("convertShares", () => {
  it("€89.00 split 50.00 / 39.00 → USD shares summing to the USD total", () => {
    const usdTotal = toUsdCents(8900, 0.89015); // 9998
    const usd = convertShares(
      [
        { userId: "a", amountCents: 5000 },
        { userId: "b", amountCents: 3900 },
      ],
      usdTotal,
    );
    assert.equal(
      usd.reduce((s, x) => s + x.amountCents, 0),
      usdTotal,
    );
    assert.deepEqual(
      usd.map((s) => s.amountCents),
      [5617, 4381],
    );
  });
});

describe("reconstructShares (edit prefill)", () => {
  it("round-trips exactly when the rate is 1", () => {
    const orig = [
      { userId: "a", amountCents: 7000 },
      { userId: "b", amountCents: 3000 },
    ];
    assert.deepEqual(
      reconstructShares(10000, convertShares(orig, 10000), 2),
      orig,
    );
  });
  it("sums exactly to the entered total and stays close to the original", () => {
    const orig = [
      { userId: "a", amountCents: 5000 },
      { userId: "b", amountCents: 3900 },
    ];
    const usd = convertShares(orig, toUsdCents(8900, 0.89015));
    const back = reconstructShares(8900, usd, 2);
    assert.equal(
      back.reduce((s, x) => s + x.amountCents, 0),
      8900,
    );
    back.forEach((s, i) =>
      assert.ok(Math.abs(s.amountCents - orig[i].amountCents) <= 1),
    );
  });
  it("zero-decimal currencies come back in whole units", () => {
    const back = reconstructShares(
      450000, // ¥4,500
      [
        { userId: "a", amountCents: 1425 },
        { userId: "b", amountCents: 1425 },
      ],
      0,
    );
    assert.deepEqual(
      back.map((s) => s.amountCents),
      [225000, 225000],
    );
    for (const s of back) assert.equal(s.amountCents % 100, 0);
  });
});

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("fuzz: conversion always reconciles", () => {
  const rand = mulberry32(20261022);
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rand() * (hi - lo + 1));
  for (let run = 0; run < 1500; run++) {
    it(`run ${run}`, () => {
      const n = int(1, 8);
      const weights = Array.from({ length: n }, () => int(1, 5_000_000));
      const total = int(1, 99_999_999_999);
      const parts = allocateProportionally(total, weights);

      assert.equal(
        parts.reduce((s, p) => s + p, 0),
        total,
      );
      const sumW = weights.reduce((s, w) => s + w, 0);
      parts.forEach((p, i) => {
        // each part is within 1 unit of its exact proportional share
        assert.ok(Math.abs(p - (total * weights[i]) / sumW) < 1 + 1e-6 * total);
        assert.ok(Number.isInteger(p) && p >= 0);
      });
    });
  }
});

describe("wasEqualSplit (edit-form mode detection)", () => {
  // The cases the old "judge the rebuilt shares" approach got wrong (THB, INR).
  it("recognises equal splits in high-rate currencies", () => {
    const cases: [number, number[], 0 | 2][] = [
      [1216566, [7247, 7247, 7247, 7247, 7246], 2], // THB, 5 people
      [467846, [4645, 4645, 4644], 2], // THB, 3 people
      [1604219, [4821, 4820, 4820, 4820], 2], // INR, 4 people
    ];
    for (const [orig, usd, dec] of cases) {
      const shares = usd.map((amountCents, i) => ({
        userId: `u${i}`,
        amountCents,
      }));
      assert.equal(wasEqualSplit(orig, shares, dec), true, `${orig}`);
    }
  });
  it("recognises equal USD splits and tolerates reordered rows", () => {
    const shares = [
      { userId: "a", amountCents: 3334 },
      { userId: "b", amountCents: 3333 },
      { userId: "c", amountCents: 3333 },
    ];
    assert.equal(wasEqualSplit(10000, shares, 2), true);
    assert.equal(
      wasEqualSplit(10000, [shares[1], shares[2], shares[0]], 2),
      true,
    );
  });
  it("does not call an uneven split equal", () => {
    const uneven = [
      { userId: "a", amountCents: 7000 },
      { userId: "b", amountCents: 3000 },
    ];
    assert.equal(wasEqualSplit(10000, uneven, 2), false);
    assert.equal(wasEqualSplit(10000, [], 2), false);
  });
});

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("fuzz: equal splits entered in any currency reopen as equal", () => {
  // realistic units-per-USD rates, incl. the coarse ones (JPY, KRW, THB, INR)
  const RATES: [string, number, 0 | 2][] = [
    ["USD", 1, 2],
    ["EUR", 0.89015, 2],
    ["GBP", 0.74617, 2],
    ["CAD", 1.38, 2],
    ["CHF", 0.88, 2],
    ["THB", 33.575, 2],
    ["INR", 83.2, 2],
    ["JPY", 157.88, 0],
    ["KRW", 1325.57, 0],
  ];
  const rand = rng(20261023);
  const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

  for (let run = 0; run < 1500; run++) {
    it(`run ${run}`, () => {
      const [, rate, dec] = RATES[int(0, RATES.length - 1)];
      const unit = dec === 0 ? 100 : 1;
      const n = int(2, 8);
      const ids = Array.from({ length: n }, (_, k) => `u${k}`);
      const orig = int(1, dec === 0 ? 500000 : 3000000) * unit;
      const entered = splitEqually(Math.round(orig / unit), ids).map((s) => ({
        userId: s.userId,
        amountCents: s.amountCents * unit,
      }));
      const usdTotal = toUsdCents(orig, rate);
      const usd = convertShares(entered, usdTotal);
      if (usdTotal < 1 || usd.some((s) => s.amountCents < 1)) return; // rejected at entry
      assert.equal(wasEqualSplit(orig, usd, dec), true);
    });
  }
});
