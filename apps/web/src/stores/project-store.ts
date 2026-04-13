import { create } from "zustand";
import type { Project, SimulationScores } from "@/types/project";

interface ProjectStore {
  project: Project | null;
  scores: SimulationScores;
  datasetId: string | null;
  setProject: (project: Project | null) => void;
  updateScores: (scores: Partial<SimulationScores>) => void;
  updateStep: (step: number) => void;
  setDatasetId: (id: string) => void;
  reset: () => void;
}

const defaultScores: SimulationScores = {
  data_quality: 0,
  training_stability: 0,
  model_performance: 0,
  cost_efficiency: 0,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  scores: defaultScores,
  datasetId: null,
  setProject: (project) => set({ project }),
  updateScores: (scores) =>
    set((state) => ({
      scores: { ...state.scores, ...scores },
    })),
  updateStep: (step) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, current_step: step }
        : null,
    })),
  setDatasetId: (id) => set({ datasetId: id }),
  reset: () => set({ project: null, scores: defaultScores, datasetId: null }),
}));
