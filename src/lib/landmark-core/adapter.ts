import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { DetectedHand } from "./types";

export function mediaPipeToDetectedHands(
  result: HandLandmarkerResult
): DetectedHand[] {
  return result.landmarks.map((landmarks, index) => {
    const handednessCategory = result.handedness?.[index]?.[0];

    return {
      landmarks: landmarks.map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z,
      })),

      handedness:
        handednessCategory?.categoryName === "Left" ||
        handednessCategory?.categoryName === "Right"
          ? handednessCategory.categoryName
          : undefined,
    };
  });
}