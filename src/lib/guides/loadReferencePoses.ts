export type ReferenceLandmark = {
  x: number;
  y: number;
  z: number;
};

export type ReferenceHand = {
  handedness?: string;
  landmarks: ReferenceLandmark[];
};

export type ReferencePoseFile = {
  version: string;

  poses: Record<
    string,
    ReferenceHand[]
  >;
};

export async function loadReferencePoses():
  Promise<ReferencePoseFile> {
  const response = await fetch(
    "/guides/reference-poses.json"
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load reference poses: ${response.status}`
    );
  }

  return response.json();
}