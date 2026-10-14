export type PracticeStatus =
  | "waiting"
  | "holding"
  | "correct";

export type PracticeState = {
  targetIndex: number;
  status: PracticeStatus;
};

export function getNextTargetIndex(
  currentIndex: number,
  totalTargets: number
) {
  return (currentIndex + 1) % totalTargets;
}