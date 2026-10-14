from pathlib import Path
import json
import pickle

import numpy as np

from sklearn.neural_network import MLPClassifier


DATA_DIR = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "bisindo-v1"
)

MODEL_DIR = (
    Path(__file__).resolve().parents[1]
    / "models"
)

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


def load_data():
    X = []
    y = []

    files = sorted(
        DATA_DIR.glob("*.jsonl")
    )

    for file_path in files:
        with file_path.open(
            "r",
            encoding="utf-8",
        ) as f:

            for line in f:
                if not line.strip():
                    continue

                attempt = json.loads(line)

                label = attempt["label"]

                for frame in attempt["frames"]:
                    if len(frame) != 132:
                        continue

                    if not np.all(
                        np.isfinite(frame)
                    ):
                        continue

                    X.append(frame)
                    y.append(label)

    return (
        np.asarray(X, dtype=np.float32),
        np.asarray(y),
    )


def main():
    X, y = load_data()

    print(
        f"Training on {len(X)} frames"
    )

    print(
        f"Labels: {sorted(set(y))}"
    )

    model = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        max_iter=500,
        random_state=42,
    )

    model.fit(X, y)

    print(
        "Model classes:",
        list(model.classes_)
    )

    with open(
        MODEL_DIR / "bisindo-mlp.pkl",
        "wb",
    ) as f:
        pickle.dump(model, f)

    print("Model trained and saved.")


if __name__ == "__main__":
    main()