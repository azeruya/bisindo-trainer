import {
  useRef,
  useState,
} from "react";

import HandCamera from "./HandCamera";
import LandmarkGuide from "./LandmarkGuide";

import type {
  DetectedHand,
} from "../lib/landmark-core";

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

type CapturedPose = {
  label: string;
  hands: DetectedHand[];
};

function sleep(ms: number) {
  return new Promise<void>(
    (resolve) =>
      window.setTimeout(resolve, ms)
  );
}

export default function ReferenceRecorder() {
  const latestHandsRef =
    useRef<DetectedHand[]>([]);

  const [index, setIndex] =
    useState(0);

  const [captures, setCaptures] =
    useState<
      Record<string, DetectedHand[]>
    >({});

  const [captureOrder, setCaptureOrder] =
    useState<string[]>([]);

  const [detectedCount, setDetectedCount] =
    useState(0);

  const [countdown, setCountdown] =
    useState<number | null>(null);

  const [isCapturing, setIsCapturing] =
    useState(false);

  const [lastCapture, setLastCapture] =
    useState<CapturedPose | null>(
      null
    );

  const label =
    index < LETTERS.length
      ? LETTERS[index]
      : null;

  const finished =
    index >= LETTERS.length;

  async function capture() {
    if (
      isCapturing ||
      finished ||
      !label
    ) {
      return;
    }

    if (
      latestHandsRef.current.length ===
      0
    ) {
      alert(
        "No hands detected. Position your hand and try again."
      );

      return;
    }

    setIsCapturing(true);

    /*
     * 3 second countdown.
     *
     * Importantly, we don't snapshot the
     * landmarks until AFTER the countdown.
     */
    for (
      let count = 3;
      count >= 1;
      count--
    ) {
      setCountdown(count);

      await sleep(1000);
    }

    setCountdown(null);

    /*
     * Check again because the user's hand
     * may have disappeared during countdown.
     */
    const currentHands =
      latestHandsRef.current;

    if (currentHands.length === 0) {
      alert(
        "Hands were lost during capture. Please try again."
      );

      setIsCapturing(false);

      return;
    }

    const snapshot =
      structuredClone(
        currentHands
      );

    const capturedLabel =
      label;

    setCaptures(
      (current) => ({
        ...current,
        [capturedLabel]:
          snapshot,
      })
    );

    setCaptureOrder(
      (current) => [
        ...current,
        capturedLabel,
      ]
    );

    /*
     * Immediately show what was captured.
     */
    setLastCapture({
      label: capturedLabel,
      hands: snapshot,
    });

    /*
     * Move to next letter.
     */
    setIndex(
      (current) =>
        current + 1
    );

    setIsCapturing(false);
  }

  function undo() {
    if (
      isCapturing ||
      captureOrder.length === 0
    ) {
      return;
    }

    const previousLabel =
      captureOrder[
        captureOrder.length - 1
      ];

    /*
     * Remove most recent capture.
     */
    setCaptures(
      (current) => {
        const next = {
          ...current,
        };

        delete next[
          previousLabel
        ];

        return next;
      }
    );

    const nextOrder =
      captureOrder.slice(
        0,
        -1
      );

    setCaptureOrder(
      nextOrder
    );

    /*
     * Return recorder to the letter
     * that was removed.
     */
    const previousIndex =
      LETTERS.indexOf(
        previousLabel
      );

    setIndex(
      previousIndex
    );

    /*
     * Preview the capture before the
     * removed one, if there is one.
     */
    const newLastLabel =
      nextOrder[
        nextOrder.length - 1
      ];

    if (!newLastLabel) {
      setLastCapture(
        null
      );

      return;
    }

    const previousHands =
      captures[
        newLastLabel
      ];

    if (previousHands) {
      setLastCapture({
        label:
          newLastLabel,
        hands:
          previousHands,
      });
    } else {
      setLastCapture(
        null
      );
    }
  }

  function download() {
    if (
      Object.keys(captures)
        .length === 0
    ) {
      alert(
        "No reference poses captured yet."
      );

      return;
    }

    const blob =
      new Blob(
        [
          JSON.stringify(
            {
              version:
                "bisindo-guide-v1",

              poses:
                captures,
            },
            null,
            2
          ),
        ],
        {
          type:
            "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      "reference-poses.json";

    anchor.click();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px",
      }}
    >
      <header
        style={{
          marginBottom: "24px",
        }}
      >
        <h1>
          BISINDO Reference
          Recorder
        </h1>

        {!finished ? (
          <p>
            Capture letter{" "}
            <strong>
              {label}
            </strong>
            {" · "}
            {index + 1} /{" "}
            {LETTERS.length}
          </p>
        ) : (
          <p>
            ✓ All reference
            poses captured.
          </p>
        )}
      </header>

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1.6fr) minmax(280px, 0.8fr)",

          gap: "24px",

          alignItems: "start",
        }}
      >
        {/* CAMERA SIDE */}

        <section>
          <div
            style={{
              position:
                "relative",
            }}
          >
            <HandCamera
              onLandmarks={
                (hands) => {
                  latestHandsRef.current =
                    hands;

                  setDetectedCount(
                    hands.length
                  );
                }
              }
            />

            {countdown !==
              null && (
              <div
                style={{
                  position:
                    "absolute",

                  inset: 0,

                  display:
                    "grid",

                  placeItems:
                    "center",

                  pointerEvents:
                    "none",
                }}
              >
                <div
                  style={{
                    display:
                      "grid",

                    placeItems:
                      "center",

                    width:
                      "110px",

                    height:
                      "110px",

                    borderRadius:
                      "50%",

                    background:
                      "rgba(255,255,255,0.92)",

                    fontSize:
                      "3rem",

                    fontWeight:
                      800,
                  }}
                >
                  {countdown}
                </div>
              </div>
            )}
          </div>

          <p>
            Hands detected:{" "}
            <strong>
              {detectedCount}
            </strong>
          </p>

          {!finished && (
            <button
              type="button"
              onClick={capture}
              disabled={
                isCapturing ||
                detectedCount ===
                  0
              }
            >
              {isCapturing
                ? "Hold pose..."
                : `Capture ${label}`}
            </button>
          )}

          <button
            type="button"
            onClick={undo}
            disabled={
              isCapturing ||
              captureOrder.length ===
                0
            }
          >
            Undo last
          </button>

          <button
            type="button"
            onClick={download}
          >
            Download references
          </button>
        </section>

        {/* CAPTURE PREVIEW */}

        <section
          style={{
            padding: "20px",

            border:
              "2px solid #35264f",

            borderRadius:
              "24px",

            background:
              "#fffdf7",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Captured pose
          </h2>

          {lastCapture ? (
            <>
              <p>
                Letter{" "}
                <strong>
                  {
                    lastCapture.label
                  }
                </strong>
              </p>

              <div
                style={{
                  padding:
                    "16px",

                  borderRadius:
                    "18px",

                  background:
                    "#f4efff",
                }}
              >
                <LandmarkGuide
                  hands={lastCapture.hands.map(
                    (
                      hand,
                      handIndex
                    ) => ({
                      slot:
                        handIndex,

                      landmarks:
                        hand.landmarks,
                    })
                  )}
                  mirror
                />
              </div>

              <p>
                {
                  lastCapture
                    .hands
                    .length
                }{" "}
                hand
                {lastCapture
                  .hands
                  .length !==
                1
                  ? "s"
                  : ""}{" "}
                captured
              </p>
            </>
          ) : (
            <p>
              Capture your first
              reference to preview
              it here.
            </p>
          )}

          <hr />

          <p>
            <strong>
              Captured:
            </strong>
          </p>

          <p>
            {captureOrder.length >
            0
              ? captureOrder.join(
                  " · "
                )
              : "None yet"}
          </p>
        </section>
      </div>
    </main>
  );
}