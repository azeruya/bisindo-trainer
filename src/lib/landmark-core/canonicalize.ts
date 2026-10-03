import type { DetectedHand, Hand } from "./types";

const WRIST = 0;

export type CanonicalizeStrategy = (
  hands: DetectedHand[]
) => [Hand | null, Hand | null];

export const wristXStrategy: CanonicalizeStrategy = (hands) => {
  const valid = hands.filter(
    (hand) => hand.landmarks.length === 21
  );

  if (valid.length === 0) {
    return [null, null];
  }

  if (valid.length === 1) {
    return [valid[0].landmarks, null];
  }

  const sorted = [...valid].sort(
    (a, b) =>
      a.landmarks[WRIST].x -
      b.landmarks[WRIST].x
  );

  return [
    sorted[0].landmarks,
    sorted[1].landmarks,
  ];
};

export function canonicalizeHands(
  hands: DetectedHand[],
  strategy: CanonicalizeStrategy = wristXStrategy
): [Hand | null, Hand | null] {
  return strategy(hands);
}