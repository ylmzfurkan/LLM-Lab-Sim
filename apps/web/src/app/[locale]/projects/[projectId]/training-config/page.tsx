"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  ArrowRight,
  Loader2,
  Settings,
  GraduationCap,
  Wrench,
  Gauge,
  AlertTriangle,
  TrendingUp,
  Zap,
  Info,
} from "lucide-react";

const OPTIMIZER_OPTIONS = ["adamw", "adam", "adafactor", "sgd"] as const;
const BATCH_SIZE_OPTIONS = [8, 16, 32, 64, 128] as const;
const LR_OPTIONS = [
  { label: "1e-5", value: 0.00001 },
  { label: "3e-5", value: 0.00003 },
  { label: "5e-5", value: 0.00005 },
  { label: "1e-4", value: 0.0001 },
  { label: "3e-4", value: 0.0003 },
  { label: "5e-4", value: 0.0005 },
  { label: "1e-3", value: 0.001 },
] as const;

interface ConfigResult {
  training_stability: number;
  lr_assessment: string;
  convergence_prediction: string;
  overfitting_risk: string;
}

export default function TrainingConfigurationPage() {
  const t = useTranslations("trainingConfig");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);
  const setStepSelection = useProjectStore((s) => s.setStepSelection);
  const getInitial = () => useProjectStore.getState().stepSelections.trainingConfig ?? {};

  const [mode, setModeState] = useState<"beginner" | "advanced">(
    () => (getInitial().mode as "beginner" | "advanced") ?? "beginner"
  );
  const [epochs, setEpochsState] = useState(() => (getInitial().epochs as number) ?? 3);
  const [batchSize, setBatchSizeState] = useState(() => (getInitial().batchSize as number) ?? 32);
  const [lrIndex, setLrIndexState] = useState(() => (getInitial().lrIndex as number) ?? 3);
  const [optimizer, setOptimizerState] = useState(() => (getInitial().optimizer as string) ?? "adamw");
  const [fp16, setFp16State] = useState(() => (getInitial().fp16 as boolean) ?? true);
  const setMode = (v: "beginner" | "advanced") => { setModeState(v); setStepSelection("trainingConfig", { mode: v }); };
  const setEpochs = (v: number) => { setEpochsState(v); setStepSelection("trainingConfig", { epochs: v }); };
  const setBatchSize = (v: number) => { setBatchSizeState(v); setStepSelection("trainingConfig", { batchSize: v }); };
  const setLrIndex = (v: number) => { setLrIndexState(v); setStepSelection("trainingConfig", { lrIndex: v }); };
  const setOptimizer = (v: string) => { setOptimizerState(v); setStepSelection("trainingConfig", { optimizer: v }); };
  const setFp16 = (v: boolean) => { setFp16State(v); setStepSelection("trainingConfig", { fp16: v }); };
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConfigResult | null>(null);

  const learningRate = LR_OPTIONS[lrIndex].value;

  async function handleApply() {
    setLoading(true);

    try {
      const data = await apiPost<ConfigResult>(
        `/api/projects/${params.projectId}/model-config/training`,
        {
          mode,
          epochs,
          batch_size: batchSize,
          learning_rate: learningRate,
          optimizer,
          fp16,
        }
      );
      setResult(data);
      updateScores({ training_stability: data.training_stability });
      updateStep(7);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      const mockResult: ConfigResult = {
        training_stability: 72,
        lr_assessment: "optimal",
        convergence_prediction: "fast",
        overfitting_risk: "low",
      };
      setResult(mockResult);
      updateScores({ training_stability: mockResult.training_stability });
      updateStep(7);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/training`);
  }

  function assessmentColor(value: string) {
    if (value === "optimal" || value === "fast" || value === "low") return "text-green-500";
    if (value === "suboptimal" || value === "normal" || value === "medium") return "text-yellow-500";
    return "text-red-500";
  }

  function assessmentBg(value: string) {
    if (value === "optimal" || value === "fast" || value === "low") return "bg-green-500/10 text-green-500 hover:bg-green-500/10";
    if (value === "suboptimal" || value === "normal" || value === "medium") return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10";
    return "bg-red-500/10 text-red-500 hover:bg-red-500/10";
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={6} />
      <ConceptCard stepKey="trainingConfig" />

      <div className="space-y-8">
        {/* Mode Selection */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("mode")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("modeDescription")}</p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                mode === "beginner" && "border-primary ring-1 ring-primary"
              )}
              onClick={() => setMode("beginner")}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-medium">{tCommon("beginner")}</span>
              </CardContent>
            </Card>
            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                mode === "advanced" && "border-primary ring-1 ring-primary"
              )}
              onClick={() => setMode("advanced")}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Wrench className="h-5 w-5" />
                <span className="text-sm font-medium">{tCommon("advanced")}</span>
              </CardContent>
            </Card>
          </div>
          {mode === "beginner" && (
            <p className="text-xs text-muted-foreground mt-3 ml-1">{t("presetApplied")}</p>
          )}
        </section>

        {/* Hyperparameters */}
        {mode === "advanced" && (
          <>
            {/* Epochs */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{t("epochs")}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    {t("epochsHint")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t("epochsDescription")}</p>
              <div className="max-w-md space-y-2">
                <Slider value={[epochs]} onValueChange={(v) => setEpochs(v[0])} min={1} max={20} step={1} />
                <span className="text-sm font-mono">{epochs}</span>
              </div>
            </section>

            {/* Batch Size */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{t("batchSize")}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    {t("batchSizeHint")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t("batchSizeDescription")}</p>
              <div className="grid grid-cols-5 gap-3 max-w-md">
                {BATCH_SIZE_OPTIONS.map((bs) => (
                  <Card
                    key={bs}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      batchSize === bs && "border-primary ring-1 ring-primary"
                    )}
                    onClick={() => setBatchSize(bs)}
                  >
                    <CardContent className="flex items-center justify-center p-3">
                      <span className="text-sm font-mono font-medium">{bs}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Learning Rate */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{t("learningRate")}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    {t("lrHint")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t("learningRateDescription")}</p>
              <div className="max-w-md space-y-2">
                <Slider value={[lrIndex]} onValueChange={(v) => setLrIndex(v[0])} min={0} max={LR_OPTIONS.length - 1} step={1} />
                <span className="text-sm font-mono">{LR_OPTIONS[lrIndex].label}</span>
              </div>
            </section>

            {/* Optimizer */}
            <section>
              <h3 className="text-lg font-semibold mb-1">{t("optimizer")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("optimizerDescription")}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl">
                {OPTIMIZER_OPTIONS.map((opt) => (
                  <Card
                    key={opt}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 relative",
                      optimizer === opt && "border-primary ring-1 ring-primary"
                    )}
                    onClick={() => setOptimizer(opt)}
                  >
                    <CardContent className="flex items-center justify-center p-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="absolute top-1 right-1 text-muted-foreground/50 hover:text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t(`optimizerHints.${opt}`)}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-medium">{t(`optimizers.${opt}`)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* FP16 */}
            <section>
              <Card className={cn("max-w-xl transition-all", fp16 && "border-primary/30")}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium">{t("fp16")}</div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("fp16Hint")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("fp16Description")}</div>
                  </div>
                  <Switch checked={fp16} onCheckedChange={setFp16} />
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* Apply Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={loading} onClick={handleApply}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings className="mr-2 h-4 w-4" />
              )}
              {tCommon("apply")}
            </Button>
          </div>
        )}

        {/* Assessment Results */}
        {result && (
          <section>
            <h3 className="text-lg font-semibold mb-4">{t("assessment")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("stabilityScore")}</span>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold font-mono",
                    result.training_stability >= 70 ? "text-green-500" :
                    result.training_stability >= 50 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {result.training_stability.toFixed(0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">{t("lrAssessment")}</span>
                  <div className="mt-2">
                    <Badge className={assessmentBg(result.lr_assessment)}>
                      {t(`lrValues.${result.lr_assessment}`)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("convergencePrediction")}</span>
                  </div>
                  <Badge className={assessmentBg(result.convergence_prediction)}>
                    {t(`convergenceValues.${result.convergence_prediction}`)}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("overfittingRisk")}</span>
                  </div>
                  <Badge className={assessmentBg(result.overfitting_risk)}>
                    {t(`riskValues.${result.overfitting_risk}`)}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between pt-4 border-t mt-6">
              <BackButton currentStep={6} />
              <Button size="lg" onClick={handleNext}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {tCommon("next")}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
