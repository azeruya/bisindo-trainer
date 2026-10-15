import {
  useEffect,
  useState,
} from "react";

import LandmarkGuide from "./LandmarkGuide";

import {
  loadReferencePoses,
} from "../lib/guides/loadReferencePoses";

import type {
  ReferencePoseFile,
} from "../lib/guides/loadReferencePoses";

import "./Landing.css";

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

type LandingProps = {
  onStart: () => void;
};

export default function Landing({
  onStart,
}: LandingProps) {
  const [
    referencePoses,
    setReferencePoses,
  ] =
    useState<ReferencePoseFile | null>(
      null
    );

  useEffect(() => {
    loadReferencePoses()
      .then(setReferencePoses)
      .catch(console.error);
  }, []);

  return (
    <main className="landing-page">
      <section className="landing-shell">
        <header className="landing-hero">
          <div>
            <p className="landing-eyebrow">
              BISINDO fingerspelling
            </p>

            <h1>
              learn your BISINDO
            </h1>

            <p className="landing-copy">
              Learn the hand shapes first,
              then practice them in real time
              with your camera.
            </p>
          </div>

          <button
            className="landing-start-button"
            onClick={onStart}
          >
            Start practice →
          </button>
        </header>

        <section className="guide-library">
          <div className="guide-library-heading">
            <div>
              <p className="landing-eyebrow">
                Hand guide
              </p>

              <h2>
                Meet the 8 signs
              </h2>
            </div>

            <p>
              These are the signs currently
              supported in v1.
            </p>
          </div>

          <div className="guide-library-grid">
            {LETTERS.map(
              (letter) => {
                const hands =
                  referencePoses
                    ?.poses[
                      letter
                    ];

                return (
                  <article
                    key={letter}
                    className="landing-guide-card"
                  >
                    <div className="landing-letter">
                      {letter}
                    </div>

                    <div className="landing-guide-visual">
                      {hands ? (
                        <LandmarkGuide
                          hands={hands.map(
                            (
                              hand,
                              index
                            ) => ({
                              slot:
                                index,

                              landmarks:
                                hand.landmarks,
                            })
                          )}
                          mirror
                        />
                      ) : (
                        <span>
                          Loading…
                        </span>
                      )}
                    </div>

                    <p>
                      {hands?.length ===
                      2
                        ? "Two-hand sign"
                        : "One-hand sign"}
                    </p>
                  </article>
                );
              }
            )}
          </div>

          <div className="landing-bottom-cta">
            <p>
              Ready to try them yourself?
            </p>

            <button
              className="landing-start-button"
              onClick={onStart}
            >
              Start practice →
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}