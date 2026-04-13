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
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BackButton } from "@/components/shared/step-navigation";
import {
  ArrowRight,
  Loader2,
  Wrench,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface FineTuneResult {
  accuracy_before: number;
  accuracy_after: number;
  accuracy_improvement: number;
  hallucination_before: number;
  hallucination_after: number;
  dataset_split: { train: number; validation: number; test: number };
}

export default function FineTuneSimulatorPage() {
  const t = useTranslations("fineTune");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);

  const [epochs, setEpochs] = useState(3);
  const [lrIndex, setLrIndex] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FineTuneResult | null>(null);

  const LR_VALUES = [1e-5, 1e-5, 2e-5, 5e-5, 1e-4];
  const LR_LABELS = ["1e-5", "1e-5", "2e-5", "5e-5", "1e-4"];
  const finetuneLr = LR_VALUES[lrIndex];

  async function handleRun() {
    setLoading(true);

    try {
      const data = await apiPost<FineTuneResult>(
        `/api/projects/${params.projectId}/simulate/finetune`,
        { finetune_epochs: epochs, finetune_lr: finetuneLr }
      );
      setResult(data);
      updateScores({ model_performance: data.accuracy_after });
      updateStep(12);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      const mockResult: FineTuneResult = {
        accuracy_before: 58,
        accuracy_after: 73.5,
        accuracy_improvement: 15.5,
        hallucination_before: 42,
        hallucination_after: 29.6,
        dataset_split: { train: 0.8, validation: 0.1, test: 0.1 },
      };
      setResult(mockResult);
      updateScores({ model_performance: mockResult.accuracy_after });
      updateStep(12);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/playground`);
  }

  const chartData = result
    ? [
        { name: t("accuracyBefore"), before: result.accuracy_before, after: result.accuracy_after },
        { name: t("hallucinationBefore"), before: result.hallucination_before, after: result.hallucination_after },
      ]
    : [];

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={11} />
      <ConceptCard stepKey="fineTune" />

      <div className="space-y-8">
        {/* Epochs */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("finetuneEpochs")}</h3>
          <div className="max-w-md space-y-2">
            <Slider value={[epochs]} onValueChange={(v) => setEpochs(v[0])} min={1} max={10} step={1} />
            <span className="text-sm font-mono">{epochs}</span>
          </div>
        </section>

        {/* Learning Rate */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("finetuneLr")}</h3>
          <div className="max-w-md space-y-2">
            <Slider value={[lrIndex]} onValueChange={(v) => setLrIndex(v[0])} min={0} max={LR_VALUES.length - 1} step={1} />
            <span className="text-sm font-mono">{LR_LABELS[lrIndex]}</span>
          </div>
        </section>

        {/* Run Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={loading} onClick={handleRun}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="mr-2 h-4 w-4" />
              )}
              {t("runFineTune")}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Dataset Split */}
            <section>
              <h3 className="text-lg font-semibold mb-3">{t("datasetSplit")}</h3>
              <div className="flex h-6 rounded-full overflow-hidden max-w-md">
                <div className="bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground" style={{ width: `${result.dataset_split.train * 100}%` }}>
                  {t("train")} {(result.dataset_split.train * 100).toFixed(0)}%
                </div>
                <div className="bg-chart-2 flex items-center justify-center text-[10px] font-medium text-white" style={{ width: `${result.dataset_split.validation * 100}%` }}>
                  {t("validation")} {(result.dataset_split.validation * 100).toFixed(0)}%
                </div>
                <div className="bg-chart-3 flex items-center justify-center text-[10px] font-medium text-white" style={{ width: `${result.dataset_split.test * 100}%` }}>
                  {t("test")} {(result.dataset_split.test * 100).toFixed(0)}%
                </div>
              </div>
            </section>

            {/* Metrics Cards */}
            <section>
              <h3 className="text-lg font-semibold mb-4">{t("results")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <span className="text-sm text-muted-foreground">{t("accuracyBefore")}</span>
                    <div className="text-2xl font-bold font-mono text-yellow-500">{result.accuracy_before.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card className="border-green-500/30">
                  <CardContent className="p-4">
                    <span className="text-sm text-muted-foreground">{t("accuracyAfter")}</span>
                    <div className="text-2xl font-bold font-mono text-green-500">{result.accuracy_after.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-sm text-muted-foreground">{t("improvement")}</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-green-500">+{result.accuracy_improvement.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <span className="text-sm text-muted-foreground">{t("hallucinationBefore")}</span>
                    <div className="text-2xl font-bold font-mono text-red-500">{result.hallucination_before.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card className="border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-sm text-muted-foreground">{t("hallucinationAfter")}</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-green-500">{result.hallucination_after.toFixed(1)}</div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Bar Chart Comparison */}
            <Card>
              <CardContent className="p-4 pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { metric: "Accuracy", [tCommon("before")]: result.accuracy_before, [tCommon("after")]: result.accuracy_after },
                    { metric: "Hallucination", [tCommon("before")]: result.hallucination_before, [tCommon("after")]: result.hallucination_after },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="metric" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey={tCommon("before")} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={tCommon("after")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4 border-t">
              <BackButton currentStep={11} />
              <Button size="lg" onClick={handleNext}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {tCommon("next")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
