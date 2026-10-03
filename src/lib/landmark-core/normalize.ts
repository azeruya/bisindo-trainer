import type { Hand, Point3 } from "./types";

const WRIST = 0;
const MIDDLE_MCP = 9;

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

export function normalizeHand(hand: Hand): number[] {
  if (hand.length !== 21) {
    throw new Error(
      `Expected 21 landmarks, got ${hand.length}`
    );
  }

  const wrist = hand[WRIST];

  // move wrist to origin
  const centered = hand.map((point) => ({
    x: point.x - wrist.x,
    y: point.y - wrist.y,
    z: point.z - wrist.z,
  }));

  // use wrist -> middle MCP as scale
  const scale =
    distance(
      { x: 0, y: 0, z: 0 },
      centered[MIDDLE_MCP]
    ) + EPS;

  // scale-normalize
  const normalized = centered.map((point) => ({
    x: point.x / scale,
    y: point.y / scale,
    z: point.z / scale,
  }));

  // flatten to 63 numbers
  const output: number[] = [];

  for (const point of normalized) {
    output.push(
      point.x,
      point.y,
      point.z
    );
  }

  return output;
}