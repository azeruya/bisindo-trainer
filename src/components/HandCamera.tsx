import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { 
    mediaPipeToDetectedHands, 
    buildFeatures 
} from "../lib/landmark-core";

interface HandCameraProps {
    onFeatures?: (
        features: number[],
        handCount: number
    ) => void;
}

export default function HandCamera({ onFeatures }: HandCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);

  const [status, setStatus] = useState("Loading MediaPipe...");
  const [handCount, setHandCount] = useState(0);

  const onFeaturesRef = useRef(onFeatures);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    onFeaturesRef.current = onFeatures;

    async function setup() {
      try {
        // load mediapipe vision wasm
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        // create handlandmarker
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },

          runningMode: "VIDEO",
          numHands: 2,

          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;

        // ask for webcam access
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        await video.play();

        setStatus("Camera ready");

        detectLoop();
      } catch (error) {
        console.error(error);
        setStatus("Could not start camera / MediaPipe");
      }
    }

    function detectLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (!video || !canvas || !handLandmarker) {
        return;
      }

      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastVideoTimeRef.current = video.currentTime;

        const result = handLandmarker.detectForVideo(
          video,
          performance.now()
        );

        const detectedHands = mediaPipeToDetectedHands(result);

        const features = buildFeatures(detectedHands);

        const finite = features.every(Number.isFinite);

        //console.log(
        //  "hands:",
        //  detectedHands.length,
        //  "features:",
        //  features.length,
        //  "finite:",
        //  finite
        //);

        setHandCount(detectedHands.length);
        onFeaturesRef.current?.(features, detectedHands.length);

        const ctx = canvas.getContext("2d");

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const drawingUtils = new DrawingUtils(ctx);

          for (const landmarks of result.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS
            );

            drawingUtils.drawLandmarks(landmarks);
          }
        }

        // useful for next step:
        if (result.landmarks.length > 0) {
          // console.log("Landmarks:", result.landmarks);
          // console.log("Handedness:", result.handedness);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectLoop);
    }

    setup();

    return () => {
      cancelled = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      stream?.getTracks().forEach((track) => track.stop());

      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
    };
  }, []);

  return (
    <div>
      <h2>Hand Camera</h2>

      <p>{status}</p>
      <p>Hands detected: {handCount}</p>

      <div
        style={{
          position: "relative",
          width: "min(900px, 100%)",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: "100%",
            display: "block",

            // mirror display only
            transform: "scaleX(-1)",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",

            // mirror overlay too so it matches the preview
            transform: "scaleX(-1)",

            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}