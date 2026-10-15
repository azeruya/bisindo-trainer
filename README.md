# BISINDO Trainer

Real-time, on-device BISINDO fingerspelling practice built with React, TypeScript, MediaPipe, and a custom browser-side MLP classifier.

BISINDO Trainer helps users practice a selected set of static BISINDO fingerspelling signs using webcam-based hand tracking, real-time recognition, hold-to-confirm interaction, optional landmark-based hand guides, and local progress tracking.

## Features

- Real-time hand tracking with MediaPipe Hand Landmarker
- Browser-side BISINDO sign recognition
- Custom 132-dimensional hand landmark feature representation
- MLP classifier exported from scikit-learn to JSON
- Confidence-based `no_sign` rejection
- Temporal smoothing for more stable predictions
- Hold-to-confirm interaction
- Randomized practice sessions
- Optional landmark-based hand guide
- Two-hand pose visualization preserving relative hand position
- Session summary with:
  - average completion time
  - fastest letter
  - hold resets
  - guide usage
- Practice history stored locally in the browser
- Fully on-device inference — webcam video is not uploaded

## Supported Signs

The current v1 supports 8 static BISINDO letters:

`A`, `B`, `C`, `D`, `E`, `F`, `P`, `T`

The model also includes a `no_sign` class for rejection of unsupported or neutral hand poses.

## How It Works

```text
Webcam
  ↓
MediaPipe Hand Landmarker
  ↓
Hand landmark adapter
  ↓
132 normalized features
  ↓
MLP classifier
  ↓
Confidence rejection
  ↓
Temporal smoothing
  ↓
Hold-to-confirm
  ↓
Practice state machine
```

The 132-feature representation contains:

- 63 values for the first hand
- 63 values for the second hand
- 2 hand-presence flags
- 4 inter-hand distance features

Each hand is normalized relative to the wrist and hand scale before classification.

## Model Development

Three baseline models were compared:

- k-Nearest Neighbors
- Random Forest
- Multi-Layer Perceptron

The final model uses:

```text
MLP
Hidden layers: 128 → 64
Activation: ReLU
Output: Softmax
Confidence threshold: 0.60
```

The model was selected using a held-out development signer before evaluation on a separate untouched signer.

## Final Evaluation

Final evaluation on the untouched `s04` signer:

| Metric | Result |
|---|---:|
| Frame accuracy | 94.82% |
| Macro F1 | 0.944 |
| Valid-sign recall | 93.00% |
| `no_sign` false acceptance rate | 0.34% |
| Attempt-level accuracy | 94.55% |

The final benchmark was frozen before training the deployment model on the full dataset.

## Dataset

The v1 dataset contains:

- 4 signers
- 8 BISINDO letters + `no_sign`
- 205 recorded attempts
- 8,068 landmark frames
- 132 features per frame

The dataset was collected using the project’s custom browser recorder.

Raw video is not stored; recordings contain structured landmark-derived feature data.

## Browser Inference

The final scikit-learn model is trained in Python and exported to JSON.

A custom TypeScript implementation performs:

- dense layers
- ReLU activation
- softmax output
- confidence thresholding

Python and TypeScript inference were validated using parity testing.

Maximum probability difference observed during parity testing:

```text
~7 × 10⁻¹³
```

This confirms that browser inference closely reproduces the Python model output.

## Hand Guide

The learning guide uses captured MediaPipe landmarks rather than normalized model features.

This is intentional:

- classification benefits from normalization
- instructional visualization needs to preserve relative hand geometry

For two-hand signs, the guide preserves the spatial relationship between both hands and renders them using distinct visual markers for clarity.

## Privacy

Recognition runs locally in the browser.

The app does not upload webcam video for inference.

Practice history is stored locally using `localStorage`.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Computer Vision

- MediaPipe Tasks Vision
- Hand Landmarker

### Machine Learning

- Python
- scikit-learn
- NumPy

### Deployment

- Vercel

## Project Structure

```text
src/
  components/
    HandCamera.tsx
    Trainer.tsx
    LandmarkGuide.tsx
    ProgressSummary.tsx

  lib/
    inference/
    landmark-core/
    recognition/
    guides/
    practice/

ml/
  data/
  models/
  results/
  scripts/

public/
  models/
  guides/
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Limitations

This is an experimental learning project and not a full BISINDO translator.

Current limitations include:

- only 8 static letters are supported
- the training dataset currently contains 4 signers
- dynamic signs are not supported
- recognition performance may vary with hand orientation, camera angle, lighting, and signer variation
- landmark-based guides show hand geometry but do not replace instruction from qualified BISINDO educators

## Future Work

Potential future improvements include:

- expanding the validated letter set
- collecting data from more signers
- stronger cross-signer generalization
- improved handling of dynamic signs
- more detailed progress analytics
- browser performance benchmarking
- usability testing with BISINDO learners

## Status

**BISINDO Trainer v1**

Core training, browser inference, hand guides, session summaries, and local practice history are implemented.
