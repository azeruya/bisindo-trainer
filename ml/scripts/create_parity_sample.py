from pathlib import Path
import json
import pickle

import numpy as np


ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = ROOT / "ml" / "data" / "bisindo-v1"
MODEL_PATH = ROOT / "ml" / "models" / "bisindo-mlp.pkl"

OUTPUT_PATH = (
    ROOT
    / "public"
    / "models"
    / "parity-sample.json"
)


def get_first_valid_frame():
    files = sorted(DATA_DIR.glob("*.jsonl"))

    for file_path in files:
        with file_path.open(
            "r",
            encoding="utf-8",
        ) as f:

            for line in f:
                if not line.strip():
                    continue

                attempt = json.loads(line)

                for frame in attempt["frames"]:
                    if len(frame) != 132:
                        continue

                    if not np.all(np.isfinite(frame)):
                        continue

                    return {
                        "features": frame,
                        "true_label": attempt["label"],
                        "source_file": file_path.name,
                    }

    raise RuntimeError(
        "No valid frame found."
    )


def main():
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    sample = get_first_valid_frame()

    X = np.asarray(
        [sample["features"]],
        dtype=np.float32,
    )

    probabilities = model.predict_proba(X)[0]

    best_index = int(
        np.argmax(probabilities)
    )

    raw_label = str(
        model.classes_[best_index]
    )

    confidence = float(
        probabilities[best_index]
    )

    threshold = 0.60

    final_label = (
        raw_label
        if confidence >= threshold
        else "no_sign"
    )

    output = {
        **sample,
        "classes": [
            str(x)
            for x in model.classes_
        ],
        "python_probabilities": [
            float(x)
            for x in probabilities
        ],
        "python_raw_label": raw_label,
        "python_confidence": confidence,
        "python_final_label": final_label,
        "threshold": threshold,
    }

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            output,
            f,
            indent=2,
        )

    print("Parity sample created")
    print("---------------------")
    print(
        f"Source: {sample['source_file']}"
    )
    print(
        f"True label: {sample['true_label']}"
    )
    print(
        f"Python raw prediction: {raw_label}"
    )
    print(
        f"Confidence: {confidence:.8f}"
    )
    print(
        f"Final label: {final_label}"
    )
    print(
        f"Saved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()