import type {
  DetectedHand,
  Hand,
  Point3,
} from "./types";

import {
  FEATURES_PER_HAND,
  FEATURE_LENGTH,
} from "./types";

import { canonicalizeHands } from "./canonicalize";
import { normalizeHand } from "./normalize";

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_TIP = 12;

const EPS = 1e-6;

function distance(a: Point3, b: Point3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(
    dx * dx +
    dy * dy +
    dz * dz
  );
}

function emptyHandFeatures(): number[] {
  return new Array(FEATURES_PER_HAND).fill(0);
}

function handScale(hand: Hand): number {
  return (
    distance(
      hand[WRIST],
      hand[MIDDLE_MCP]
    ) + EPS
  );
}

function buildInterHandFeatures(
  hand0: Hand,
  hand1: Hand
): number[] {
  const scale0 = handScale(hand0);
  const scale1 = handScale(hand1);

  // symmetric scale
  const scale = (scale0 + scale1) / 2;

  return [
    distance(
      hand0[WRIST],
      hand1[WRIST]
    ) / scale,

    distance(
      hand0[INDEX_TIP],
      hand1[INDEX_TIP]
    ) / scale,

    distance(
      hand0[THUMB_TIP],
      hand1[THUMB_TIP]
    ) / scale,

    distance(
      hand0[MIDDLE_TIP],
      hand1[MIDDLE_TIP]
    ) / scale,
  ];
}

export function buildFeatures(
  hands: DetectedHand[]
): number[] {
  const [hand0, hand1] =
    canonicalizeHands(hands);

  const features: number[] = [];

  // hand 0
  features.push(
    ...(hand0
      ? normalizeHand(hand0)
      : emptyHandFeatures())
  );

  // hand 1
  features.push(
    ...(hand1
      ? normalizeHand(hand1)
      : emptyHandFeatures())
  );

  // presence flags
  features.push(
    hand0 ? 1 : 0,
    hand1 ? 1 : 0
  );

  // relative two-hand geometry
  if (hand0 && hand1) {
    features.push(
      ...buildInterHandFeatures(
        hand0,
        hand1
      )
    );
  } else {
    features.push(0, 0, 0, 0);
  }

  if (features.length !== FEATURE_LENGTH) {
    throw new Error(
      `Expected ${FEATURE_LENGTH} features, got ${features.length}`
    );
  }

  return features;
}