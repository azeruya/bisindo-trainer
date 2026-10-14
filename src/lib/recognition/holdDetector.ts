export type HoldState = {
  progress: number;
  confirmed: boolean;
};

export function getHoldState(
  startedAt: number | null,
  now: number,
  holdDurationMs: number
): HoldState {
  if (startedAt === null) {
    return {
      progress: 0,
      confirmed: false,
    };
  }

  const elapsed = now - startedAt;

  const progress = Math.min(
    elapsed / holdDurationMs,
    1
  );

  return {
    progress,
    confirmed:
      elapsed >= holdDurationMs,
  };
}