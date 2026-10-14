from pathlib import Path
import json

import numpy as np

from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    recall_score,
)

from collections import Counter


DATA_DIR = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "bisindo-v1"
)

TEST_SIGNER = "s04"

THRESHOLDS = [
    0.50,
    0.60,
    0.70,
    0.75,
    0.80,
    0.85,
    0.90,
    0.95,
]

def load_jsonl_files(data_dir: Path):
    X = []
    y = []
    attempt_ids = []
    session_ids = []
    signer_ids = []

    files = sorted(data_dir.glob("*.jsonl"))

    if not files:
        raise FileNotFoundError(
            f"No .jsonl files found in: {data_dir}"
        )

    print(f"Found {len(files)} JSONL file(s)")

    for file_path in files:
        print(f"Loading {file_path.name}")

        with file_path.open(
            "r",
            encoding="utf-8",
        ) as f:
            for line in f:
                line = line.strip()

                if not line:
                    continue

                attempt = json.loads(line)

                label = attempt["label"]
                attempt_id = attempt["attempt_id"]
                session_id = attempt["session_id"]
                signer_id = attempt["signer_id"]
                frames = attempt["frames"]

                for frame in frames:
                    if len(frame) != 132:
                        print(
                            f"Skipping frame with "
                            f"length {len(frame)} "
                            f"in attempt {attempt_id}"
                        )
                        continue

                    if not np.all(np.isfinite(frame)):
                        print(
                            f"Skipping non-finite frame "
                            f"in attempt {attempt_id}"
                        )
                        continue

                    X.append(frame)
                    y.append(label)
                    attempt_ids.append(attempt_id)
                    session_ids.append(session_id)
                    signer_ids.append(signer_id)

    return (
        np.asarray(X, dtype=np.float32),
        np.asarray(y),
        np.asarray(attempt_ids),
        np.asarray(session_ids),
        np.asarray(signer_ids),
    )


def print_dataset_summary(
    X,
    y,
    attempt_ids,
    session_ids,
    signer_ids,
):
    print()
    print("Dataset summary")
    print("----------------")
    print(f"Frames: {len(X)}")
    print(f"Features per frame: {X.shape[1]}")
    print(
        f"Labels: "
        f"{sorted(map(str, set(y)))}"
    )
    print(
        f"Attempts: "
        f"{len(set(attempt_ids))}"
    )
    print(
        f"Sessions: "
        f"{len(set(session_ids))}"
    )
    print(
        f"Signers: "
        f"{len(set(signer_ids))}"
    )

    print()

    for label in sorted(set(y)):
        mask = y == label

        print(
            f"{label}: "
            f"{np.sum(mask)} frames, "
            f"{len(set(attempt_ids[mask]))} attempts"
        )

    print()
    print("Sessions found:")

    for session in sorted(set(session_ids)):
        mask = session_ids == session

        print(
            f"  {session}: "
            f"{np.sum(mask)} frames, "
            f"{len(set(attempt_ids[mask]))} attempts"
        )


def split_by_session(
    X,
    y,
    session_ids,
):
    sessions = sorted(set(session_ids))

    if len(sessions) != 2:
        raise ValueError(
            "Session split currently expects exactly "
            f"2 sessions, but found {len(sessions)}:\n"
            + "\n".join(map(str, sessions))
        )

    train_session = sessions[0]
    test_session = sessions[1]

    train_mask = session_ids == train_session
    test_mask = session_ids == test_session

    print()
    print("Session split")
    print("-------------")
    print(f"TRAIN: {train_session}")
    print(f"TEST : {test_session}")

    return (
        X[train_mask],
        X[test_mask],
        y[train_mask],
        y[test_mask],
    )

def split_by_signer(
    X,
    y,
    attempt_ids,
    signer_ids,
    test_signer,
):
    signers = sorted(set(signer_ids))

    if test_signer not in signers:
        raise ValueError(
            f"Unknown test signer: {test_signer}. "
            f"Available signers: {signers}"
        )

    train_mask = signer_ids != test_signer
    test_mask = signer_ids == test_signer

    train_signers = sorted(
        set(signer_ids[train_mask])
    )

    print()
    print("Signer split")
    print("------------")
    print(
        f"TRAIN: {', '.join(map(str, train_signers))}"
    )
    print(f"TEST : {test_signer}")

    return (
        X[train_mask],
        X[test_mask],
        y[train_mask],
        y[test_mask],
        attempt_ids[train_mask],
        attempt_ids[test_mask],
    )

