import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Project, SimulationScores } from "@/types/project";

type StepSelections = Record<string, Record<string, unknown>>;

interface ProjectStore {
  project: Project | null;
  scores: SimulationScores;
  datasetId: string | null;
  stepSelections: StepSelections;
  setProject: (project: Project | null) => void;
  updateScores: (scores: Partial<SimulationScores>) => void;
  updateStep: (step: number) => void;
  setDatasetId: (id: string) => void;
  setStepSelection: (step: string, values: Record<string, unknown>) => void;
  getStepSelection: <T = Record<string, unknown>>(step: string) => T | undefined;
  reset: () => void;
}

const defaultScores: SimulationScores = {
  data_quality: 0,
  training_stability: 0,
  model_performance: 0,
  cost_efficiency: 0,
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: null,
      scores: defaultScores,
      datasetId: null,
      stepSelections: {},
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
      setStepSelection: (step, values) =>
        set((state) => ({
          stepSelections: {
            ...state.stepSelections,
            [step]: { ...(state.stepSelections[step] ?? {}), ...values },
          },
        })),
      getStepSelection: <T = Record<string, unknown>>(step: string) =>
        get().stepSelections[step] as T | undefined,
      reset: () =>
        set({
          project: null,
          scores: defaultScores,
          datasetId: null,
          stepSelections: {},
        }),
    }),
    {
      name: "llmlab.project-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        scores: state.scores,
        datasetId: state.datasetId,
        stepSelections: state.stepSelections,
      }),
    }
  )
);
