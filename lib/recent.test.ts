import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRecent, msUntilStale, RECENT_MS } from "./recent.ts";

const T = 1_000_000;

describe("isRecent", () => {
  it("is true for the first minute", () => {
    assert.equal(isRecent(T, T), true);
    assert.equal(isRecent(T, T + 1), true);
    assert.equal(isRecent(T, T + RECENT_MS - 1), true);
  });
  it("is false from one minute on", () => {
    assert.equal(isRecent(T, T + RECENT_MS), false);
    assert.equal(isRecent(T, T + RECENT_MS + 5000), false);
  });
  it("treats a slightly-ahead clock (client behind server) as recent", () => {
    assert.equal(isRecent(T + 2000, T), true);
  });
});

describe("msUntilStale", () => {
  it("counts down to the end of the window", () => {
    assert.equal(msUntilStale(T, T), RECENT_MS);
    assert.equal(msUntilStale(T, T + 45_000), 15_000);
    assert.equal(msUntilStale(T, T + RECENT_MS), 0);
  });
  it("never goes negative", () => {
    assert.equal(msUntilStale(T, T + RECENT_MS * 10), 0);
  });
});
