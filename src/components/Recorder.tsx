import { useCallback, useMemo, useState, useRef } from "react";
import HandCamera from "./HandCamera";
import "./Recorder.css";

interface RecordingAttempt {
    attempt_id: string;
    signer_id: string;
    session_id: string;
    label: string;
    started_at: string;
    frames: number[][];
}

const LETTERS = ["A", "B", "C"]
const RECORDING_DURATION_MS = 2000;
const COUNTDOWN_SECONDS = 3;
const RECORD_INTERVAL_MS = 40; // ~25 FPS

export default function Recorder() {
    const [signerId, setSignerId] = useState("s01");
    const [label, setLabel] = useState("A");
    const [attempts, setAttempts] = useState<RecordingAttempt[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [frameCount, setFrameCount] = useState(0);
    const currentFramesRef = useRef<number[][]>([]);
    const recordingRef = useRef(false);
    const lastRecordedAtRef = useRef(0);
    const sessionId = useMemo(() => {
        const now = new Date();

        return `${signerId}-${now.toISOString().replace(/[:.]/g, "-")}`;
    }, [signerId]);

    const handleFeatures = useCallback((features: number[]) => {
        if (!recordingRef.current) {
            return;
        }

        const now = performance.now();

        if (
            now - lastRecordedAtRef.current <
            RECORD_INTERVAL_MS
        ) {
            return;
        }

        lastRecordedAtRef.current = now;

        if (
            features.length !== 132 ||
            !features.every(Number.isFinite)
        ) {
            console.warn(
            "Rejected invalid feature frame",
            features
            );
            return;
        }

        currentFramesRef.current.push([
            ...features,
        ]);

        setFrameCount(
            currentFramesRef.current.length
        );
        }, []);

    async function startAttempt() {
        if (!signerId.trim()) {
        alert("Please enter a signer ID.");
        return;
        }

        if (isRecording || countdown !== null) {
        return;
        }

        for (
        let value = COUNTDOWN_SECONDS;
        value > 0;
        value--
        ) {
        setCountdown(value);

        await new Promise((resolve) =>
            setTimeout(resolve, 1000)
        );
        }

        setCountdown(null);

        currentFramesRef.current = [];
        lastRecordedAtRef.current = 0;
        setFrameCount(0);

        recordingRef.current = true;
        setIsRecording(true);

        await new Promise((resolve) =>
        setTimeout(
            resolve,
            RECORDING_DURATION_MS
        )
        );

        recordingRef.current = false;
        setIsRecording(false);

        const frames =
        currentFramesRef.current.map(
            (frame) => [...frame]
        );

        if (frames.length === 0) {
        alert(
            "No frames were captured. Please try again."
        );
        return;
        }

        const attempt: RecordingAttempt = {
        attempt_id: crypto.randomUUID(),
        signer_id: signerId.trim(),
        session_id: sessionId,
        label,
        started_at:
            new Date().toISOString(),
        frames,
        };

        setAttempts((previous) => [
        ...previous,
        attempt,
        ]);
    }

    function exportJsonl() {
        if (attempts.length === 0) {
        alert("No attempts to export.");
        return;
        }

        const jsonl = attempts
        .map((attempt) =>
            JSON.stringify(attempt)
        )
        .join("\n");

        const blob = new Blob([jsonl], {
        type: "application/x-ndjson",
        });

        const url =
        URL.createObjectURL(blob);

        const anchor =
        document.createElement("a");

        anchor.href = url;
        anchor.download =
        `${sessionId}.jsonl`;

        anchor.click();

        URL.revokeObjectURL(url);
    }

    function clearAttempts() {
        setAttempts([]);
    }

    return (
        <main className="recorder-page">
            <header className="recorder-header">
            <div>
                <h1>BISINDO Recorder</h1>
                <p>
                Capture normalized hand landmark
                features for model training.
                </p>
            </div>

            <span className="session-badge">
                Session: {sessionId}
            </span>
            </header>

            <section className="recorder-controls">
            <label>
                <span>Signer ID</span>

                <input
                value={signerId}
                disabled={
                    attempts.length > 0 ||
                    isRecording
                }
                onChange={(event) =>
                    setSignerId(event.target.value)
                }
                />
            </label>

            <label>
                <span>Label</span>

                <select
                value={label}
                disabled={isRecording}
                onChange={(event) =>
                    setLabel(event.target.value)
                }
                >
                {LETTERS.map((letter) => (
                    <option
                    key={letter}
                    value={letter}
                    >
                    {letter}
                    </option>
                ))}
                </select>
            </label>

            <div className="attempt-status">
                <span>Attempts</span>
                <strong>{attempts.length}</strong>
            </div>

            <div className="attempt-status">
                <span>Frames</span>
                <strong>{frameCount}</strong>
            </div>

            <button
                className="primary-button"
                onClick={startAttempt}
                disabled={
                isRecording ||
                countdown !== null
                }
            >
                {countdown !== null
                ? `Starting in ${countdown}`
                : isRecording
                    ? "Recording..."
                    : "Start Attempt"}
            </button>

            <button
                onClick={exportJsonl}
                disabled={attempts.length === 0}
            >
                Export JSONL
            </button>

            <button
                onClick={clearAttempts}
                disabled={
                attempts.length === 0 ||
                isRecording
                }
            >
                Clear
            </button>
            </section>

            {isRecording && (
            <div className="recording-banner">
                ● Recording {label} — {frameCount} frames
            </div>
            )}

            <HandCamera
            onFeatures={handleFeatures}
            />
        </main>
    );
}
