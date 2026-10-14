export type SmoothedPrediction = {
  label: string;
  agreement: number;
};

export function smoothLabels(
  labels: string[],
  minAgreement = 0.7
): SmoothedPrediction {
  if (labels.length === 0) {
    return {
      label: "no_sign",
      agreement: 0,
    };
  }

  const counts = new Map<string, number>();

  for (const label of labels) {
    counts.set(
      label,
      (counts.get(label) ?? 0) + 1
    );
  }

  let bestLabel = "no_sign";
  let bestCount = 0;

  for (const [label, count] of counts) {
    if (count > bestCount) {
      bestLabel = label;
      bestCount = count;
    }
  }

  const agreement =
    bestCount / labels.length;

  if (agreement < minAgreement) {
    return {
      label: "no_sign",
      agreement,
    };
  }

  return {
    label: bestLabel,
    agreement,
  };
}