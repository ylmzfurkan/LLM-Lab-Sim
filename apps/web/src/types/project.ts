export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "in_progress" | "completed";
  current_step: number;
  model_purpose: string | null;
  target_domain: string | null;
  model_language: string | null;
  model_type: string | null;
}

export interface SimulationScores {
  data_quality: number;
  training_stability: number;
  model_performance: number;
  cost_efficiency: number;
}

export const PROJECT_STEPS = [
  { key: "wizard", path: "wizard", number: 1 },
  { key: "dataset", path: "dataset", number: 2 },
  { key: "cleaning", path: "cleaning", number: 3 },
  { key: "tokenizer", path: "tokenizer", number: 4 },
  { key: "architecture", path: "architecture", number: 5 },
  { key: "trainingConfig", path: "training-config", number: 6 },
  { key: "training", path: "training", number: 7 },
  { key: "report", path: "report", number: 8 },
  { key: "customization", path: "customization", number: 9 },
  { key: "rag", path: "rag", number: 10 },
  { key: "fineTune", path: "fine-tune", number: 11 },
  { key: "playground", path: "playground", number: 12 },
  { key: "evaluation", path: "evaluation", number: 13 },
  { key: "deployment", path: "deployment", number: 14 },
] as const;

export type StepKey = (typeof PROJECT_STEPS)[number]["key"];