def evaluate_attempt_level(
    y_true,
    y_pred,
    attempt_ids,
):
    correct = 0
    total = 0

    print()
    print("Attempt-level evaluation")
    print("------------------------")

    for attempt_id in sorted(set(attempt_ids)):
        mask = attempt_ids == attempt_id

        true_labels = y_true[mask]
        predicted_labels = y_pred[mask]

        true_label = Counter(true_labels).most_common(1)[0][0]
        predicted_label = Counter(predicted_labels).most_common(1)[0][0]

        is_correct = true_label == predicted_label

        if is_correct:
            correct += 1

        total += 1

        print(
            f"{attempt_id}: "
            f"true={true_label}, "
            f"pred={predicted_label}, "
            f"{'✓' if is_correct else '✗'}"
        )

    accuracy = correct / total if total else 0.0

    print()
    print(
        f"Attempt accuracy: "
        f"{correct}/{total} = {accuracy:.4f}"
    )

    return accuracy


def evaluate_model(
    name,
    model,
    X_train,
    X_test,
    y_train,
    y_test,
    attempt_ids_test,
):
    print()
    print("=" * 60)
    print(name)
    print("=" * 60)

    model.fit(
        X_train,
        y_train,
    )

    evaluate_thresholds(
        model,
        X_test,
        y_test,
        attempt_ids_test,
        THRESHOLDS,
    )

    probabilities = model.predict_proba(X_test)

    best_indices = np.argmax(
        probabilities,
        axis=1,
    )

    confidences = np.max(
        probabilities,
        axis=1,
    )

    predictions = model.classes_[
        best_indices
    ]

    CONFIDENCE_THRESHOLD = 0.60

    predictions = np.where(
        confidences >= CONFIDENCE_THRESHOLD,
        predictions,
        "no_sign",
    )

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    labels = sorted(
        set(y_train) | set(y_test)
    )

    print()
    print(
        f"Detailed evaluation "
        f"(threshold={CONFIDENCE_THRESHOLD:.2f})"
    )

    print(
        f"Accuracy: {accuracy:.4f}"
    )

    print()
    print("Classification report:")

    print(
        classification_report(
            y_test,
            predictions,
            labels=labels,
            zero_division=0,
        )
    )

    print("Confusion matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions,
            labels=labels,
        )
    )

    print("Label order:")
    print(
        list(map(str, labels))
    )

    evaluate_no_sign(
        y_test,
        predictions,
    )

    evaluate_attempt_level(
        y_test,
        predictions,
        attempt_ids_test,
    )

def evaluate_no_sign(y_true, y_pred):
    no_sign_mask = y_true == "no_sign"

    total_no_sign = no_sign_mask.sum()

    if total_no_sign == 0:
        print("No no_sign samples in test set.")
        return

    false_accepts = (
        y_pred[no_sign_mask] != "no_sign"
    ).sum()

    false_accept_rate = false_accepts / total_no_sign

    print()
    print("NO_SIGN evaluation")
    print("------------------")
    print(f"NO_SIGN samples: {total_no_sign}")
    print(f"False accepts: {false_accepts}")
    print(f"False accept rate: {false_accept_rate:.4f}")

def get_attempt_accuracy(
    y_true,
    y_pred,
    attempt_ids,
):
    correct = 0
    total = 0

    for attempt_id in sorted(set(attempt_ids)):
        mask = attempt_ids == attempt_id

        true_labels = y_true[mask]
        predicted_labels = y_pred[mask]

        true_label = Counter(
            true_labels
        ).most_common(1)[0][0]

        predicted_label = Counter(
            predicted_labels
        ).most_common(1)[0][0]

        if true_label == predicted_label:
            correct += 1

        total += 1

    return correct / total if total else 0.0

