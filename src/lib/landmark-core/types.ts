export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export type Hand = Point3[];

export interface DetectedHand {
  landmarks: Hand;
  handedness?: "Left" | "Right";
}

export const NUM_LANDMARKS = 21;
export const FEATURES_PER_HAND = NUM_LANDMARKS * 3; // 63

export const FEATURE_LENGTH =
  FEATURES_PER_HAND * 2 + // 126
  2 +                     // presence flags
  4;                      // inter-hand distances
// total = 132