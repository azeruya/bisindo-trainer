import type {
  BisindoModel,
  Prediction,
} from "./types";

function relu(values: number[]): number[] {
  return values.map((value) =>
    Math.max(0, value)
  );
}

function softmax(values: number[]): number[] {
  const maxValue = Math.max(...values);

  const exps = values.map((value) =>
    Math.exp(value - maxValue)
  );

  const total = exps.reduce(
    (sum, value) => sum + value,
    0
  );

  return exps.map(
    (value) => value / total
  );
}

function dense(
  input: number[],
  weights: number[][],
  biases: number[]
): number[] {
  const outputSize = biases.length;

  const output = new Array<number>(
    outputSize
  ).fill(0);

  for (let j = 0; j < outputSize; j++) {
    let value = biases[j];

    for (let i = 0; i < input.length; i++) {
      value += input[i] * weights[i][j];
    }

    output[j] = value;
  }

  return output;
}

export function predictBisindo(
  features: number[],
  model: BisindoModel
): Prediction {
  if (features.length !== model.input_size) {
    throw new Error(
      `Expected ${model.input_size} features, got ${features.length}`
    );
  }

  let output = dense(
    features,
    model.weights[0],
    model.biases[0]
  );

  output = relu(output);

  output = dense(
    output,
    model.weights[1],
    model.biases[1]
  );

  output = relu(output);

  output = dense(
    output,
    model.weights[2],
    model.biases[2]
  );

  const probabilities = softmax(output);

  let bestIndex = 0;

  for (
    let i = 1;
    i < probabilities.length;
    i++
  ) {
    if (
      probabilities[i]
      > probabilities[bestIndex]
    ) {
      bestIndex = i;
    }
  }

  const confidence =
    probabilities[bestIndex];

  let label =
    model.classes[bestIndex];

  if (
    confidence < model.threshold
  ) {
    label = "no_sign";
  }

  return {
    label,
    confidence,
    probabilities,
  };
}