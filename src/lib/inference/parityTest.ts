import {
  loadBisindoModel,
} from "./loadModel";

import {
  predictBisindo,
} from "./mlp";

type ParitySample = {
  features: number[];
  true_label: string;
  classes: string[];
  python_probabilities: number[];
  python_raw_label: string;
  python_confidence: number;
  python_final_label: string;
  threshold: number;
};

export async function runParityTest() {
  const model =
    await loadBisindoModel();

  const response = await fetch(
    "/models/parity-sample.json"
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load parity sample"
    );
  }

  const sample: ParitySample =
    await response.json();

  const result = predictBisindo(
    sample.features,
    model
  );

  console.log(
    "=== BISINDO PARITY TEST ==="
  );

  console.log(
    "True label:",
    sample.true_label
  );

  console.log(
    "Python final label:",
    sample.python_final_label
  );

  console.log(
    "TypeScript final label:",
    result.label
  );

  console.log(
    "Python confidence:",
    sample.python_confidence
  );

  console.log(
    "TypeScript confidence:",
    result.confidence
  );

  console.log(
    "Python probabilities:",
    sample.python_probabilities
  );

  console.log(
    "TypeScript probabilities:",
    result.probabilities
  );

  const maxDifference = Math.max(
    ...sample.python_probabilities.map(
      (pythonValue, index) =>
        Math.abs(
          pythonValue
          - result.probabilities[index]
        )
    )
  );

  console.log(
    "Max probability difference:",
    maxDifference
  );

  console.log(
    "Labels match:",
    sample.python_final_label
      === result.label
  );
}