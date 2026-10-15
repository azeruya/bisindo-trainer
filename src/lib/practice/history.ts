import type {
  LetterResult,
} from "./sessionTypes";

export type PracticeSession = {
  id: string;
  completedAt: string;

  averageDurationMs: number;
  totalResets: number;

  guideLetters: string[];

  results: LetterResult[];
};

const STORAGE_KEY =
  "bisindo-practice-history";

export function loadPracticeHistory():
  PracticeSession[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export function savePracticeSession(
  session: PracticeSession
) {
  const history =
    loadPracticeHistory();

  const next = [
    session,
    ...history,
  ].slice(0, 20);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next)
  );
}

export function clearPracticeHistory() {
  localStorage.removeItem(
    STORAGE_KEY
  );
}