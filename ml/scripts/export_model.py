from pathlib import Path
import json
import pickle


MODEL_DIR = (
    Path(__file__).resolve().parents[1]
    / "models"
)

MODEL_PATH = MODEL_DIR / "bisindo-mlp.pkl"

EXPORT_PATH = MODEL_DIR / "bisindo-v1.json"

CONFIDENCE_THRESHOLD = 0.60


def main():
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    exported = {
        "version": "bisindo-v1",
        "input_size": model.n_features_in_,
        "hidden_layers": list(
            model.hidden_layer_sizes
        ),
        "classes": [
            str(label)
            for label in model.classes_
        ],
        "threshold": CONFIDENCE_THRESHOLD,
        "activation": model.activation,
        "output_activation": model.out_activation_,
        "weights": [
            matrix.tolist()
            for matrix in model.coefs_
        ],
        "biases": [
            vector.tolist()
            for vector in model.intercepts_
        ],
    }

    with open(
        EXPORT_PATH,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            exported,
            f,
            separators=(",", ":"),
        )

    print("Exported model")
    print("----------------")
    print(f"Input size: {exported['input_size']}")
    print(f"Hidden layers: {exported['hidden_layers']}")
    print(f"Classes: {exported['classes']}")
    print(f"Threshold: {exported['threshold']}")
    print(f"Activation: {exported['activation']}")
    print(
        f"Output activation: "
        f"{exported['output_activation']}"
    )

    print()
    print("Weight shapes:")

    for i, matrix in enumerate(model.coefs_):
        print(
            f"  Layer {i}: "
            f"{matrix.shape}"
        )

    print()
    print(
        f"Saved to: {EXPORT_PATH}"
    )


if __name__ == "__main__":
    main()