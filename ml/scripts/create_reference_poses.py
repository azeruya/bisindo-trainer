import json
from pathlib import Path
from collections import Counter

import numpy as np


DATA_DIR = Path("ml/data/bisindo-v1")
OUTPUT_PATH = Path("public/guides/reference-poses.json")

LETTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "P",
    "T",
]

LANDMARK_VALUES_PER_HAND = 21 * 3

HAND_0_START = 0
HAND_0_END = 63

HAND_1_START = 63
HAND_1_END = 126

PRESENCE_0_INDEX = 126
PRESENCE_1_INDEX = 127


def load_frames():
    by_label = {
        label: []
        for label in LETTERS
    }

    for path in DATA_DIR.glob("*.jsonl"):
        with path.open() as file:
            for line in file:
                record = json.loads(line)

                label = record["label"]

                if label not in by_label:
                    continue

                for frame in record["frames"]:
                    if len(frame) != 132:
                        continue

                    by_label[label].append(
                        np.asarray(
                            frame,
                            dtype=np.float64,
                        )
                    )

    return by_label


def presence_pattern(frame):
    return (
        int(round(frame[PRESENCE_0_INDEX])),
        int(round(frame[PRESENCE_1_INDEX])),
    )


def choose_representative_frame(frames):
    """
    Find an actual frame close to the median pose.

    We first select the most common hand-presence pattern
    so an unusual tracking frame is not selected.
    """

    patterns = [
        presence_pattern(frame)
        for frame in frames
    ]

    dominant_pattern = Counter(
        patterns
    ).most_common(1)[0][0]

    candidates = [
        frame
        for frame in frames
        if presence_pattern(frame)
        == dominant_pattern
    ]

    matrix = np.stack(candidates)

    # Use the landmark coordinates only.
    landmark_matrix = matrix[:, :126]

    median_pose = np.median(
        landmark_matrix,
        axis=0,
    )

    distances = np.linalg.norm(
        landmark_matrix - median_pose,
        axis=1,
    )

    best_index = np.argmin(
        distances
    )

    return (
        candidates[best_index],
        dominant_pattern,
    )


def decode_hand(values):
    hand = []

    for i in range(21):
        start = i * 3

        hand.append({
            "x": float(values[start]),
            "y": float(values[start + 1]),
            "z": float(values[start + 2]),
        })

    return hand


def main():
    frames_by_label = load_frames()

    poses = {}

    for label in LETTERS:
        frames = frames_by_label[label]

        if not frames:
            raise RuntimeError(
                f"No frames found for {label}"
            )

        frame, presence = (
            choose_representative_frame(
                frames
            )
        )

        hands = []

        if presence[0]:
            hands.append({
                "slot": 0,
                "landmarks": decode_hand(
                    frame[
                        HAND_0_START:
                        HAND_0_END
                    ]
                ),
            })

        if presence[1]:
            hands.append({
                "slot": 1,
                "landmarks": decode_hand(
                    frame[
                        HAND_1_START:
                        HAND_1_END
                    ]
                ),
            })

        poses[label] = {
            "hands": hands,
            "source_frame_count": len(frames),
        }

        print(
            label,
            "frames:",
            len(frames),
            "hands:",
            presence,
        )

    payload = {
        "version": "bisindo-reference-v1",
        "poses": poses,
    }

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with OUTPUT_PATH.open(
        "w"
    ) as file:
        json.dump(
            payload,
            file,
            indent=2,
        )

    print(
        "\nSaved:",
        OUTPUT_PATH
    )


if __name__ == "__main__":
    main()