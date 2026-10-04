from pathlib import Path
import json

import numpy as np

from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from collections import Counter


DATA_DIR = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "smoke-test"
)


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
):
    signers = sorted(set(signer_ids))

    if len(signers) != 2:
        raise ValueError(
            "Signer split currently expects exactly "
            f"2 signers, but found {len(signers)}:\n"
            + "\n".join(map(str, signers))
        )

    train_signer = signers[0]
    test_signer = signers[1]

    train_mask = signer_ids == train_signer
    test_mask = signer_ids == test_signer

    print()
    print("Signer split")
    print("------------")
    print(f"TRAIN: {train_signer}")
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

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    labels = sorted(
        set(y_train) | set(y_test)
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
    )

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


if __name__ == "__main__":
    main()