def evaluate_thresholds(
    model,
    X_test,
    y_test,
    attempt_ids_test,
    thresholds,
):
    probabilities = model.predict_proba(X_test)

    best_indices = np.argmax(
        probabilities,
        axis=1,
    )

    confidences = np.max(
        probabilities,
        axis=1,
    )

    base_predictions = model.classes_[
        best_indices
    ]

    valid_mask = y_test != "no_sign"
    no_sign_mask = y_test == "no_sign"

    print()
    print("Threshold sweep")
    print("-" * 78)

    print(
        f"{'Threshold':<10}"
        f"{'Accuracy':<12}"
        f"{'Macro F1':<12}"
        f"{'Valid Recall':<15}"
        f"{'NO_SIGN FAR':<15}"
        f"{'Attempt Acc':<12}"
    )

    print("-" * 78)

    for threshold in thresholds:
        predictions = np.where(
            confidences >= threshold,
            base_predictions,
            "no_sign",
        )

        accuracy = accuracy_score(
            y_test,
            predictions,
        )

        macro_f1 = f1_score(
            y_test,
            predictions,
            average="macro",
            zero_division=0,
        )

        # Recall among actual valid signs only.
        valid_labels = sorted(
            label
            for label in set(y_test)
            if label != "no_sign"
        )

        valid_recall = recall_score(
            y_test[valid_mask],
            predictions[valid_mask],
            labels=valid_labels,
            average="macro",
            zero_division=0,
        )

        if np.sum(no_sign_mask) > 0:
            false_accepts = np.sum(
                predictions[no_sign_mask]
                != "no_sign"
            )

            no_sign_far = (
                false_accepts
                / np.sum(no_sign_mask)
            )
        else:
            no_sign_far = 0.0

        attempt_accuracy = get_attempt_accuracy(
            y_test,
            predictions,
            attempt_ids_test,
        )

        print(
            f"{threshold:<10.2f}"
            f"{accuracy:<12.4f}"
            f"{macro_f1:<12.4f}"
            f"{valid_recall:<15.4f}"
            f"{no_sign_far:<15.4f}"
            f"{attempt_accuracy:<12.4f}"
        )


def main():
    (
        X,
        y,
        attempt_ids,
        session_ids,
        signer_ids,
    ) = load_jsonl_files(DATA_DIR)

    print_dataset_summary(
        X,
        y,
        attempt_ids,
        session_ids,
        signer_ids,
    )

    (
        X_train,
        X_test,
        y_train,
        y_test,
        attempt_train,
        attempt_test,
    ) = split_by_signer(
        X,
        y,
        attempt_ids,
        signer_ids,
        test_signer=TEST_SIGNER,
    )

    train_labels = set(y_train)
    test_labels = set(y_test)

    missing_in_test = train_labels - test_labels
    missing_in_train = test_labels - train_labels

    if missing_in_test:
        print("WARNING missing from test:", sorted(missing_in_test))

    if missing_in_train:
        print("WARNING missing from train:", sorted(missing_in_train))

    print()
    print("Split sizes")
    print("-----------")
    print(
        f"Train frames: {len(X_train)}"
    )
    print(
        f"Test frames: {len(X_test)}"
    )

    print()
    print(
        "Train label counts:"
    )

    for label in sorted(set(y_train)):
        print(
            f"  {label}: "
            f"{np.sum(y_train == label)}"
        )

    print(
        "Test label counts:"
    )

    for label in sorted(set(y_test)):
        print(
            f"  {label}: "
            f"{np.sum(y_test == label)}"
        )

    knn = KNeighborsClassifier(
        n_neighbors=5,
    )

    rf = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
    )

    mlp = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        max_iter=500,
        random_state=42,
    )

    evaluate_model(
        "k-Nearest Neighbors",
        knn,
        X_train,
        X_test,
        y_train,
        y_test,
        attempt_test,
    )

    evaluate_model(
        "Random Forest",
        rf,
        X_train,
        X_test,
        y_train,
        y_test,
        attempt_test,
    )

    evaluate_model(
        "MLP",
        mlp,
        X_train,
        X_test,
        y_train,
        y_test,
        attempt_test,
    )


if __name__ == "__main__":
    main()