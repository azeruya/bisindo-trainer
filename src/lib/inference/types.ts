export type BisindoModel = {
  version: string;
  input_size: number;
  hidden_layers: number[];
  classes: string[];
  threshold: number;
  activation: string;
  output_activation: string;
  weights: number[][][];
  biases: number[][];
};

export type Prediction = {
  label: string;
  confidence: number;
  probabilities: number[];
};