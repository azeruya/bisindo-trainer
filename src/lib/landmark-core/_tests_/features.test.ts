import { describe, expect, it } from "vitest";
import { buildFeatures } from "../features";
import type { DetectedHand, Hand } from "../types";

function makeHand(offsetX = 0): Hand {
  return Array.from({ length: 21 }, (_, i) => ({
    x: offsetX + i * 0.01,
    y: i * 0.02,
    z: i * 0.005,
  }));
}

describe("buildFeatures", () => {
  it("always returns 132 features with zero hands", () => {
    const result = buildFeatures([]);

    expect(result).toHaveLength(132);
    expect(result.every(Number.isFinite)).toBe(true);
  });

  it("returns 132 features with one hand", () => {
    const hands: DetectedHand[] = [
      {
        landmarks: makeHand(),
      },
    ];

    const result = buildFeatures(hands);

    expect(result).toHaveLength(132);
    expect(result.every(Number.isFinite)).toBe(true);
  });

  it("returns 132 features with two hands", () => {
    const hands: DetectedHand[] = [
      {
        landmarks: makeHand(0.2),
      },
      {
        landmarks: makeHand(0.7),
      },
    ];

    const result = buildFeatures(hands);

    expect(result).toHaveLength(132);
    expect(result.every(Number.isFinite)).toBe(true);
  });

  it("sets presence flags correctly for one hand", () => {
    const result = buildFeatures([
      {
        landmarks: makeHand(),
      },
    ]);

    expect(result[126]).toBe(1);
    expect(result[127]).toBe(0);
  });

  it("sets presence flags correctly for two hands", () => {
    const result = buildFeatures([
      {
        landmarks: makeHand(0.2),
      },
      {
        landmarks: makeHand(0.7),
      },
    ]);

    expect(result[126]).toBe(1);
    expect(result[127]).toBe(1);
  });
});