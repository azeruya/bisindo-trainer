import { describe, expect, it } from "vitest";
import { normalizeHand } from "../normalize";
import type { Hand } from "../types";

function makeHand(): Hand {
  return Array.from({ length: 21 }, (_, i) => ({
    x: i * 0.01,
    y: i * 0.02,
    z: i * 0.005,
  }));
}

describe("normalizeHand", () => {
  it("returns 63 values", () => {
    const result = normalizeHand(makeHand());

    expect(result).toHaveLength(63);
  });

  it("moves wrist to origin", () => {
    const result = normalizeHand(makeHand());

    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);
  });

  it("returns only finite values", () => {
    const result = normalizeHand(makeHand());

    expect(result.every(Number.isFinite)).toBe(true);
  });
});