"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiGet } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BackButton } from "@/components/shared/step-navigation";
import {
  ArrowRight,
  Loader2,
  Cpu,
  Layers,
  Box,
  Calendar,
  Database,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface BenchmarkScore {
  name: string;
  description: string;
  score: number;
  max: number;
}

interface Weakness {
  area: string;
  score: number;
  suggestion: string;
}

interface ReportData {
  scores: { data_quality: number; training_stability: number; model_performance: number; cost_efficiency: number };
  benchmarks: Record<string, BenchmarkScore>;
  weaknesses: Weakness[];
  model_summary: {
    size: string;
    parameters: string;
    architecture: string;
    context_window: number;
    training_epochs: number;
    dataset_rows: number;
  };
}

export default function BaseModelReportPage() {
  const t = useTranslations("report");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateStep = useProjectStore((s) => s.updateStep);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await apiGet<ReportData>(`/api/projects/${params.projectId}/report`);
        setReport(data);
        updateStep(9);
      } catch (err) {
        if (!isDemoMode()) {
          console.error(err);
          setLoading(false);
          return;
        }
        setReport({
          scores: { data_quality: 65, training_stability: 72, model_performance: 58, cost_efficiency: 70 },
          benchmarks: {
            mmlu: { name: "MMLU", description: "Massive Multitask Language Understanding", score: 45.2, max: 90 },
            hellaswag: { name: "HellaSwag", description: "Commonsense Reasoning", score: 52.8, max: 95 },
            arc: { name: "ARC-Challenge", description: "Science Questions", score: 38.5, max: 85 },
            truthfulqa: { name: "TruthfulQA", description: "Truthfulness", score: 35.1, max: 70 },
            winogrande: { name: "WinoGrande", description: "Coreference Resolution", score: 48.3, max: 85 },
            gsm8k: { name: "GSM8K", description: "Grade School Math", score: 28.7, max: 80 },
          },
          weaknesses: [
            { area: "GSM8K", score: 28.7, suggestion: "Consider adding more grade school math training data." },
            { area: "Data Quality", score: 65, suggestion: "Improve dataset quality through better cleaning and curation." },
          ],
          model_summary: { size: "medium", parameters: "7B", architecture: "dense", context_window: 4096, training_epochs: 3, dataset_rows: 50000 },
        });
        updateStep(9);
      }
      setLoading(false);
    }
    fetchReport();
  }, [params.projectId, updateStep]);

  function handleNext() {
    router.push(`/projects/${params.projectId}/customization`);
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <StepHeader title={t("title")} description={t("description")} stepNumber={8} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!report) return null;

  const benchmarkData = Object.values(report.benchmarks).map((b) => ({
    name: b.name,
    score: b.score,
    max: b.max,
    percentage: (b.score / b.max) * 100,
  }));

  const overallPerf = report.scores.model_performance;

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={8} />
      <ConceptCard stepKey="report" />

      <div className="space-y-8">
        {/* Model Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">{t("modelSummary")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("parameters")}</div>
                  <div className="text-lg font-bold font-mono">{report.model_summary.parameters}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("architecture")}</div>
                  <div className="text-lg font-bold capitalize">{report.model_summary.architecture}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Box className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("contextWindow")}</div>
                  <div className="text-lg font-bold font-mono">{(report.model_summary.context_window / 1024).toFixed(0)}K</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("trainingEpochs")}</div>
                  <div className="text-lg font-bold font-mono">{report.model_summary.training_epochs}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{t("datasetRows")}</div>
                  <div className="text-lg font-bold font-mono">{report.model_summary.dataset_rows.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{t("overallPerformance")}</div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  overallPerf >= 70 ? "text-green-500" : overallPerf >= 40 ? "text-yellow-500" : "text-red-500"
                )}>
                  {overallPerf.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benchmarks Chart */}
        <section>
          <h3 className="text-lg font-semibold mb-4">{t("benchmarks")}</h3>
          <Card>
            <CardContent className="p-4 pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={benchmarkData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {benchmarkData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.percentage >= 60 ? "hsl(var(--chart-1))" : entry.percentage >= 40 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Individual Benchmark Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {Object.values(report.benchmarks).map((bench) => (
              <Card key={bench.name}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{bench.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {bench.score.toFixed(1)}/{bench.max}
                    </span>
                  </div>
                  <Progress value={(bench.score / bench.max) * 100} className="h-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">{bench.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Weakness Analysis */}
        {report.weaknesses.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4">{t("weaknesses")}</h3>
            <div className="space-y-3">
              {report.weaknesses.map((w, i) => (
                <Card key={i} className="border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{w.area}</span>
                          <Badge variant="secondary" className="text-xs">
                            {w.score.toFixed(1)}
                          </Badge>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{w.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between pt-4 border-t">
          <BackButton currentStep={8} />
          <Button size="lg" onClick={handleNext}>
            <ArrowRight className="mr-2 h-4 w-4" />
            {tCommon("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
