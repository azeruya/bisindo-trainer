import type { BisindoModel } from "./types";

export async function loadBisindoModel(): Promise<BisindoModel> {
  const response = await fetch("/models/bisindo-v1.json");

  if (!response.ok) {
    throw new Error(
      `Failed to load model: ${response.status}`
    );
  }

  return response.json();
}