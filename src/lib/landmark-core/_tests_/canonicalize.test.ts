import { describe, expect, it } from "vitest";
import { canonicalizeHands } from "../canonicalize";
import type { DetectedHand, Hand } from "../types";

function makeHand(wristX: number): Hand {
  const hand = Array.from({ length: 21 }, () => ({
    x: wristX,
    y: 0.5,
    z: 0,
  }));

  return hand;
}

describe("canonicalizeHands", () => {
  it("returns null slots when there are no hands", () => {
    const result = canonicalizeHands([]);

    expect(result).toEqual([null, null]);
  });

  it("places one hand in slot 0", () => {
    const hand: DetectedHand = {
      landmarks: makeHand(0.5),
    };

    const [h0, h1] = canonicalizeHands([hand]);

    expect(h0).not.toBeNull();
    expect(h1).toBeNull();
  });

  it("sorts two hands by wrist x", () => {
    const left: DetectedHand = {
      landmarks: makeHand(0.2),
    };

    const right: DetectedHand = {
      landmarks: makeHand(0.8),
    };

    const [h0, h1] = canonicalizeHands([
      right,
      left,
    ]);

    expect(h0?.[0].x).toBe(0.2);
    expect(h1?.[0].x).toBe(0.8);
  });
});