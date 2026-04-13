"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Target,
  AlertTriangle,
  Gauge,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

interface EvalResult {
  scores: { data_quality: number; training_stability: number; model_performance: number; cost_efficiency: number };
  metrics: {
    accuracy: number;
    hallucination_risk: number;
    response_quality: number;
    latency_ms: number;
  };
  comparison: {
    base: number;
    finetuned: number;
    rag: number;
  };
}

export default function EvaluationCenterPage() {
  const t = useTranslations("evaluation");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateStep = useProjectStore((s) => s.updateStep);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);

  async function handleRun() {
    setLoading(true);

    try {
      const data = await apiPost<EvalResult>(
        `/api/projects/${params.projectId}/simulate/evaluation`
      );
      setResult(data);
      updateStep(14);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      setResult({
        scores: { data_quality: 65, training_stability: 72, model_performance: 73.5, cost_efficiency: 70 },
        metrics: { accuracy: 78.5, hallucination_risk: 26.5, response_quality: 70.5, latency_ms: 150 },
        comparison: { base: 44.1, finetuned: 73.5, rag: 66.2 },
      });
      updateStep(14);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/deployment`);
  }

  function getVerdict(perf: number) {
    if (perf >= 70) return { key: "verdictGood", icon: CheckCircle2, color: "text-green-500", bg: "border-green-500/30 bg-green-500/5" };
    if (perf >= 50) return { key: "verdictMedium", icon: Info, color: "text-yellow-500", bg: "border-yellow-500/30 bg-yellow-500/5" };
    return { key: "verdictPoor", icon: AlertCircle, color: "text-red-500", bg: "border-red-500/30 bg-red-500/5" };
  }

  const comparisonData = result ? [
    { name: t("base"), score: result.comparison.base },
    { name: t("finetuned"), score: result.comparison.finetuned },
    { name: t("ragModel"), score: result.comparison.rag },
  ] : [];

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={13} />
      <ConceptCard stepKey="evaluation" />

      <div className="space-y-8">
        {/* Run Evaluation */}
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Button size="lg" onClick={handleRun}>
              <Target className="mr-2 h-5 w-5" />
              {t("runEvaluation")}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
          </div>
        )}

        {result && (
          <>
            {/* Performance Metrics */}
            <section>
              <h3 className="text-lg font-semibold mb-4">{t("metrics")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Accuracy */}
                <Card className="border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">{t("accuracy")}</span>
                    </div>
                    <div className="text-3xl font-bold font-mono text-center mb-2">
                      {result.metrics.accuracy.toFixed(1)}
                    </div>
                    <Progress value={result.metrics.accuracy} className="h-2" />
                  </CardContent>
                </Card>

                {/* Hallucination Risk */}
                <Card className={cn(
                  result.metrics.hallucination_risk > 50 ? "border-red-500/20" : "border-green-500/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">{t("hallucinationRisk")}</span>
                    </div>
                    <div className={cn(
                      "text-3xl font-bold font-mono text-center mb-2",
                      result.metrics.hallucination_risk <= 30 ? "text-green-500" :
                      result.metrics.hallucination_risk <= 50 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {result.metrics.hallucination_risk.toFixed(1)}
                    </div>
                    <Progress value={result.metrics.hallucination_risk} className="h-2" />
                  </CardContent>
                </Card>

                {/* Response Quality */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Gauge className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t("responseQuality")}</span>
                    </div>
                    <div className={cn(
                      "text-3xl font-bold font-mono text-center mb-2",
                      result.metrics.response_quality >= 70 ? "text-green-500" : "text-yellow-500"
                    )}>
                      {result.metrics.response_quality.toFixed(1)}
                    </div>
                    <Progress value={result.metrics.response_quality} className="h-2" />
                  </CardContent>
                </Card>

                {/* Latency */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("latency")}</span>
                    </div>
                    <div className="text-3xl font-bold font-mono text-center mb-2">
                      {result.metrics.latency_ms}
                    </div>
                    <span className="text-xs text-muted-foreground block text-center">ms</span>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Model Comparison */}
            <section>
              <h3 className="text-lg font-semibold mb-4">{t("modelComparison")}</h3>
              <Card>
                <CardContent className="p-4 pt-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Verdict */}
            <section>
              {(() => {
                const verdict = getVerdict(result.metrics.accuracy);
                const VerdictIcon = verdict.icon;
                return (
                  <Card className={verdict.bg}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <VerdictIcon className={cn("h-5 w-5", verdict.color)} />
                        <span className={cn("font-semibold", verdict.color)}>{t("verdict")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t(verdict.key)}</p>
                    </CardContent>
                  </Card>
                );
              })()}
            </section>

            <div className="flex justify-between pt-4 border-t">
              <BackButton currentStep={13} />
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
