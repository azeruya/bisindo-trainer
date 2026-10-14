import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import HandCamera from "./HandCamera";

import {
  useBisindoModel,
} from "../lib/inference/useBisindoModel";

import type {
  Prediction,
} from "../lib/inference/types";

import {
  smoothLabels,
} from "../lib/recognition/smoother";

import "./Trainer.css";
import OtterMascot from "./OtterMascot";

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

function shuffleLetters(
  letters: string[]
) {
  return [...letters].sort(
    () => Math.random() - 0.5
  );
}

const WINDOW_SIZE = 12;
const HOLD_DURATION_MS = 800;

type PracticeStatus =
  | "waiting"
  | "holding"
  | "correct"
  | "finished";

export default function Trainer() {
  const {
    isReady,
    error,
    predict,
  } = useBisindoModel();

  const [prediction, setPrediction] =
    useState<Prediction | null>(null);

  const predictionBufferRef =
    useRef<string[]>([]);

  const [stableLabel, setStableLabel] =
    useState("no_sign");

  const [status, setStatus] =
    useState<PracticeStatus>("waiting");

  const holdStartedAtRef =
    useRef<number | null>(null);

  const [holdProgress, setHoldProgress] =
    useState(0);

  const [sequence] = useState(
    () => shuffleLetters(LETTERS)
  );

  const [targetIndex, setTargetIndex] =
    useState(0);

  const target =
    sequence[targetIndex];

  const handleFeatures = useCallback(
    (
      features: number[],
      _handCount: number
    ) => {
      if (!isReady) {
        return;
      }

      const result =
        predict(features);

      if (!result) {
        return;
      }

      setPrediction(result);

      // Do nothing while showing success state
      if (status === "correct") {
        return;
      }

      const buffer =
        predictionBufferRef.current;

      buffer.push(result.label);

      if (
        buffer.length >
        WINDOW_SIZE
      ) {
        buffer.shift();
      }

      const smoothed =
        smoothLabels(buffer, 0.7);

      setStableLabel(
        smoothed.label
      );

      const now =
        performance.now();

      // Correct sign is stable
      if (
        smoothed.label === target
      ) {
        setStatus("holding");

        if (
          holdStartedAtRef.current ===
          null
        ) {
          holdStartedAtRef.current =
            now;
        }

        const elapsed =
          now -
          holdStartedAtRef.current;

        const progress =
          Math.min(
            elapsed /
              HOLD_DURATION_MS,
            1
          );

        setHoldProgress(
          progress
        );

        if (
          elapsed >=
          HOLD_DURATION_MS
        ) {
          setHoldProgress(1);
          setStatus("correct");
        }

        return;
      }

      // Wrong sign / no sign
      holdStartedAtRef.current =
        null;

      setHoldProgress(0);
      setStatus("waiting");
    },
    [
      isReady,
      predict,
      target,
      status,
    ]
  );

  useEffect(() => {
    if (status !== "correct") {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        const nextIndex =
          targetIndex + 1;

        holdStartedAtRef.current =
          null;

        predictionBufferRef.current =
          [];

        setHoldProgress(0);
        setStableLabel("no_sign");
        setPrediction(null);

        if (
          nextIndex >=
          sequence.length
        ) {
          setStatus("finished");
          return;
        }

        setTargetIndex(
          nextIndex
        );

        setStatus("waiting");
      }, 800);

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    status,
    targetIndex,
    sequence.length,
  ]);

  return (
    <main className="trainer-page">
      <section className="trainer-shell">
        <header className="trainer-header">
          <div className="brand-block">
            <h1>learn your BISINDO</h1>
            <p className="header-subtitle">
              Real-time fingerspelling practice
            </p>
          </div>

          {status !== "finished" && (
            <div className="step-progress">
              <div className="step-dots">
                {sequence.map((_, index) => (
                  <span
                    key={index}
                    className={[
                      "step-dot",
                      index < targetIndex
                        ? "completed"
                        : "",
                      index === targetIndex
                        ? "current"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                ))}
              </div>

              <span className="step-label">
                {targetIndex + 1} of {sequence.length}
              </span>
            </div>
          )}
        </header>

        {error && (
          <div className="error-banner">
            Model error: {error}
          </div>
        )}

        {status === "finished" ? (
          <section className="finished-card">
            <div className="success-icon">
              ✓
            </div>

            <h2>Practice complete</h2>

            <p>
              You completed all{" "}
              {sequence.length} letters.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Practice again
            </button>
          </section>
        ) : (
          <div className="practice-grid">
            <section
              className={`target-panel ${
                status === "correct"
                  ? "target-panel-correct"
                  : ""
              }`}
            >
              <OtterMascot
                mood={
                  status === "correct"
                    ? "correct"
                    : status === "holding"
                    ? "holding"
                    : "idle"
                }
              />

              <p className="section-label">
                Make this sign
              </p>

              <div className="target-letter">
                {target}
              </div>

              <div
                className={`status-pill status-${status}`}
              >
                {status === "waiting" &&
                  "Ready when you are"}

                {status === "holding" &&
                  "Nice — keep holding!"}

                {status === "correct" &&
                  "You got it! ✓"}
              </div>

              <div className="hold-area">
                <div className="hold-header">
                  <span>Hold progress</span>

                  <span>
                    {Math.round(
                      holdProgress * 100
                    )}
                    %
                  </span>
                </div>

                <div className="hold-track">
                  <div
                    className="hold-fill"
                    style={{
                      width: `${
                        holdProgress * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="camera-panel">
              <HandCamera
                onFeatures={
                  handleFeatures
                }
              />
            </section>
          </div>
        )}

        <details className="debug-panel">
          <summary>
            Recognition details
          </summary>

          <div className="debug-content">
            <p>
              Model:{" "}
              {error
                ? "Error"
                : isReady
                ? "Ready"
                : "Loading"}
            </p>

            <p>
              Raw prediction:{" "}
              {prediction?.label ?? "-"}
            </p>

            <p>
              Stable prediction:{" "}
              {stableLabel}
            </p>

            <p>
              Confidence:{" "}
              {prediction
                ? (
                    prediction.confidence *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </p>
          </div>
        </details>
      </section>
    </main>
  );
}