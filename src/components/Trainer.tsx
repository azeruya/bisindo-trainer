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

import LandmarkGuide from "./LandmarkGuide";

import {
  loadReferencePoses,
} from "../lib/guides/loadReferencePoses";

import type {
  ReferencePoseFile,
} from "../lib/guides/loadReferencePoses";

import type {
  LetterResult,
} from "../lib/practice/sessionTypes";

import {
  savePracticeSession,
} from "../lib/practice/history";

import ProgressSummary from "./ProgressSummary";

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

type TrainerProps = {
  onBack?: () => void;
};

export default function Trainer({
  onBack,
}: TrainerProps) {
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

  const [sequence, setSequence] = useState(() =>
      shuffleLetters(LETTERS)
    );

  const [targetIndex, setTargetIndex] =
    useState(0);

  const target =
    sequence[targetIndex];

  const [showGuide, setShowGuide] =
    useState(false);

  const [
    referencePoses,
    setReferencePoses,
  ] =
    useState<ReferencePoseFile | null>(
      null
    );

  const [
    guideError,
    setGuideError,
  ] =
    useState<string | null>(null);

  const [results, setResults] =
    useState<LetterResult[]>([]);

  const targetStartedAtRef =
    useRef<number>(
      performance.now()
    );

  const resetCountRef =
    useRef(0);

  const guideUsedRef =
    useRef(false);

  const resultRecordedRef =
    useRef(false);

  const sessionSavedRef =
  useRef(false);

  const inferenceSamplesRef =
    useRef<number[]>([]);

  const handleFeatures = useCallback(
    (
      features: number[],
      _handCount: number
    ) => {
      if (!isReady) {
        return;
      }

      const inferenceStartedAt =
        performance.now();

      const result =
        predict(features);

      const currentInferenceMs =
        performance.now() -
        inferenceStartedAt;

      const samples =
        inferenceSamplesRef.current;

      samples.push(
        currentInferenceMs
      );

      if (samples.length > 60) {
        samples.shift();
      }

      if (!result) {
        return;
      }

      setPrediction(result);

      // Lock recognition after confirmation.
      if (resultRecordedRef.current) {
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
          elapsed >= HOLD_DURATION_MS &&
          !resultRecordedRef.current
        ) {
          resultRecordedRef.current = true;

          setHoldProgress(1);

          const completedAt =
            performance.now();

          const durationMs =
            completedAt -
            targetStartedAtRef.current;

          setResults(
            (current) => [
              ...current,
              {
                letter: target,
                durationMs,
                guideUsed:
                  guideUsedRef.current,
                resetCount:
                  resetCountRef.current,
              },
            ]
          );

          setStatus("correct");
        }

        return;
      }

      // Wrong sign / no sign
      const hadStartedHolding =
        holdStartedAtRef.current !== null;

      if (hadStartedHolding) {
        resetCountRef.current += 1;
      }

      holdStartedAtRef.current = null;

      setHoldProgress(0);
      setStatus("waiting");
    },
    [
      isReady,
      predict,
      target,
    ]
  );

  useEffect(() => {
    if (status !== "correct") {
      return;
    }


    const timeout = window.setTimeout(() => {

      const isLastLetter =
        targetIndex >=
        sequence.length - 1;

      // Reset recognition state
      holdStartedAtRef.current = null;
      predictionBufferRef.current = [];

      setHoldProgress(0);
      setStableLabel("no_sign");
      setPrediction(null);

      // Reset session tracking for next target
      resetCountRef.current = 0;
      guideUsedRef.current = false;
      resultRecordedRef.current = false;

      setShowGuide(false);

      // Finished all letters
      if (isLastLetter) {
        setStatus("finished");
        return;
      }

      // Advance target
      setTargetIndex(
        (current) => current + 1
      );

      targetStartedAtRef.current =
        performance.now();

      setStatus("waiting");
    }, 800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    status,
    target,
    targetIndex,
    sequence.length,
  ]);

  useEffect(() => {
    loadReferencePoses()
      .then(setReferencePoses)
      .catch((error) => {
        console.error(
          "Guide load error:",
          error
        );

        setGuideError(
          error instanceof Error
            ? error.message
            : "Could not load guide"
        );
      });
  }, []);


  const referenceHands =
    target
      ? referencePoses?.poses[
          target
        ]
      : undefined;

  const averageDurationMs =
    results.length > 0
      ? results.reduce(
          (sum, result) =>
            sum +
            result.durationMs,
          0
        ) / results.length
      : 0;

  const fastestResult =
    results.length > 0
      ? results.reduce(
          (fastest, current) =>
            current.durationMs <
            fastest.durationMs
              ? current
              : fastest
        )
      : null;

  const guideLetters =
    results
      .filter(
        (result) =>
          result.guideUsed
      )
      .map(
        (result) =>
          result.letter
      );

  const totalResets =
    results.reduce(
      (sum, result) =>
        sum +
        result.resetCount,
      0
    );

  function formatSeconds(
    ms: number
  ) {
    return (
      ms / 1000
    ).toFixed(1);
  }

  useEffect(() => {
    if (
      status !== "finished" ||
      results.length === 0 ||
      sessionSavedRef.current
    ) {
      return;
    }

    sessionSavedRef.current =
      true;

    const average =
      results.reduce(
        (sum, result) =>
          sum +
          result.durationMs,
        0
      ) / results.length;

    const resets =
      results.reduce(
        (sum, result) =>
          sum +
          result.resetCount,
        0
      );

    const guides =
      results
        .filter(
          (result) =>
            result.guideUsed
        )
        .map(
          (result) =>
            result.letter
        );

    savePracticeSession({
      id:
        crypto.randomUUID(),

      completedAt:
        new Date().toISOString(),

      averageDurationMs:
        average,

      totalResets:
        resets,

      guideLetters:
        guides,

      results,
    });
  }, [
    status,
    results,
  ]);

  function restartSession() {
    setSequence(
      shuffleLetters(LETTERS)
    );

    setTargetIndex(0);

    setResults([]);

    setPrediction(null);

    setStableLabel(
      "no_sign"
    );

    setHoldProgress(0);

    setShowGuide(false);

    setStatus("waiting");

    predictionBufferRef.current =
      [];

    holdStartedAtRef.current =
      null;

    resetCountRef.current = 0;

    guideUsedRef.current =
      false;

    resultRecordedRef.current =
      false;

    sessionSavedRef.current =
      false;

    targetStartedAtRef.current =
      performance.now();

    inferenceSamplesRef.current =
      [];
  }

  function getAverageInferenceMs() {
    const samples =
      inferenceSamplesRef.current;

    if (samples.length === 0) {
      return 0;
    }

    return (
      samples.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / samples.length
    );
  }

  return (
    <main className="trainer-page">
      <section className="trainer-shell">
        <header className="trainer-header">
          <div className="brand-block">
            <h1>
              learn your BISINDO
            </h1>

            <p className="header-subtitle">
              Real-time fingerspelling practice
            </p>

            {onBack && (
              <button
                type="button"
                className="back-to-guide"
                onClick={onBack}
              >
                ← Review hand guide
              </button>
            )}
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
          <>
            <section className="finished-card">
              <div className="success-icon">
                ✓
              </div>

              <p className="finish-eyebrow">
                Session complete
              </p>

              <h2>
                Nice work!
              </h2>

              <p className="finish-copy">
                You completed all{" "}
                {sequence.length} letters.
              </p>

              <div className="session-stats">
                <div className="stat-card">
                  <span>
                    Average time
                  </span>

                  <strong>
                    {formatSeconds(
                      averageDurationMs
                    )}
                    s
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Fastest
                  </span>

                  <strong>
                    {fastestResult
                      ? `${
                          fastestResult.letter
                        } · ${formatSeconds(
                          fastestResult.durationMs
                        )}s`
                      : "—"}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Hold resets
                  </span>

                  <strong>
                    {totalResets}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Guide used
                  </span>

                  <strong>
                    {guideLetters.length >
                    0
                      ? guideLetters.join(
                          ", "
                        )
                      : "None"}
                  </strong>
                </div>
              </div>

              <button
                className="primary-button"
                onClick={restartSession}
              >
                Practice again
              </button>
            </section>

            <ProgressSummary />
          </>

        ) : (
          <div
            className={`practice-grid ${
              showGuide
                ? "guide-visible"
                : ""
            }`}
          >
            {/* TARGET */}

            <section
              className={`target-panel ${
                status === "correct"
                  ? "target-panel-correct"
                  : ""
              }`}
            >
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
                  <span>
                    Hold progress
                  </span>

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


              <button
                type="button"
                className="guide-toggle"
                onClick={() => {
                  setShowGuide(
                    (current) => {
                      const next = !current;

                      if (next) {
                        guideUsedRef.current =
                          true;
                      }

                      return next;
                    }
                  );
                }}
              >
                <span className="guide-toggle-icon">
                  {showGuide ? "◉" : "○"}
                </span>

                {showGuide
                  ? "Hide hand guide"
                  : "Need help? Show guide"}
              </button>

            </section>

            {/* GUIDE */}

            {showGuide && (
              <section className="guide-card">
                <div className="guide-header">
                  <div>
                    <p className="guide-eyebrow">
                      Hand guide
                    </p>

                    <h2>
                      How to sign {target}
                    </h2>
                  </div>

                  <div className="guide-letter">
                    {target}
                  </div>
                </div>

                {guideError ? (
                  <p className="guide-error">
                    {guideError}
                  </p>
                ) : !referenceHands ? (
                  <p className="guide-loading">
                    Loading guide...
                  </p>
                ) : (
                  <>
                    <div className="guide-visual">
                      <LandmarkGuide
                        hands={referenceHands.map(
                          (
                            hand,
                            index
                          ) => ({
                            slot: index,
                            landmarks:
                              hand.landmarks,
                          })
                        )}
                        mirror
                      />
                    </div>

                    <p className="guide-caption">
                      {referenceHands.length >
                      1
                        ? "Mirror view · Match the shape and relative position of both hands."
                        : "Mirror view · Match the hand shape and orientation."}
                    </p>
                  </>
                )}
              </section>
            )}

            {/* CAMERA */}

            <section className="camera-panel">
              <HandCamera
                onFeatures={
                  handleFeatures
                }
              />
            </section>
          </div>
        )}

        <details className="about-panel">
          <summary>
            <span className="about-summary-icon">
              ✦
            </span>

            <span>
              How recognition works
            </span>

            <span className="about-summary-hint">
              On-device ML
            </span>
          </summary>

          <div className="about-content">
            <div className="recognition-flow">
              <div className="flow-step">
                <span className="flow-number">
                  01
                </span>

                <strong>
                  Camera
                </strong>

                <p>
                  Your webcam provides
                  live hand frames.
                </p>
              </div>

              <span className="flow-arrow">
                →
              </span>

              <div className="flow-step">
                <span className="flow-number">
                  02
                </span>

                <strong>
                  Landmarks
                </strong>

                <p>
                  MediaPipe detects hand
                  joints and builds 132
                  normalized features.
                </p>
              </div>

              <span className="flow-arrow">
                →
              </span>

              <div className="flow-step">
                <span className="flow-number">
                  03
                </span>

                <strong>
                  Recognition
                </strong>

                <p>
                  An MLP classifier runs
                  directly in your browser.
                </p>
              </div>

              <span className="flow-arrow">
                →
              </span>

              <div className="flow-step">
                <span className="flow-number">
                  04
                </span>

                <strong>
                  Confirmation
                </strong>

                <p>
                  Predictions are smoothed
                  and held briefly before
                  confirmation.
                </p>
              </div>
            </div>

            <div className="privacy-note">
              <span className="privacy-dot" />

              <div>
                <strong>
                  Private by design
                </strong>

                <p>
                  Recognition happens locally.
                  Camera video is not uploaded.
                </p>
              </div>
            </div>
          </div>
        </details>

        {import.meta.env.DEV &&
          status !== "finished" && (
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

                <p>
                  Avg inference:{" "}
                  {getAverageInferenceMs().toFixed(2)}
                  ms
                </p>
              </div>
            </details>
          )}
      </section>
    </main>
  );
}