import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadPracticeHistory,
} from "../lib/practice/history";

import type {
  PracticeSession,
} from "../lib/practice/history";

const LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "P",
  "T",
];

function seconds(
  ms: number
) {
  return (
    ms / 1000
  ).toFixed(1);
}

export default function ProgressSummary() {
  const [
    history,
    setHistory,
  ] =
    useState<
      PracticeSession[]
    >([]);

  useEffect(() => {
    setHistory(
      loadPracticeHistory()
    );
  }, []);

  const letterStats =
    useMemo(() => {
      const stats =
        new Map<
          string,
          {
            attempts: number;
            totalDuration: number;
            guideUses: number;
            resets: number;
          }
        >();

      for (
        const letter
        of LETTERS
      ) {
        stats.set(letter, {
          attempts: 0,
          totalDuration: 0,
          guideUses: 0,
          resets: 0,
        });
      }

      for (
        const session
        of history
      ) {
        for (
          const result
          of session.results
        ) {
          const stat =
            stats.get(
              result.letter
            );

          if (!stat) {
            continue;
          }

          stat.attempts += 1;

          stat.totalDuration +=
            result.durationMs;

          stat.resets +=
            result.resetCount;

          if (
            result.guideUsed
          ) {
            stat.guideUses +=
              1;
          }
        }
      }

      return LETTERS.map(
        (letter) => {
          const stat =
            stats.get(letter)!;

          return {
            letter,

            attempts:
              stat.attempts,

            averageMs:
              stat.attempts >
              0
                ? stat.totalDuration /
                  stat.attempts
                : 0,

            guideUses:
              stat.guideUses,

            resets:
              stat.resets,
          };
        }
      );
    }, [history]);

  if (
    history.length === 0
  ) {
    return (
      <section className="progress-empty">
        <h2>
          Your progress
        </h2>

        <p>
          Complete a practice
          session to start
          tracking your progress.
        </p>
      </section>
    );
  }

  const recent =
    history.slice(0, 3);

  const needsPractice =
    [...letterStats]
      .filter(
        (item) =>
          item.attempts > 0
      )
      .sort(
        (a, b) =>
          b.resets +
            b.guideUses -
          (a.resets +
            a.guideUses)
      )
      .slice(0, 3);

  return (
    <section className="progress-panel">
      <div className="progress-heading">
        <div>
          <p className="progress-eyebrow">
            Practice history
          </p>

          <h2>
            Your progress
          </h2>
        </div>

        <span className="session-count">
          {history.length}{" "}
          session
          {history.length !==
          1
            ? "s"
            : ""}
        </span>
      </div>

      <div className="progress-grid">
        <div className="progress-block">
          <h3>
            Recent sessions
          </h3>

          {recent.map(
            (session) => (
              <div
                className="history-row"
                key={
                  session.id
                }
              >
                <div>
                  <strong>
                    {new Date(
                      session.completedAt
                    ).toLocaleDateString()}
                  </strong>

                  <span>
                    {
                      session.totalResets
                    }{" "}
                    resets
                  </span>
                </div>

                <strong>
                  {seconds(
                    session.averageDurationMs
                  )}
                  s avg
                </strong>
              </div>
            )
          )}
        </div>

        <div className="progress-block">
          <h3>
            Practice next
          </h3>

          {needsPractice.map(
            (item) => (
              <div
                className="letter-progress-row"
                key={
                  item.letter
                }
              >
                <span className="progress-letter">
                  {
                    item.letter
                  }
                </span>

                <div>
                  <strong>
                    {seconds(
                      item.averageMs
                    )}
                    s avg
                  </strong>

                  <span>
                    {item.guideUses}{" "}
                    {item.guideUses === 1
                        ? "guide use"
                        : "guide uses"}
                    {" · "}
                    {item.resets}{" "}
                    {item.resets === 1
                        ? "reset"
                        : "resets"}
                    </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}