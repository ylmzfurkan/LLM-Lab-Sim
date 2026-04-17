export interface ScoringPreviewInput {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  fp16: boolean;
  dataQuality: number;
  modelSize?: string;
}

export interface ScoringPreviewResult {
  trainingStability: number;
  lrAssessment: "optimal" | "suboptimal" | "dangerous";
  overfittingRisk: "low" | "medium" | "high";
  convergencePrediction: "fast" | "normal" | "slow";
}

export function previewTrainingStability(input: ScoringPreviewInput): ScoringPreviewResult {
  const { epochs, batchSize, learningRate, optimizer, dataQuality, modelSize = "medium" } = input;

  const idealLr: Record<string, number> = { small: 3e-4, medium: 1e-4, large: 3e-5 };
  const ideal = idealLr[modelSize] ?? 1e-4;
  const lrRatio = learningRate / ideal;

  let stability = 50.0;

  if (lrRatio >= 0.5 && lrRatio <= 2.0) {
    stability += 15;
  } else if (lrRatio >= 0.2 && lrRatio <= 5.0) {
    stability += 5;
  } else {
    stability -= 20;
  }
  if (lrRatio > 10) stability -= 30;

  const optBonus: Record<string, number> = { adamw: 10, adam: 8, adafactor: 7, sgd: 0 };
  stability += optBonus[optimizer] ?? 5;

  if (epochs >= 2 && epochs <= 5) {
    stability += 10;
  } else if (epochs === 1) {
    stability -= 5;
  } else if (epochs > 10) {
    stability -= 10;
  }

  const isPowerOfTwo = batchSize >= 1 && (batchSize & (batchSize - 1)) === 0;
  if (batchSize >= 16 && isPowerOfTwo) {
    stability += 5;
  } else if (batchSize < 8) {
    stability -= 10;
  }

  stability += (dataQuality - 50) * 0.2;
  stability = Math.max(0, Math.min(100, stability));

  const lrAssessment: ScoringPreviewResult["lrAssessment"] =
    lrRatio >= 0.5 && lrRatio <= 2.0 ? "optimal" : lrRatio >= 0.2 && lrRatio <= 5.0 ? "suboptimal" : "dangerous";

  const overfittingRisk: ScoringPreviewResult["overfittingRisk"] =
    epochs <= 3 ? "low" : epochs <= 7 ? "medium" : "high";

  const convergencePrediction: ScoringPreviewResult["convergencePrediction"] =
    stability >= 70 ? "fast" : stability >= 50 ? "normal" : "slow";

  return { trainingStability: stability, lrAssessment, overfittingRisk, convergencePrediction };
}
